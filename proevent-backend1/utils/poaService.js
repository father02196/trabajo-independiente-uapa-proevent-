const { notificarUmbralPOA } = require('./notificacionService');

// ─────────────────────────────────────────────────────────────────────────────
// Helper interno: verifica si el saldo POA cruzó el umbral del 20%
// y si es así, delega la notificación y bitácora a notificacionService.
// ─────────────────────────────────────────────────────────────────────────────
const _verificarUmbralYNotificar = (db, id_poa, crearNotificacionFn) => {
    db.query(
        'SELECT monto_total, monto_disponible FROM poa_fiscal WHERE id_poa = ?',
        [id_poa],
        async (selErr, results) => {
            if (!selErr && results.length > 0) {
                const poa = results[0];
                const porcentajeDisponible = (poa.monto_disponible / poa.monto_total) * 100;

                // Delega al notificacionService si se cruza el umbral
                if (porcentajeDisponible <= 20) {
                    await notificarUmbralPOA(db, id_poa, porcentajeDisponible, crearNotificacionFn);
                }
            }
        }
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// procesarDescuentoPOA
// Responsabilidades:
//   1. Registrar el movimiento presupuestario (INSERT en poa_movimiento).
//   2. Actualizar el saldo disponible del POA (UPDATE en poa_fiscal).
//   3. Calcular el porcentaje disponible.
//   4. Detectar cruce del umbral 20% y delegar notificación.
//
// Usado en: POST /eventos (creación de evento con monto POA).
// ─────────────────────────────────────────────────────────────────────────────
const procesarDescuentoPOA = (db, id_poa_activo, id_evento, montoPOA, moneda, tasa_cambio, monto_dop, crearNotificacionFn) => {
    db.query(
        `INSERT INTO poa_movimiento (id_poa, id_evento, monto_solicitado_original, moneda_original, tasa_cambio, monto_descontado_dop, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [id_poa_activo, id_evento, montoPOA, moneda || 'DOP', tasa_cambio, monto_dop],
        (poaErr) => {
            if (poaErr) {
                console.error('[poaService] Error al insertar poa_movimiento:', poaErr.message);
                return;
            }
            db.query(
                'UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?',
                [monto_dop, id_poa_activo],
                (updErr) => {
                    if (updErr) {
                        console.error('[poaService] Error al descontar saldo POA:', updErr.message);
                        return;
                    }
                    _verificarUmbralYNotificar(db, id_poa_activo, crearNotificacionFn);
                }
            );
        }
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// reconciliarDescuentoPOA
// Responsabilidades:
//   1. Reembolsar el monto del movimiento previo (si existía y no estaba Rechazado).
//   2. Registrar el nuevo movimiento (o actualizar el existente).
//   3. Aplicar el nuevo descuento al saldo POA.
//   4. Calcular el porcentaje disponible y delegar notificación si cruza 20%.
//
// Usado en: PUT /eventos/:id (edición de evento con reconciliación contable).
// ─────────────────────────────────────────────────────────────────────────────
const reconciliarDescuentoPOA = async (dbPromise, db, id_poa_activo, id_evento, montoPOA, moneda, tasa_cambio, monto_dop, movPrevio, crearNotificacionFn) => {
    try {
        // 1. Reembolso del movimiento previo si corresponde
        if (movPrevio) {
            if (movPrevio.estado !== 'Rechazado') {
                await dbPromise.query(
                    'UPDATE poa_fiscal SET monto_disponible = monto_disponible + ? WHERE id_poa = ?',
                    [movPrevio.monto_descontado_dop, movPrevio.id_poa]
                );
            }

            if (montoPOA > 0) {
                // 2a. Actualizar el movimiento existente con el nuevo monto
                await dbPromise.query(
                    `UPDATE poa_movimiento SET
                        monto_solicitado_original = ?,
                        moneda_original = ?,
                        tasa_cambio = ?,
                        monto_descontado_dop = ?,
                        estado = 'Pendiente',
                        motivo_rechazo = NULL
                     WHERE id_movimiento = ?`,
                    [montoPOA, moneda || 'DOP', tasa_cambio, monto_dop, movPrevio.id_movimiento]
                );
                // 3a. Aplicar nuevo descuento
                await dbPromise.query(
                    'UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?',
                    [monto_dop, movPrevio.id_poa]
                );
                _verificarUmbralYNotificar(db, movPrevio.id_poa, crearNotificacionFn);
            } else {
                // Si el nuevo monto es 0, eliminar el movimiento
                await dbPromise.query('DELETE FROM poa_movimiento WHERE id_movimiento = ?', [movPrevio.id_movimiento]);
            }

        } else if (montoPOA > 0 && id_poa_activo) {
            // 2b. No había movimiento previo: insertar nuevo
            await dbPromise.query(
                `INSERT INTO poa_movimiento (id_poa, id_evento, monto_solicitado_original, moneda_original, tasa_cambio, monto_descontado_dop, estado)
                 VALUES (?, ?, ?, ?, ?, ?, 'Pendiente')`,
                [id_poa_activo, id_evento, montoPOA, moneda || 'DOP', tasa_cambio, monto_dop]
            );
            // 3b. Aplicar descuento
            await dbPromise.query(
                'UPDATE poa_fiscal SET monto_disponible = monto_disponible - ? WHERE id_poa = ?',
                [monto_dop, id_poa_activo]
            );
            _verificarUmbralYNotificar(db, id_poa_activo, crearNotificacionFn);
        }

    } catch (err) {
        console.error('[poaService] Error en reconciliarDescuentoPOA:', err.message);
        throw err; // Relanzar para que el endpoint lo capture
    }
};

module.exports = { procesarDescuentoPOA, reconciliarDescuentoPOA };
