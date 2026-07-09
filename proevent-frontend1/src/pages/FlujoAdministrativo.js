// ============================================================
// FLUJO ADMINISTRATIVO - Componente Principal
// Pertenece a: Módulo de Administración Operativa (ProEvent)
// Propósito: Gestiona los 3 flujos post-aprobación de un evento:
//   1. Compras y Cotizaciones (Administrador de Compras)
//   2. Presupuesto / VAF (Administrador V-A-F)
//   3. Legal y Contratos (Administrador de Legal)
// Incluye la Bóveda Digital con todos los documentos del evento.
// ============================================================

// Importaciones de React y hooks necesarios
import React, { useState, useEffect } from 'react';

// Iconos de Feather Icons usados en la UI de los paneles y botones
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiTrash2, FiDownload, FiDollarSign, FiShield, FiBriefcase, FiEye, FiRefreshCw } from 'react-icons/fi';

// Sistema de notificaciones flotantes (toasts)
import { toast } from 'react-hot-toast';

// URL base de la API del backend (Node.js/Express en XAMPP)
const API = "http://localhost:8080";

// ============================================================
// COMPONENTE: FlujoAdministrativo
// Recibe: usuario (objeto del usuario logueado con su rol)
// El componente detecta automáticamente el rol y muestra
// solo las pestañas que corresponden a ese perfil.
// ============================================================
export default function FlujoAdministrativo({ usuario }) {

  // --- ESTADOS DE DATOS DEL EVENTO SELECCIONADO ---
  const [eventos, setEventos] = useState([]);                   // Lista de eventos aprobados disponibles
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null); // Evento activo en el selector
  
  const [servicios, setServicios] = useState([]);               // Servicios externos del evento (para OC y contratos)
  const [presupuesto, setPresupuesto] = useState({ estado: 'Pendiente' }); // Estado del flujo de presupuesto VAF
  const [legal, setLegal] = useState({ estado_legal: 'Pendiente', observacion_legal: '' }); // Estado del flujo legal
  const [cotizaciones, setCotizaciones] = useState([]);         // Cotizaciones B2B recibidas de proveedores
  const [documentos, setDocumentos] = useState([]);             // Documentos en la Bóveda Digital del evento
  const [analisisIA, setAnalisisIA] = useState(null);           // Resultado del análisis de IA sobre cotizaciones
  
  // --- DETECCIÓN DE ROL DEL USUARIO ---
  // Determina qué paneles se muestran según el rol del usuario logueado.
  // isGeneralRole: muestra todo (para Administrador General o roles desconocidos)
  const isComprasRole = usuario?.rol === "Administrador de Compras" || usuario?.rol === "Compras";
  const isLegalRole = usuario?.rol === "Administrador de Legal" || usuario?.rol === "Administrador Legal" || usuario?.rol === "Legal";
  const isVAFRole = usuario?.rol === "Administrador V-A-F" || usuario?.rol === "VAF" || usuario?.rol === "Contabilidad";
  const isGeneralRole = !isComprasRole && !isLegalRole && !isVAFRole; // True si no es ninguno de los anteriores

  // --- ESTADO DE LA PESTAÑA ACTIVA ---
  // Inicializa la pestaña activa según el rol: cada rol tiene su pestaña por defecto
  const [tab, setTab] = useState(() => {
    if (isComprasRole) return 'compras';      // Compras ve primero su panel
    if (isLegalRole) return 'legal';           // Legal ve primero su dictamen
    if (isVAFRole) return 'presupuesto';       // VAF ve primero el presupuesto
    return 'compras';                          // Por defecto, pestaña de Compras
  });
  const [loading, setLoading] = useState(false); // Indicador de carga al cambiar de evento
  const [recargandoEventos, setRecargandoEventos] = useState(false); // Indicador de recarga del selector

  // --- FUNCIÓN: cargarEventos ---
  // Obtiene los eventos del backend relevantes para el flujo administrativo.
  // Para el rol Legal: incluye también "Observado" (eventos devueltos para corrección).
  // Para Compras y VAF: solo "Aprobado" y "En Progreso".
  // Se puede llamar manualmente con el botón de recarga.
  const cargarEventos = async () => {
    setRecargandoEventos(true);
    try {
      const res = await fetch(`${API}/eventos`);
      const data = await res.json();
      if (!Array.isArray(data)) { setEventos([]); return; }

      // Los estados base siempre visibles para todos los roles administrativos
      const estadosBase = ["Aprobado", "En Progreso", "Observado"];
      const eventosPermitidos = data.filter(e => estadosBase.includes(e.estado));
      setEventos(eventosPermitidos);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo actualizar la lista de eventos.');
    } finally {
      setRecargandoEventos(false);
    }
  };

  // --- EFECTO: Carga inicial de eventos operativos ---
  useEffect(() => {
    cargarEventos();
  }, []);

  // --- FUNCIÓN: handleSelectEvent ---
  // Se dispara cuando el usuario elige un evento en el selector.
  // Busca el objeto del evento en la lista local y carga todos sus datos
  // administrativos (presupuesto, legal, cotizaciones, documentos).
  const handleSelectEvent = async (e) => {
    const id = e.target.value;
    if (!id) {
      setEventoSeleccionado(null); // Limpia si se deselecciona
      return;
    }
    const evt = eventos.find(ev => ev.id_evento.toString() === id); // Busca el objeto completo
    setEventoSeleccionado(evt);
    cargarDatos(id); // Carga todos los datos del flujo para ese evento
  };

  // --- FUNCIÓN: cargarDatos ---
  // Carga centralizada de todos los datos del flujo administrativo de un evento.
  // Hace 3 peticiones en secuencia:
  //   1. /api/admin_evento/:id → presupuesto VAF, estado legal, cotizaciones B2B
  //   2. /servicios-externos-all → filtra los servicios del evento para OC y contratos
  //   3. cargarDocumentos() → documentos en la Bóveda Digital
  const cargarDatos = async (id_evento) => {
    setLoading(true);
    try {
      // 1. Datos del panel administrativo del evento (VAF + Legal + Cotizaciones)
      const resAdmin = await fetch(`${API}/api/admin_evento/${id_evento}`);
      const dataAdmin = await resAdmin.json();
      setPresupuesto(dataAdmin.presupuesto);        // Estado del presupuesto VAF
      setLegal(dataAdmin.legal);                    // Estado del dictamen legal
      setCotizaciones(dataAdmin.cotizaciones || []); // Lista de cotizaciones B2B

      // 2. Servicios externos del evento (para OC y control de contratos B2B)
      const resServ = await fetch(`${API}/servicios-externos-all`);
      const dataServ = await resServ.json();
      if (Array.isArray(dataServ)) {
        setServicios(dataServ.filter(s => s.id_evento.toString() === id_evento.toString()));
      }

      // 3. Documentos de la Bóveda Digital
      cargarDocumentos(id_evento);

    } catch (err) {
      toast.error('Error al cargar datos del flujo administrativo');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN: cargarDocumentos ---
  // Obtiene la lista de documentos subidos a la Bóveda Digital del evento.
  // Se llama al cargar el evento y también después de subir o eliminar un documento.
  const cargarDocumentos = async (id_evento) => {
    try {
      const resDoc = await fetch(`${API}/api/documentos/${id_evento}`);
      const dataDoc = await resDoc.json();
      setDocumentos(dataDoc); // Actualiza la tabla de la Bóveda Digital
    } catch (err) {
      console.error("Error cargando documentos", err);
    }
  };

  // --- FUNCIÓN: handleUpload ---
  // Sube un documento a la Bóveda Digital del evento.
  // Recibe el evento de cambio del input file, el tipo de documento (ej: "Cotizacion", "Contrato")
  // y opcionalmente el numero de orden de compra si está asociado a un servicio.
  const handleUpload = async (e, tipo_documento, numero_orden_compra = null) => {
    const file = e.target.files[0];
    if (!file) return; // Si no hay archivo seleccionado, no hace nada

    // Validación de tamaño: máximo 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error('El archivo excede el límite de 15MB');
      return;
    }

    // Construye el FormData con los metadatos del documento
    const formData = new FormData();
    formData.append('archivo', file);                            // El archivo binario
    formData.append('id_evento', eventoSeleccionado.id_evento); // ID del evento al que pertenece
    formData.append('tipo_documento', tipo_documento);           // Tipo: Cotizacion, Contrato, OC, etc.
    formData.append('id_usuario_subio', usuario?.id_usuario);   // Auditoría: quién subió el archivo
    if (numero_orden_compra) {
      formData.append('numero_orden_compra', numero_orden_compra); // Asociar a una OC específica
    }

    const loadToast = toast.loading(`Subiendo ${tipo_documento}...`); // Toast de carga mientras sube
    try {
      const res = await fetch(`${API}/api/documentos/upload`, {
        method: 'POST',
        body: formData // No se pone Content-Type, el browser lo asigna con boundary automáticamente
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.mensaje, { id: loadToast });
        cargarDocumentos(eventoSeleccionado.id_evento); // Refresca la Bóveda Digital
      } else {
        toast.error(data.error || 'Error al subir documento', { id: loadToast });
      }
    } catch (err) {
      toast.error('Error de conexión al subir archivo', { id: loadToast });
    }
    e.target.value = null; // Limpia el input file para permitir subir el mismo archivo de nuevo
  };

  // --- FUNCIÓN: archivarDocumento ---
  // Elimina (archiva) un documento de la Bóveda Digital.
  // Solicita confirmación al usuario antes de proceder.
  // Usa DELETE en el endpoint /api/documentos/:id y luego recarga la lista.
  const archivarDocumento = async (id_documento) => {
    if (!window.confirm('¿Seguro que deseas archivar este documento? Ya no será visible aquí.')) return;
    try {
      const res = await fetch(`${API}/api/documentos/${id_documento}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Documento archivado');
        cargarDocumentos(eventoSeleccionado.id_evento); // Refresca la lista de la bóveda
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  // --- FUNCIÓN: guardarCambiosServicio ---
  // Actualiza el número de Orden de Compra (OC) y el flag de "requiere contrato"
  // de un servicio externo específico. Se usa en el panel de Compras (pestaña OC).
  // Se ejecuta al hacer blur en el input de OC o al cambiar el toggle de contrato.
  const guardarCambiosServicio = async (id_servicio_ext, num_oc, req_contrato, id_cot_adj) => {
    try {
      const res = await fetch(`${API}/api/servicio_externo/${id_servicio_ext}/admin`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || '' // Auditoría del usuario que modifica
        },
        body: JSON.stringify({ 
          numero_orden_compra: num_oc,           // Número de OC asignado por Compras
          requiere_contrato: req_contrato ? 1 : 0, // 1=Sí requiere contrato, 0=No
          id_cotizacion_adjudicada: id_cot_adj || null
        })
      });
      if (res.ok) {
        toast.success('Servicio actualizado');
      } else {
        toast.error('Error al actualizar servicio');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  // --- FUNCIÓN: guardarPresupuesto ---
  // Guarda el estado del flujo de presupuesto VAF para el evento seleccionado.
  // El estado puede ser: Pendiente, Asignado, Aprobado o Rechazado.
  // Solo visible y ejecutable por el rol "Administrador V-A-F".
  const guardarPresupuesto = async () => {
    try {
      const res = await fetch(`${API}/api/presupuesto/${eventoSeleccionado.id_evento}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-usuario-id': usuario?.id_usuario || '' // Auditoría del funcionario VAF
        },
        body: JSON.stringify({ estado: presupuesto.estado }) // Envía solo el nuevo estado
      });
      if (res.ok) toast.success('Estado de presupuesto guardado');
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  // --- FUNCIÓN: guardarLegal ---
  // Guarda el dictamen legal del evento: estado (Aprobado/Rechazado/Observado)
  // y las observaciones jurídicas escritas por el abogado.
  // Solo visible y ejecutable por el rol "Administrador de Legal".
  const guardarLegal = async () => {
    if (legal.estado_legal === 'Observado' && !legal.observacion_legal.trim()) {
      return toast.error('Debes escribir un comentario/observación para devolver el evento.');
    }
    
    try {
      if (legal.estado_legal === 'Observado') {
        const res = await fetch(`${API}/api/legal/${eventoSeleccionado.id_evento}/observar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id_usuario: usuario?.id_usuario, 
            comentario: legal.observacion_legal 
          })
        });
        if (res.ok) {
           toast.success('Evento devuelto a solicitante (Observado)');
           setEventoSeleccionado(null);
           // Recargar la lista de eventos para remover el observado de la bandeja
           const evtRes = await fetch(`${API}/eventos`);
           const evtData = await evtRes.json();
           const eventosPermitidos = Array.isArray(evtData) ? evtData.filter(e => e.estado === "Aprobado" || e.estado === "En Progreso") : [];
           setEventos(eventosPermitidos);
        } else {
           toast.error('Error al observar el evento');
        }
      } else {
        const res = await fetch(`${API}/api/flujo_legal/${eventoSeleccionado.id_evento}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-usuario-id': usuario?.id_usuario || '' // Auditoría del abogado revisor
          },
          body: JSON.stringify({ 
            estado_legal: legal.estado_legal,           // Estado del dictamen
            observacion_legal: legal.observacion_legal, // Notas jurídicas del abogado
            id_usuario_revisor: usuario?.id_usuario     // Registro de quién dictó el fallo
          })
        });
        if (res.ok) toast.success('Flujo legal actualizado');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  // --- FUNCIÓN UTILITARIA: calcularAlertaVencimiento ---
  // Calcula cuántos días faltan para que venza la vigencia de una cotización.
  // Devuelve un objeto con texto descriptivo, color y fondo para el badge de alerta.
  // - Vencida (rojo): la fecha de vigencia ya pasó
  // - Vence pronto (naranja): quedan 5 días o menos
  // - Vigente (verde): aún tiene validez suficiente
  const calcularAlertaVencimiento = (fecha_vigencia) => {
    const hoy = new Date();
    const vigencia = new Date(fecha_vigencia);
    const diffTime = vigencia - hoy;                              // Diferencia en milisegundos
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convierte a días
    
    if (diffDays < 0) return { texto: 'Vencida', color: '#ef4444', bg: '#fef2f2' };              // Rojo
    if (diffDays <= 5) return { texto: `Vence en ${diffDays} días`, color: '#f97316', bg: '#fff7ed' }; // Naranja
    return { texto: 'Vigente', color: '#10b981', bg: '#ecfdf5' };                                // Verde
  };

  // --- FUNCIÓN UTILITARIA: agruparCotizacionesPorSolicitud ---
  // Agrupa el array plano de cotizaciones por id_solicitud.
  // Esto permite mostrar en la UI un grupo de ofertas por cada solicitud de cotización,
  // facilitando la comparación entre proveedores para la misma necesidad.
  // Retorna: { [id_solicitud]: [cotizacion1, cotizacion2, ...] }
  const agruparCotizacionesPorSolicitud = () => {
    return cotizaciones.reduce((acc, c) => {
      if (!acc[c.id_solicitud]) acc[c.id_solicitud] = []; // Inicializa el grupo si no existe
      acc[c.id_solicitud].push(c);                        // Agrega la cotización al grupo
      return acc;
    }, {});
  };

  // --- FUNCIÓN: evaluarCotizacionesIA ---
  // Llama al endpoint de IA del backend para analizar y comparar las cotizaciones
  // de un grupo de solicitud. La IA evalúa precios, vigencia, condiciones y recomienda
  // el proveedor más conveniente con una justificación.
  // Solo aparece el botón cuando hay 2+ cotizaciones en el mismo grupo.
  const evaluarCotizacionesIA = async (id_solicitud) => {
    const loadToast = toast.loading('Analizando cotizaciones con Inteligencia Artificial...');
    try {
      const res = await fetch(`${API}/api/admin/evaluar-cotizaciones/${id_solicitud}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Análisis completado', { id: loadToast });
        setAnalisisIA(data.veredicto); // Guarda el veredicto de la IA para mostrarlo en la UI
      } else {
        toast.error(data.error || 'Error en el análisis', { id: loadToast });
      }
    } catch (err) {
      toast.error('Error de conexión con la IA', { id: loadToast });
    }
  };

  const renderCompras = () => {
    const cotizacionesAgrupadas = agruparCotizacionesPorSolicitud();
    return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── PANEL DE COTIZACIONES B2B ── */}
      {Object.keys(cotizacionesAgrupadas).length > 0 && (
        <div className="saas-panel-card">
          <div className="panel-header">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <FiBriefcase className="panel-icon" style={{ fontSize: '24px', color: '#8b5cf6' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Cotizaciones Recibidas B2B</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Revisión y análisis de ofertas de proveedores</p>
              </div>
            </div>
          </div>
          
          <div className="panel-body">
            {Object.entries(cotizacionesAgrupadas).map(([id_solicitud, cotList]) => (
              <div key={id_solicitud} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <strong style={{ color: '#1e293b', fontSize: '14.5px' }}>Solicitud de Cotización #{id_solicitud}</strong>
                  {cotList.length >= 2 && (
                    <button type="button" onClick={() => evaluarCotizacionesIA(id_solicitud)} className="btn btn-primary btn-sm" style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      ✨ Análisis Comparativo con IA
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cotList.map(c => {
                    const alerta = calcularAlertaVencimiento(c.fecha_vigencia);
                    const isRecomendada = analisisIA?.proveedor_recomendado_id === c.id_proveedor;
                    return (
                      <div key={c.id_cotizacion} className={isRecomendada ? '' : 'modern-event-card'} style={isRecomendada ? { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px', borderLeft: `4px solid #22c55e`, border: '1px solid #bbf7d0', boxShadow: '0 4px 12px rgba(34,197,94,0.1)' } : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', flexDirection: 'row' }}>
                        <div>
                          <strong style={{ color: isRecomendada ? '#166534' : '#0f172a', fontSize: '14px' }}>
                            {c.proveedor_nombre} {isRecomendada && '⭐ (Recomendación IA)'}
                          </strong>
                          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span><strong>Monto:</strong> {c.moneda} {c.monto_total_detectado || 'N/A'}</span>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span><strong>Válida hasta:</strong> {new Date(c.fecha_vigencia).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: '600', color: alerta.color, background: alerta.bg, padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {alerta.texto !== 'Vigente' && <FiAlertCircle />} {alerta.texto}
                          </span>
                          <a href={`${API}/${c.ruta_documento_pdf}`} target="_blank" rel="noreferrer" className="details-btn">
                            <FiDownload /> Ver Oferta
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {analisisIA && cotList.some(c => c.id_proveedor === analisisIA.proveedor_recomendado_id) && (
                  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '12px' }}>
                    <h5 style={{ color: '#86198f', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>✨ Veredicto de la IA</h5>
                    <p style={{ fontSize: '13.5px', color: '#4a044e', marginBottom: '16px', lineHeight: '1.6' }}>{analisisIA.justificacion}</p>
                    <table className="modern-table" style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead style={{ background: '#fae8ff' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Proveedor</th>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Costo (DOP)</th>
                          <th style={{ padding: '12px 16px', color: '#701a75' }}>Ventajas Detectadas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analisisIA.matriz_comparativa?.map((mat, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #fae8ff' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#86198f' }}>{mat.proveedor}</td>
                            <td style={{ padding: '12px 16px', color: '#4a044e' }}>RD$ {mat.costo_normalizado_dop}</td>
                            <td style={{ padding: '12px 16px', color: '#4a044e' }}>{mat.ventajas?.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PANEL DE ÓRDENES DE COMPRA ── */}
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiDollarSign className="panel-icon" style={{ fontSize: '24px', color: '#10b981' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Órdenes de Compra</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Gestión de OC por cada servicio externo aprobado</p>
            </div>
          </div>
        </div>
        
        <div className="panel-body">
          {servicios.length === 0 ? (
            <div className="empty-panel-state">
              <FiBriefcase className="empty-icon" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }} />
              <p>No hay servicios externos solicitados para este evento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {servicios.map(s => (
                <div key={s.id_servicio_ext} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: '#f8fafc', transition: 'all 0.2s' }} className="hover:shadow-md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>{s.tipo_servicio} <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'normal' }}>(ID: {s.id_servicio_ext})</span></strong>
                    <span style={{ fontSize: '12px', fontWeight: '600', background: s.estado === 'Aprobado' ? '#d1fae5' : '#e0f2fe', color: s.estado === 'Aprobado' ? '#047857' : '#0369a1', padding: '4px 10px', borderRadius: '99px' }}>
                      {s.estado}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>Cotización Ganadora:</label>
                      <select 
                        className="form-control-premium" 
                        defaultValue={s.id_cotizacion_adjudicada || ''}
                        onChange={(e) => guardarCambiosServicio(s.id_servicio_ext, s.numero_orden_compra, s.requiere_contrato, e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {cotizaciones.filter(c => c.estado === 'Seleccionada').map(c => (
                          <option key={c.id_cotizacion} value={c.id_cotizacion}>
                            ID: {c.id_cotizacion} - {c.moneda} {c.monto_total_detectado}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>Número de Orden de Compra (OC):</label>
                      <input 
                        type="text" 
                        className="form-control-premium" 
                        defaultValue={s.numero_orden_compra || ''}
                        onBlur={(e) => guardarCambiosServicio(s.id_servicio_ext, e.target.value, s.requiere_contrato, s.id_cotizacion_adjudicada)}
                        placeholder="Ej: OC-2026-001"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiUpload /> Cotización
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Cotizacion', s.numero_orden_compra)} />
                      </label>
                      <label className="btn btn-primary" style={{ margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                        <FiUpload /> OC Firmada
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Orden de Compra', s.numero_orden_compra)} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

  const renderPresupuesto = () => (
    <div className="fade-in">
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiDollarSign className="panel-icon" style={{ fontSize: '24px', color: '#f59e0b' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Flujo de Presupuesto (VAF)</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Asignación y certificación de fondos del evento</p>
            </div>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '30px' }}>
          <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ fontWeight: '600', fontSize: '14px', color: '#92400e', display: 'block', marginBottom: '12px' }}>
                Estado de Asignación Presupuestaria:
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                  className="table-select-premium" 
                  value={presupuesto.estado} 
                  onChange={(e) => setPresupuesto({ ...presupuesto, estado: e.target.value })}
                  style={{ width: '100%', maxWidth: '300px', padding: '12px', fontSize: '14px' }}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Asignado">Asignado (Fondos Reservados)</option>
                  <option value="Aprobado">Aprobado (Definitivo)</option>
                  <option value="Rechazado">Rechazado (Sin Fondos)</option>
                </select>
                <button type="submit" className="btn btn-primary" onClick={guardarPresupuesto} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}>
                  <FiCheckCircle /> Guardar Estado
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #fde68a', paddingTop: '20px' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', margin: 0, background: '#fff', borderColor: '#fcd34d', color: '#b45309' }}>
                <FiUpload /> Cargar Certificación de Fondos
                <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Certificacion de Fondos')} />
              </label>
              <p style={{ fontSize: '13px', color: '#b45309', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiFileText /> Suba el PDF de la certificación firmada por Contabilidad o la VAF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLegal = () => (
    <div className="fade-in">
      <div className="panel-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <FiShield className="panel-icon" style={{ fontSize: '24px', color: '#3b82f6' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Aprobaciones y Contratos Legales</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Dictaminar eventos y gestionar bóveda de contratos B2B</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-double-panel">
        <div className="saas-panel-card" style={{ padding: '24px', flex: 2 }}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <h5 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle style={{ color: '#10b981' }}/> Emisión de Dictamen Legal
            </h5>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>Resolución del Caso:</label>
            <select 
              className="table-select-premium" 
              value={legal.estado_legal} 
              onChange={(e) => setLegal({ ...legal, estado_legal: e.target.value })}
              style={{ width: '100%', maxWidth: '300px', marginBottom: '16px' }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado (Devuelto)</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>Observaciones / Notas Jurídicas:</label>
            <textarea 
              className="form-control-premium" 
              rows="4" 
              value={legal.observacion_legal || ''} 
              onChange={(e) => setLegal({ ...legal, observacion_legal: e.target.value })}
              placeholder="Ingrese cualquier observación, enmienda requerida o nota jurídica para el solicitante..."
              style={{ width: '100%', marginBottom: '20px', resize: 'vertical' }}
            />
            <button type="submit" className="btn btn-primary" onClick={guardarLegal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiShield /> Guardar Dictamen Legal
            </button>
          </div>
        </div>

        <div className="saas-panel-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h5 style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiFileText style={{ color: '#8b5cf6' }}/> Control de Contratos B2B
          </h5>
          <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '16px' }}>Marque los servicios de proveedores externos que requieren firma de contrato antes de operar.</p>
          
          <div style={{ flex: 1 }}>
            {servicios.length === 0 ? (
              <div className="empty-panel-state" style={{ padding: '20px 0' }}>
                <p>Sin servicios externos registrados.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {servicios.map(s => (
                  <div key={s.id_servicio_ext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{s.tipo_servicio}</span>
                    <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={s.requiere_contrato} 
                        onChange={(e) => {
                          const updated = [...servicios];
                          const idx = updated.findIndex(u => u.id_servicio_ext === s.id_servicio_ext);
                          updated[idx].requiere_contrato = e.target.checked;
                          setServicios(updated);
                          guardarCambiosServicio(s.id_servicio_ext, s.numero_orden_compra, e.target.checked);
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FiUpload /> Subir Contrato Firmado a Bóveda
              <input type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, 'Contrato')} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentos = () => (
    <div className="fade-in">
      <div className="saas-panel-card">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FiFileText className="panel-icon" style={{ fontSize: '24px', color: '#3b82f6' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Bóveda Digital</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Expediente completo de documentos del evento</p>
            </div>
          </div>
        </div>

        <div className="panel-body" style={{ padding: '0' }}>
          {documentos.length === 0 ? (
            <div className="empty-panel-state" style={{ padding: '60px 20px' }}>
              <FiFileText className="empty-icon" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
              <h5 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '16px' }}>Sin documentos en la bóveda</h5>
              <p>No hay documentos subidos para este evento aún.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>TIPO DE DOCUMENTO</th>
                    <th>Nº OC</th>
                    <th>NOMBRE DEL ARCHIVO</th>
                    <th>SUBIDO POR</th>
                    <th>FECHA</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map(doc => (
                    <tr key={doc.id_documento} className="table-hover-row">
                      <td>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                          {doc.tipo_documento}
                        </span>
                      </td>
                      <td>
                        {doc.numero_orden_compra ? (
                          <span style={{ fontWeight: '600', color: '#0369a1', fontSize: '13px', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                            {doc.numero_orden_compra}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '500' }}>
                          <FiFileText style={{ color: '#64748b', fontSize: '16px' }}/> {doc.nombre_archivo}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13.5px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>
                            {doc.usuario_nombre ? doc.usuario_nombre.charAt(0).toUpperCase() : 'S'}
                          </div>
                          {doc.usuario_nombre || 'Sistema'}
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13.5px' }}>
                        {new Date(doc.fecha_subida).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="saas-action-group" style={{ display: 'inline-flex' }}>
                          {/* Módulo: Bóveda Digital | Función: Botón de Vista Previa 
                              Propósito: Abre el documento en una nueva pestaña del navegador para visualizarlo 
                              sin descargarlo. Este botón está disponible para todos los roles administrativos. */}
                          <a href={`${API}${doc.ruta_archivo}`} target="_blank" rel="noreferrer" className="action-icon-btn view" style={{ color: '#10b981' }} title="Vista Previa">
                            <FiEye />
                          </a>
                          <a href={`${API}${doc.ruta_archivo}`} download target="_blank" rel="noreferrer" className="action-icon-btn" style={{ color: '#3b82f6' }} title="Descargar documento">
                            <FiDownload />
                          </a>
                          <button type="button" className="action-icon-btn delete" onClick={() => archivarDocumento(doc.id_documento)} title="Eliminar / Archivar">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiShield className="header-icon" />
            <div>
              <h3>Flujo Administrativo y Legal</h3>
              <p className="subtitle">Gestión de Compras, Presupuesto (VAF) y Contratos</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', margin: 0 }}>Seleccionar Evento Operativo</label>
            <button
              type="button"
              onClick={cargarEventos}
              disabled={recargandoEventos}
              title="Recargar lista de eventos"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: recargandoEventos ? '#94a3b8' : '#3b82f6',
                background: recargandoEventos ? '#f8fafc' : '#eff6ff',
                border: '1px solid',
                borderColor: recargandoEventos ? '#e2e8f0' : '#bfdbfe',
                borderRadius: '8px',
                cursor: recargandoEventos ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <FiRefreshCw
                size={13}
                style={{
                  animation: recargandoEventos ? 'spin 0.8s linear infinite' : 'none',
                }}
              />
              {recargandoEventos ? 'Actualizando...' : 'Recargar'}
            </button>
          </div>
          <select onChange={handleSelectEvent} className="table-select-premium" style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px' }}>
            <option value="">-- Elige un evento para administrar --</option>
            {eventos.map((ev) => (
              <option key={ev.id_evento} value={ev.id_evento}>
                {`#EVT-${ev.id_evento} — ${ev.nombre} (${ev.estado})`}
              </option>
            ))}
          </select>
        </div>

        {eventoSeleccionado && (
          <div>
            {/* Tabs de Navegación Premium */}
            <div className="flujo-tabs-nav">
              {(isComprasRole || isGeneralRole) && (
                <button 
                  type="button"
                  className={`flujo-tab-btn${tab === 'compras' ? ' active' : ''}`}
                  onClick={() => setTab('compras')} 
                >
                  Compras y Cotizaciones
                </button>
              )}
              {(isVAFRole || isGeneralRole) && (
                <button 
                  type="button"
                  className={`flujo-tab-btn${tab === 'presupuesto' ? ' active' : ''}`}
                  onClick={() => setTab('presupuesto')} 
                >
                  Presupuesto (VAF)
                </button>
              )}
              {(isLegalRole || isGeneralRole) && (
                <button 
                  type="button"
                  className={`flujo-tab-btn${tab === 'legal' ? ' active' : ''}`}
                  onClick={() => setTab('legal')} 
                >
                  Legal y Contratos
                </button>
              )}
              <button 
                type="button"
                className={`flujo-tab-btn${tab === 'documentos' ? ' active' : ''}`}
                onClick={() => setTab('documentos')}
                style={{ marginLeft: 'auto' }}
              >
                Bóveda Digital ({documentos.length})
              </button>
            </div>

            <div style={{ padding: '24px 22px' }}>
              {loading ? (
                <div className="table-state-loading" style={{ padding: '60px 0' }}>
                  <div className="loader"></div>
                  <p>Cargando expediente del evento...</p>
                </div>
              ) : (
                <>
                  {tab === 'compras' && renderCompras()}
                  {tab === 'presupuesto' && renderPresupuesto()}
                  {tab === 'legal' && renderLegal()}
                  {tab === 'documentos' && renderDocumentos()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
