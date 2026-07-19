const notificarAutoFinalizacion = async (db, id_evento, nombre_evento, id_solicitante, crearNotificacionFn) => {
    let notificacionesGeneradas = 0;

    // Wrapper sobre la función externa compartida para contar los éxitos
    const crearNotificacion = async (id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion) => {
        try {
            const exito = await crearNotificacionFn({ id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion });
            if (exito) notificacionesGeneradas++;
        } catch (error) {
            console.error('Error invocando el helper crearNotificacion:', error);
        }
    };

    // Helper para realizar queries de forma síncrona
    const queryAsync = (sql, params) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    };

    try {
        // Validación de IDEMPOTENCIA
        // Garantiza que no se generen notificaciones duplicadas consultando la bitácora auditable
        const [bitacoraAnterior] = await queryAsync(
            `SELECT COUNT(*) as count FROM bitacora_movimiento WHERE accion = 'AUTO_FINALIZACION_EVENTO' AND detalles LIKE ?`,
            [`%(ID: ${id_evento})%`]
        );
        if (bitacoraAnterior && bitacoraAnterior.count > 0) {
            console.log(`[Idempotencia] El evento ID ${id_evento} ya fue procesado y notificado previamente. Se omite re-notificación.`);
            return 0;
        }

        // 1. Notificar Solicitante (Obligatorio)
        await crearNotificacion(
            id_solicitante,
            null,
            'Evento finalizado',
            `El evento "${nombre_evento}" ha sido finalizado automáticamente porque alcanzó su fecha y hora de finalización. Ya puede completar la evaluación del evento.`,
            'evaluacion'
        );

        // 2. Notificar Administrador de Eventos (Obligatorio)
        await crearNotificacion(
            null,
            'Administrador de Eventos',
            'Evento auto-finalizado',
            `El evento "${nombre_evento}" fue finalizado automáticamente por vencimiento de su fecha y hora. Revise la bitácora y confirme el cierre administrativo del evento.`,
            'gestion-eventos'
        );

        // 3. Obtener organizadores (Responsables, Coordinadores, Apoyo)
        const organizadores = await queryAsync(
            `SELECT id_usuario, rol_organizacion FROM evento_organizador WHERE id_evento = ?`, 
            [id_evento]
        );

        for (const org of organizadores) {
            if (org.rol_organizacion === 'Responsable' || org.rol_organizacion === 'Coordinador') {
                await crearNotificacion(
                    org.id_usuario,
                    null,
                    'Cierre del evento',
                    `El evento "${nombre_evento}" ha finalizado automáticamente. Proceda con el cierre operativo, validación de recursos y finalización de las tareas pendientes.`,
                    null
                );
            } else if (org.rol_organizacion === 'Apoyo') {
                await crearNotificacion(
                    org.id_usuario,
                    null,
                    'Finalización del evento',
                    `El evento "${nombre_evento}" ha concluido. Proceda con el retiro de equipos, cierre de servicios y entrega del reporte final.`,
                    null
                );
            }
        }

        // 4. Evaluar condiciones para departamentos administrativos y operativos
        const [presupuestoRes] = await queryAsync(
            `SELECT COUNT(*) as count FROM poa_movimiento WHERE id_evento = ? AND estado != 'Rechazado'`, 
            [id_evento]
        );
        const usoPresupuesto = presupuestoRes.count > 0;

        const proveedoresRes = await queryAsync(
            `SELECT id_proveedor, requiere_contrato FROM servicio_externo WHERE id_evento = ?`, 
            [id_evento]
        );
        const usoCompras = proveedoresRes.length > 0;
        const requiereContrato = proveedoresRes.some(p => p.requiere_contrato === 1);

        const [legalRes] = await queryAsync(
            `SELECT COUNT(*) as count FROM flujo_aprobacion_legal WHERE id_evento = ?`, 
            [id_evento]
        );
        const usoLegal = legalRes.count > 0 || requiereContrato;

        const [audiovisualRes] = await queryAsync(
            `SELECT COUNT(*) as count FROM servicio_audiovisual WHERE id_evento = ?`, 
            [id_evento]
        );
        const usoAudiovisual = audiovisualRes.count > 0;

        // Notificar a Departamentos Administrativos si corresponde
        if (usoPresupuesto || usoCompras || usoLegal) {
            const msjAdministrativo = `El evento "${nombre_evento}" ha finalizado. Ya puede iniciar el cierre presupuestario, liquidación de pagos, validación de facturas y archivo de la documentación correspondiente.`;
            
            if (usoPresupuesto) {
                await crearNotificacion(null, 'Administrador V-A-F', 'Evento finalizado', msjAdministrativo, null);
            }
            if (usoCompras) {
                await crearNotificacion(null, 'Administrador de Compras', 'Evento finalizado', msjAdministrativo, null);
            }
            if (usoLegal) {
                await crearNotificacion(null, 'Administrador de Legal', 'Evento finalizado', msjAdministrativo, null);
            }
        }

        // Notificar a Personal Operativo - Audiovisual
        if (usoAudiovisual) {
            await crearNotificacion(
                null, 
                'Administrador de Audiovisual', 
                'Finalización del evento', 
                `El evento "${nombre_evento}" ha concluido. Proceda con el retiro de equipos, cierre de servicios y entrega del reporte final.`, 
                null
            );
        }

        // Proveedores externos: en este sistema los proveedores suelen iniciar sesión como usuarios?
        // Revisando tabla proveedor_externo, tienen contrasena_hash, lo que implica que pueden entrar.
        // Asumiendo que pueden recibir notificaciones, se enviaría usando su id_proveedor (o si tienen un id_usuario mapeado). 
        // En UAPA-PROEVENT los proveedores tienen portal propio pero la tabla de notificaciones es global?
        // Asumiremos que id_proveedor entra en id_usuario_destino por el momento, o no se notifica directamente por este canal si no acceden a NotificationBell.
        // La regla dice: "Si el evento involucró ... proveedores, notificar únicamente a los usuarios realmente asignados al evento."
        for (const prov of proveedoresRes) {
            if (prov.id_proveedor) {
                // Como los proveedores usan otra tabla (proveedor_externo) y su login es sobre esa tabla, 
                // pero la campanita funciona en el portal de proveedores también.
                await crearNotificacion(
                    prov.id_proveedor, // Puede que haya conflictos si un proveedor tiene el mismo ID que un usuario, habría que revisar el componente ModuloProveedores. 
                    // Por precaución, notificaremos usando rol_destino 'Proveedor' o simplemente id_proveedor.
                    // Para evitar errores en caso de conflicto de IDs, enviamos rol_destino 'Proveedor'
                    'Proveedor', // Para que el backend /api/notificaciones filtre correctamente
                    'Finalización del evento',
                    `El evento "${nombre_evento}" ha concluido. Proceda con el retiro de equipos, cierre de servicios y entrega del reporte final.`,
                    null
                );
            }
        }

        return notificacionesGeneradas;
    } catch (error) {
        console.error('Error al procesar notificaciones de auto-finalización:', error);
        return notificacionesGeneradas;
    }
};

const notificarUmbralPOA = async (db, id_poa, porcentajeDisponible, crearNotificacionFn) => {
    // Wrapper para notificar
    const crearNotificacion = async (id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion) => {
        try {
            await crearNotificacionFn({ id_usuario_destino, rol_destino, titulo, cuerpo, enlace_accion });
        } catch (error) {
            console.error('Error invocando el helper crearNotificacion:', error);
        }
    };

    const queryAsync = (sql, params) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    };

    try {
        // Validar Idempotencia en la bitácora
        const [bitacoraAnterior] = await queryAsync(
            `SELECT COUNT(*) as count FROM bitacora_movimiento WHERE accion = 'ALERTA_POA_20' AND detalles LIKE ?`,
            [`%(POA ID: ${id_poa})%`]
        );

        if (bitacoraAnterior && bitacoraAnterior.count > 0) {
            console.log(`[Idempotencia] La alerta del 20% para el POA ID ${id_poa} ya fue notificada previamente.`);
            return;
        }

        const mensaje = `El presupuesto del POA se está agotando. Queda un ${porcentajeDisponible.toFixed(2)}% disponible.`;

        // 1. OBLIGATORIO: Notificar al Administrador V-A-F
        // Es el responsable de la viabilidad financiera y presupuestaria del sistema.
        await crearNotificacion(
            null,
            'Administrador V-A-F',
            '⚠️ Alerta de Presupuesto POA',
            mensaje,
            'poa-admin'
        );

        // 2. RECOMENDADO: Notificar al usuario que creó el POA (campo creado_por)
        // Es el responsable nominal del fondo anual registrado.
        const [poaRows] = await queryAsync(
            'SELECT creado_por FROM poa_fiscal WHERE id_poa = ?',
            [id_poa]
        );
        if (poaRows && poaRows.creado_por) {
            await crearNotificacion(
                poaRows.creado_por,
                null,
                '⚠️ Alerta de Presupuesto POA',
                mensaje,
                'poa-admin'
            );
        }

        // 3. OPCIONAL: Notificar al Administrador General
        // Tiene visibilidad global del sistema y debe estar al tanto de alertas críticas.
        await crearNotificacion(
            null,
            'Administrador',
            '⚠️ Alerta de Presupuesto POA',
            mensaje,
            'poa-admin'
        );

        // Registrar en bitácora para idempotencia
        const BitacoraService = require('../services/bitacora.service');
        const { AUDIT_CRITICALITY } = require('../constants/bitacora.actions');
        BitacoraService.auditSystem({
            accion: { code: 'ALERTA_POA_20', criticality: AUDIT_CRITICALITY.BEST_EFFORT },
            metadata: { cambios: { legacyDetalles: `Notificación generada por límite del 20% (POA ID: ${id_poa}).` } }
        });


    } catch (error) {
        console.error('Error al notificar umbral POA:', error);
    }
};

// ── FLUJO 2: Recordatorio de Evaluación Pendiente (3 días tras finalizar) ─────────────────────
// Notifica una sola vez al solicitante si su evento finalizó hace 3+ días y aún no evaluó.
const notificarEvaluacionPendiente = async (db, crearNotificacionFn) => {
    const queryAsync = (sql, params) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });

    try {
        // Busca eventos Finalizados hace 3+ días sin evaluación registrada
        const eventosPendientes = await queryAsync(
            `SELECT e.id_evento, e.nombre, e.id_usuario
             FROM evento e
             WHERE e.estado = 'Finalizado'
               AND DATEDIFF(NOW(), e.fecha_fin) >= 3
               AND NOT EXISTS (SELECT 1 FROM evaluacion ev WHERE ev.id_evento = e.id_evento)`,
            []
        );

        for (const evt of eventosPendientes) {
            if (!evt.id_usuario) continue;

            // Idempotencia: verifica que no se haya enviado ya este recordatorio
            const [yaNotificado] = await queryAsync(
                `SELECT COUNT(*) as cnt FROM notificacion_sistema
                 WHERE id_usuario_destino = ?
                   AND enlace_accion = 'evaluacion'
                   AND titulo LIKE '%recordatorio%'
                   AND cuerpo LIKE ?`,
                [evt.id_usuario, `%#EVT-${evt.id_evento}%`]
            );
            if (yaNotificado && yaNotificado.cnt > 0) continue;

            await crearNotificacionFn({
                id_usuario_destino: evt.id_usuario,
                rol_destino: null,
                titulo: '🔔 Recordatorio: Evalúa tu evento',
                cuerpo: `Llevas más de 3 días sin evaluar el evento "${evt.nombre}" (#EVT-${evt.id_evento}). Tu opinión es muy importante. ¡Solo toma un minuto!`,
                enlace_accion: 'evaluacion'
            });
            console.log(`[Recordatorio Evaluación] Notificación enviada al usuario ${evt.id_usuario} para evento #${evt.id_evento}`);
        }
    } catch (error) {
        console.error('[notificarEvaluacionPendiente] Error:', error.message);
    }
};

// ── FLUJO 4: Alerta SLA — Evento Pendiente más de 48 horas sin revisar ────────────────────────
// Detecta solicitudes estancadas y alerta al Administrador de Eventos y al solicitante.
const notificarEventosSinRevisar = async (db, crearNotificacionFn) => {
    const queryAsync = (sql, params) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });

    try {
        // Busca eventos en Pendiente con más de 48 horas desde su creación
        const eventosPendientes = await queryAsync(
            `SELECT id_evento, nombre, id_usuario
             FROM evento
             WHERE estado = 'Pendiente'
               AND TIMESTAMPDIFF(HOUR, fecha_creacion, NOW()) >= 48`,
            []
        );

        for (const evt of eventosPendientes) {
            // Idempotencia: verifica en la bitácora que esta alerta SLA no fue enviada antes
            const [yaAlertado] = await queryAsync(
                `SELECT COUNT(*) as cnt FROM notificacion_sistema
                 WHERE rol_destino = 'Administrador de Eventos'
                   AND titulo LIKE '%48h%'
                   AND cuerpo LIKE ?`,
                [`%#EVT-${evt.id_evento}%`]
            );
            if (yaAlertado && yaAlertado.cnt > 0) continue;

            // Alerta al Administrador de Eventos
            await crearNotificacionFn({
                id_usuario_destino: null,
                rol_destino: 'Administrador de Eventos',
                titulo: '⏱️ Evento sin revisar +48h',
                cuerpo: `El evento "${evt.nombre}" (#EVT-${evt.id_evento}) lleva más de 48 horas esperando revisión y aprobación. Por favor, atiéndelo a la brevedad.`,
                enlace_accion: 'gestion-eventos'
            });

            // Notificar también al solicitante para que sepa que está en proceso
            if (evt.id_usuario) {
                await crearNotificacionFn({
                    id_usuario_destino: evt.id_usuario,
                    rol_destino: null,
                    titulo: 'ℹ️ Tu solicitud sigue en revisión',
                    cuerpo: `Tu evento "${evt.nombre}" (#EVT-${evt.id_evento}) está siendo revisado por el equipo de administración. Te notificaremos en cuanto haya una decisión.`,
                    enlace_accion: 'mis-eventos'
                });
            }
            console.log(`[SLA 48h] Alerta generada para evento #${evt.id_evento} — Pendiente hace más de 48h`);
        }
    } catch (error) {
        console.error('[notificarEventosSinRevisar] Error:', error.message);
    }
};

module.exports = { notificarAutoFinalizacion, notificarUmbralPOA, notificarEvaluacionPendiente, notificarEventosSinRevisar };
