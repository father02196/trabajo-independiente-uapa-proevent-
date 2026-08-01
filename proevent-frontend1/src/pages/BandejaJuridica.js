// ============================================================
// COMPONENTE: BandejaJuridica
// Pertenece a: Módulo Legal / Bandeja de Revisión
// Propósito: Muestra todas las solicitudes que requieren revisión
// jurídica antes de emitir un dictamen. Incluye filtros avanzados,
// badges de prioridad/estado, tiempo transcurrido y acciones.
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  FiInbox, FiSearch, FiRefreshCw, FiEye, FiFileText, FiCheckCircle,
  FiClock, FiX, FiAlertTriangle, FiArrowRight, FiCornerDownLeft,
  FiArrowUp, FiArrowDown, FiUser, FiCalendar, FiMapPin, FiBriefcase,
  FiDollarSign, FiSend
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API = "http://localhost:8080";

const formatPdfUrl = (path) => {
  if (!path) return '';
  return path.startsWith('./') ? `${API}${path.substring(1)}` : path.startsWith('/') ? `${API}${path}` : `${API}/${path}`;
};

function BandejaJuridica({ usuario, setActiveTab }) {
  // --- ESTADOS ---
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas');
  const [filtroDependencia, setFiltroDependencia] = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [sortOrderId, setSortOrderId] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modales
  const [modalExpediente, setModalExpediente] = useState(null);
  const [modalObservacion, setModalObservacion] = useState(null);
  const [textoObservacion, setTextoObservacion] = useState('');
  const [enviandoObservacion, setEnviandoObservacion] = useState(false);

  // --- CARGA DE DATOS ---
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/bandeja-juridica`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSolicitudes(data);
      } else {
        console.error('Respuesta no válida:', data);
        setSolicitudes([]);
        if (data.error) toast.error('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la bandeja jurídica.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroEstado, filtroPrioridad, filtroDependencia, filtroFecha]);

  // --- ACCIONES ---
  const handleIniciarRevision = async (id_evento) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/${id_evento}/iniciar_revision`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-usuario-id': usuario?.id_usuario?.toString() || ''
        },
        body: JSON.stringify({ id_usuario: usuario?.id_usuario })
      });
      if (res.ok) {
        toast.success('Revisión iniciada. Abriendo editor de dictamen...');
        localStorage.setItem('evento_dictamen_legal', id_evento.toString());
        setActiveTab("GestionDictamenes");
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al iniciar revisión.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión al iniciar revisión.');
    }
  };

  const handleDevolverObservacion = async () => {
    if (!textoObservacion.trim()) {
      toast.error('Debe escribir una observación antes de enviar.');
      return;
    }
    setEnviandoObservacion(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/${modalObservacion.id_evento}/observar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-usuario-id': usuario?.id_usuario?.toString() || ''
        },
        body: JSON.stringify({
          id_usuario: usuario?.id_usuario,
          comentario: textoObservacion.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Observación enviada correctamente.');
        setModalObservacion(null);
        setTextoObservacion('');
        cargarSolicitudes();
      } else {
        toast.error(data.error || 'Error al enviar observación.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión al enviar observación.');
    } finally {
      setEnviandoObservacion(false);
    }
  };

  const handleRevisarDocumentos = (solicitud) => {
    if (solicitud.ruta_documento_pdf) {
      window.open(formatPdfUrl(solicitud.ruta_documento_pdf), '_blank');
    } else {
      toast.error('No hay documento PDF disponible para esta solicitud.');
    }
  };

  // --- FILTRADO Y ORDENAMIENTO ---
  const dependenciasUnicas = [...new Set(solicitudes.map(s => s.dependencia).filter(Boolean))].sort();

  let dataFiltrada = solicitudes.filter(s => {
    const matchBusqueda = s.nombre_evento.toLowerCase().includes(search.toLowerCase()) ||
                          s.solicitante.toLowerCase().includes(search.toLowerCase()) ||
                          s.id_evento.toString().includes(search);
    const matchEstado = filtroEstado === 'Todos' || s.estado_legal === filtroEstado;
    const matchPrioridad = filtroPrioridad === 'Todas' || s.prioridad === filtroPrioridad;
    const matchDependencia = filtroDependencia === 'Todas' || s.dependencia === filtroDependencia;
    const matchFecha = filtroFecha === '' || (s.fecha_envio && s.fecha_envio.startsWith(filtroFecha));
    return matchBusqueda && matchEstado && matchPrioridad && matchDependencia && matchFecha;
  });

  dataFiltrada.sort((a, b) => {
    return sortOrderId === 'asc' ? a.id_evento - b.id_evento : b.id_evento - a.id_evento;
  });

  const toggleSortId = () => {
    setSortOrderId(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const paginatedData = dataFiltrada.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- MÉTRICAS ---
  const pendientes = solicitudes.filter(s => s.estado_legal === 'Pendiente').length;
  const enRevision = solicitudes.filter(s => s.estado_legal === 'En revisión').length;
  const observados = solicitudes.filter(s => s.estado_legal === 'Observado').length;
  const prioridadAlta = solicitudes.filter(s => s.prioridad === 'Alta').length;

  // --- BADGES ---
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'En revisión': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e' }}>En revisión</span>;
      case 'Observado': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ffedd5', color: '#9a3412' }}>Observado</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#e2e8f0', color: '#475569' }}>Pendiente</span>;
    }
  };

  const getPrioridadBadge = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🔴 Alta</span>;
      case 'Media': return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🟡 Media</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🟢 Baja</span>;
    }
  };

  const formatTiempoTranscurrido = (dias) => {
    if (dias === null || dias === undefined) return 'N/A';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  };

  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiInbox color="#4f46e5" /> Bandeja Jurídica
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Solicitudes pendientes de revisión jurídica antes de emitir dictamen</p>
        </div>
        <button onClick={cargarSolicitudes} className="btn-modern-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
          <FiRefreshCw className={loading ? 'spin-icon' : ''} /> Recargar
        </button>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock size={20} color="#475569" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Pendientes</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{pendientes}</h3>
        </div>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiEye size={20} color="#d97706" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>En Revisión</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{enRevision}</h3>
        </div>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiAlertTriangle size={20} color="#ea580c" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Observados</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{observados}</h3>
        </div>
        <div className="metric-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiAlertTriangle size={20} color="#dc2626" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Prioridad Alta</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#dc2626' }}>{prioridadAlta}</h3>
        </div>
      </div>

      {/* TABLA CON FILTROS */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* BARRA DE FILTROS */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              id="search-bandeja-juridica"
              type="text"
              placeholder="Buscar por nombre o ID de evento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleSortId}
              title="Ordenar por ID"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', cursor: 'pointer', color: '#475569', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              ID {sortOrderId === 'asc' ? <FiArrowUp size={14} color="#3b82f6" /> : <FiArrowDown size={14} color="#3b82f6" />}
            </button>
            <select id="filtro-estado-bandeja" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado</option>
            </select>
            <select id="filtro-prioridad-bandeja" value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}>
              <option value="Todas">Todas las Prioridades</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
            <select id="filtro-dependencia-bandeja" value={filtroDependencia} onChange={(e) => setFiltroDependencia(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}>
              <option value="Todas">Todas las Dependencias</option>
              {dependenciasUnicas.map((dep, i) => (
                <option key={i} value={dep}>{dep}</option>
              ))}
            </select>
            <input
              id="filtro-fecha-bandeja"
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
            />
          </div>
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead style={{ background: '#ffffff', color: '#64748b', fontSize: '12px', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>ID / Evento</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Solicitante</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Dependencia</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Fecha Envío</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Prioridad</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Tiempo</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><FiRefreshCw className="spin-icon" style={{ display: 'inline' }} size={24} /> <p>Cargando solicitudes...</p></td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FiInbox size={32} style={{ display: 'block', margin: '0 auto 8px' }} />
                  No se encontraron solicitudes con los filtros aplicados.
                </td></tr>
              ) : (
                paginatedData.map((s, index) => (
                  <tr key={`${s.id_evento}-${index}`} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>#EVT-{s.id_evento}</div>
                      <div style={{ color: '#475569', fontSize: '12.5px', marginTop: '2px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.nombre_evento}>{s.nombre_evento}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiUser size={13} color="#3b82f6" />
                        </div>
                        <span style={{ color: '#1e293b', fontWeight: '500', fontSize: '13px' }}>{s.solicitante}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: '13px' }}>{s.dependencia}</td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: '13px' }}>
                      {s.fecha_envio ? new Date(s.fecha_envio).toLocaleDateString('es-DO') : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getPrioridadBadge(s.prioridad)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getEstadoBadge(s.estado_legal)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock size={14} color={s.dias_transcurridos > 7 ? '#dc2626' : s.dias_transcurridos >= 3 ? '#d97706' : '#059669'} />
                        <span style={{ fontWeight: '600', color: s.dias_transcurridos > 7 ? '#dc2626' : s.dias_transcurridos >= 3 ? '#d97706' : '#059669', fontSize: '13px' }}>
                          {formatTiempoTranscurrido(s.dias_transcurridos)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Ver Expediente */}
                        <button onClick={() => setModalExpediente(s)} title="Ver Expediente" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#bae6fd'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiEye size={15} />
                        </button>
                        {/* Revisar Documentos */}
                        <button onClick={() => handleRevisarDocumentos(s)} title="Revisar Documentos" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#8b5cf6', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#f3e8ff'; e.currentTarget.style.borderColor = '#d8b4fe'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiFileText size={15} />
                        </button>
                        {/* Iniciar Revisión */}
                        <button onClick={() => handleIniciarRevision(s.id_evento)} title="Iniciar Revisión" style={{ background: '#4f46e5', border: '1px solid #4338ca', color: '#fff', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
                          <FiArrowRight size={15} />
                        </button>
                        {/* Devolver con Observaciones */}
                        <button onClick={() => { setModalObservacion(s); setTextoObservacion(''); }} title="Devolver con Observaciones" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#ea580c', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#fed7aa'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <FiCornerDownLeft size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
          <span>Mostrando <strong style={{ color: '#0f172a' }}>{paginatedData.length}</strong> de <strong style={{ color: '#0f172a' }}>{dataFiltrada.length}</strong> solicitudes</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '12.5px', fontWeight: '500' }}>Pág. {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODAL: VER EXPEDIENTE ========== */}
      {modalExpediente && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', width: '92%', maxWidth: '580px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header del modal */}
            <div style={{ background: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiBriefcase size={20} color="#475569" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Expediente del Evento</h4>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>#EVT-{modalExpediente.id_evento}</p>
                </div>
              </div>
              <button onClick={() => setModalExpediente(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>

            {/* Contenido del modal */}
            <div style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto', flex: 1 }}>
              {/* Nombre del evento */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Nombre del Evento</label>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{modalExpediente.nombre_evento}</div>
              </div>

              {/* Solicitante y Dependencia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}><FiUser size={11} style={{ marginRight: '4px' }} />Solicitante</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{modalExpediente.solicitante}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}><FiMapPin size={11} style={{ marginRight: '4px' }} />Dependencia</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{modalExpediente.dependencia}</div>
                </div>
              </div>

              {/* Fecha y Tiempo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}><FiCalendar size={11} style={{ marginRight: '4px' }} />Fecha de Envío</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{modalExpediente.fecha_envio ? new Date(modalExpediente.fecha_envio).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}><FiClock size={11} style={{ marginRight: '4px' }} />Tiempo Transcurrido</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: modalExpediente.dias_transcurridos > 7 ? '#dc2626' : modalExpediente.dias_transcurridos >= 3 ? '#d97706' : '#059669' }}>{formatTiempoTranscurrido(modalExpediente.dias_transcurridos)}</div>
                </div>
              </div>

              {/* Estado y Prioridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>Estado Legal</label>
                  {getEstadoBadge(modalExpediente.estado_legal)}
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>Prioridad</label>
                  {getPrioridadBadge(modalExpediente.prioridad)}
                </div>
              </div>

              {/* Proveedor y Monto */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Proveedor Adjudicado</label>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0369a1' }}>{modalExpediente.proveedor_ganador}</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>Cotización #{modalExpediente.id_cotizacion_ganadora}</div>
              </div>

              {modalExpediente.monto_total_detectado && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Monto Total</label>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiDollarSign /> {Number(modalExpediente.monto_total_detectado).toLocaleString('es-DO')}
                  </div>
                </div>
              )}

              {/* Observación legal si existe */}
              {modalExpediente.observacion_legal && (
                <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a', marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#92400e', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}><FiAlertTriangle size={11} style={{ marginRight: '4px' }} />Observación Legal</label>
                  <div style={{ fontSize: '14px', color: '#78350f', lineHeight: '1.5' }}>{modalExpediente.observacion_legal}</div>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => setModalExpediente(null)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Cerrar</button>
                {modalExpediente.ruta_documento_pdf ? (
                  <a href={formatPdfUrl(modalExpediente.ruta_documento_pdf)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3b82f6', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    <FiFileText /> Ver Cotización PDF
                  </a>
                ) : (
                  <button disabled style={{ padding: '10px 20px', background: '#e2e8f0', color: '#94a3b8', borderRadius: '8px', fontWeight: '600', border: 'none' }}>Sin Documento</button>
                )}
                <button onClick={() => { setModalExpediente(null); handleIniciarRevision(modalExpediente.id_evento); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#4f46e5', color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>
                  <FiArrowRight /> Iniciar Revisión
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========== MODAL: DEVOLVER CON OBSERVACIONES ========== */}
      {modalObservacion && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', width: '92%', maxWidth: '520px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.2s ease-out' }}>
            {/* Header */}
            <div style={{ background: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiCornerDownLeft size={20} color="#475569" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Devolver con Observaciones</h4>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px', fontWeight: '500' }}>#EVT-{modalObservacion.id_evento} — {modalObservacion.nombre_evento}</p>
                </div>
              </div>
              <button onClick={() => setModalObservacion(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>

            {/* Contenido */}
            <div style={{ padding: '24px', background: '#f8fafc' }}>
              <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '14px 16px', border: '1px solid #fde68a', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <FiAlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                  Al devolver esta solicitud, el evento será marcado como <strong>Observado</strong> y el solicitante recibirá una notificación con sus comentarios.
                </p>
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Observaciones *</label>
              <textarea
                id="textarea-observacion-bandeja"
                value={textoObservacion}
                onChange={(e) => setTextoObservacion(e.target.value)}
                placeholder="Describa las observaciones legales, documentos faltantes o correcciones necesarias..."
                rows={5}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#ea580c'}
                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button onClick={() => setModalObservacion(null)} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button
                  onClick={handleDevolverObservacion}
                  disabled={enviandoObservacion || !textoObservacion.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    background: enviandoObservacion || !textoObservacion.trim() ? '#fdba74' : '#ea580c',
                    color: '#fff', borderRadius: '8px', fontWeight: '600', cursor: enviandoObservacion || !textoObservacion.trim() ? 'not-allowed' : 'pointer', border: 'none', transition: 'background 0.2s'
                  }}
                >
                  <FiSend size={15} /> {enviandoObservacion ? 'Enviando...' : 'Enviar Observación'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default BandejaJuridica;
