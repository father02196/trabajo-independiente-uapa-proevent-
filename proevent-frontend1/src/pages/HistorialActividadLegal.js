// ============================================================
// COMPONENTE: HistorialActividadLegal
// Pertenece a: Módulo Legal / Auditoría
// Propósito: Mostrar un historial completo de todas las
// acciones realizadas sobre expedientes legales.
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  FiActivity, FiSearch, FiRefreshCw, FiDownload, FiClock,
  FiUser, FiFileText, FiFilter, FiArrowRight, FiX, FiCalendar,
  FiArrowUp, FiArrowDown, FiChevronDown
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API = "http://localhost:8080";

function HistorialActividadLegal({ usuario }) {
  // --- ESTADOS ---
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('Todos');
  const [filtroUsuario, setFiltroUsuario] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('fecha_hora');
  const [sortOrder, setSortOrder] = useState('desc');

  // --- CARGA DE DATOS ---
  const cargarRegistros = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/auditoria`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRegistros(data);
      } else {
        setRegistros([]);
        if (data.error) toast.error('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el historial de auditoría.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarRegistros(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filtroAccion, filtroUsuario, fechaDesde, fechaHasta, itemsPerPage]);

  // --- FILTRADO ---
  const accionesUnicas = [
    'Firma de documento',
    'Rechazo de documento',
    'Emisión de dictamen (nuevo)',
    'Actualización de dictamen',
    'Devolver con observaciones',
    'Subida de documento a biblioteca',
    'Actualización de documento en biblioteca',
    'Eliminación de documento en biblioteca'
  ];
  const usuariosUnicos = [...new Set(registros.map(r => r.usuario).filter(Boolean))];

  const hayFiltros = search || filtroAccion !== 'Todos' || filtroUsuario !== 'Todos' || fechaDesde || fechaHasta;
  const limpiarFiltros = () => { setSearch(''); setFiltroAccion('Todos'); setFiltroUsuario('Todos'); setFechaDesde(''); setFechaHasta(''); };

  let dataFiltrada = registros.filter(r => {
    const matchBusqueda = !search || 
      (r.usuario || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.evento || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.accion_realizada || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.tipo_documento || '').toLowerCase().includes(search.toLowerCase());
    const matchAccion = filtroAccion === 'Todos' || r.accion_realizada === filtroAccion;
    const matchUsuario = filtroUsuario === 'Todos' || r.usuario === filtroUsuario;
    let matchFecha = true;
    if (fechaDesde && r.fecha_hora) matchFecha = r.fecha_hora.slice(0, 10) >= fechaDesde;
    if (matchFecha && fechaHasta && r.fecha_hora) matchFecha = r.fecha_hora.slice(0, 10) <= fechaHasta;
    if ((fechaDesde || fechaHasta) && !r.fecha_hora) matchFecha = false;
    return matchBusqueda && matchAccion && matchFecha && matchUsuario;
  });

  // Sorting
  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };
  dataFiltrada.sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'fecha_hora': valA = a.fecha_hora || ''; valB = b.fecha_hora || ''; break;
      case 'usuario': valA = (a.usuario || '').toLowerCase(); valB = (b.usuario || '').toLowerCase(); break;
      case 'accion_realizada': valA = (a.accion_realizada || '').toLowerCase(); valB = (b.accion_realizada || '').toLowerCase(); break;
      default: valA = a.fecha_hora || ''; valB = b.fecha_hora || '';
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const paginatedData = dataFiltrada.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ field }) => (
    sortField === field
      ? (sortOrder === 'asc' ? <FiArrowUp size={12} color="#4f46e5" /> : <FiArrowDown size={12} color="#4f46e5" />)
      : <FiChevronDown size={12} color="#94a3b8" />
  );

  // --- EXPORTAR EXCEL REAL (.xlsx) ---
  const exportarExcel = () => {
    if (dataFiltrada.length === 0) return toast.error('No hay datos para exportar.');
    const rows = dataFiltrada.map(r => ({
      'Fecha y Hora': r.fecha_hora ? new Date(r.fecha_hora).toLocaleString('es-DO') : '',
      'Usuario': r.usuario || '',
      'Acción': r.accion_realizada || '',
      'Evento': r.evento || '',
      'Tipo Documento': r.tipo_documento || '',
      'Estado Anterior': r.estado_anterior || '',
      'Estado Nuevo': r.estado_nuevo || '',
      'IP': r.direccion_ip || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría Legal');
    XLSX.writeFile(wb, `Auditoria_Legal_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success('Archivo Excel exportado correctamente.');
  };

  // --- EXPORTAR PDF (tabla HTML a impresión) ---
  const exportarPDF = () => {
    if (dataFiltrada.length === 0) return toast.error('No hay datos para exportar.');
    const printWindow = window.open('', '_blank');
    const tableHTML = `
      <html><head><title>Auditoría Legal - ProEvent</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h2 { color: #1e1b4b; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
        th { background: #1e1b4b; color: #fff; padding: 10px 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }
      </style></head><body>
      <h2>Historial de Actividad Legal</h2>
      <p>Generado: ${new Date().toLocaleString('es-DO')} | Total registros: ${dataFiltrada.length}</p>
      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Evento</th><th>Documento</th><th>Estado Ant.</th><th>Estado Nuevo</th><th>IP</th></tr></thead>
        <tbody>
          ${dataFiltrada.map(r => `<tr>
            <td>${r.fecha_hora ? new Date(r.fecha_hora).toLocaleString('es-DO') : 'N/A'}</td>
            <td>${r.usuario || 'N/A'}</td>
            <td>${r.accion_realizada || ''}</td>
            <td>${r.evento || 'N/A'}</td>
            <td>${r.tipo_documento || 'N/A'}</td>
            <td>${r.estado_anterior || '-'}</td>
            <td>${r.estado_nuevo || '-'}</td>
            <td>${r.direccion_ip || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">UAPA ProEvent — Sistema de Gestión de Eventos</div>
      </body></html>
    `;
    printWindow.document.write(tableHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // --- BADGE DE ACCIÓN ---
  const getAccionBadge = (accion) => {
    if (!accion) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#64748b' }}>N/A</span>;
    if (accion.includes('Firma')) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>✍️ {accion}</span>;
    if (accion.includes('Rechazo')) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>❌ {accion}</span>;
    if (accion.includes('Devolver') || accion.includes('observ')) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#ffedd5', color: '#9a3412' }}>↩️ {accion}</span>;
    if (accion.includes('dictamen') || accion.includes('Emisión')) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#e0e7ff', color: '#3730a3' }}>📋 {accion}</span>;
    if (accion.includes('Actualización')) return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#fef9c3', color: '#854d0e' }}>🔄 {accion}</span>;
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>📌 {accion}</span>;
  };

  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiActivity color="#4f46e5" /> Historial de Actividad
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Auditoría completa del sistema jurídico — registro automático de acciones</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={exportarExcel} title="Exportar a Excel" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5'; }} onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5'; }}>
            <FiDownload size={15} /> Excel
          </button>
          <button onClick={exportarPDF} title="Exportar a PDF" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}>
            <FiFileText size={15} /> PDF
          </button>
          <button onClick={cargarRegistros} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
            <FiRefreshCw className={loading ? 'spin-icon' : ''} /> Recargar
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiActivity size={20} color="#2563eb" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Acciones</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{dataFiltrada.length}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiFileText size={20} color="#059669" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Firmas Realizadas</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#059669' }}>{dataFiltrada.filter(r => (r.accion_realizada || '').includes('Firma')).length}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock size={20} color="#4f46e5" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Dictámenes</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#4f46e5' }}>{dataFiltrada.filter(r => (r.accion_realizada || '').includes('dictamen')).length}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUser size={20} color="#ea580c" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Usuarios Activos</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '28px', color: '#ea580c' }}>{new Set(dataFiltrada.map(r => r.usuario).filter(Boolean)).size}</h3>
        </div>
      </div>

      {/* TABLA CON FILTROS */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* BARRA DE FILTROS */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input id="search-auditoria" type="text" placeholder="Buscar por usuario, evento, acción o documento..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <select id="filtro-accion-auditoria" value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todas las acciones</option>
              {accionesUnicas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todos los usuarios</option>
              {usuariosUnicos.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
              <FiCalendar size={14} /> Desde:
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
              Hasta:
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>
            {hayFiltros && (
              <button onClick={limpiarFiltros} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                <FiX size={13} /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: '#ffffff', color: '#64748b', fontSize: '11.5px', borderBottom: '2px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <tr>
                <th onClick={() => toggleSort('fecha_hora')} style={{ padding: '14px 20px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Fecha y Hora <SortIcon field="fecha_hora" /></div></th>
                <th onClick={() => toggleSort('usuario')} style={{ padding: '14px 20px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Usuario <SortIcon field="usuario" /></div></th>
                <th onClick={() => toggleSort('accion_realizada')} style={{ padding: '14px 20px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Acción Realizada <SortIcon field="accion_realizada" /></div></th>
                <th style={{ padding: '14px 20px', fontWeight: '600' }}>Evento</th>
                <th style={{ padding: '14px 20px', fontWeight: '600' }}>Documento</th>
                <th style={{ padding: '14px 20px', fontWeight: '600' }}>Cambio de Estado</th>
                <th style={{ padding: '14px 20px', fontWeight: '600' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FiRefreshCw className="spin-icon" style={{ display: 'inline' }} size={24} /> <p>Cargando historial...</p>
                </td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FiActivity size={32} style={{ display: 'block', margin: '0 auto 8px' }} />
                  No se encontraron registros con los filtros aplicados.
                </td></tr>
              ) : (
                paginatedData.map((r, index) => (
                  <tr key={r.id_auditoria || index} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', color: '#475569', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FiClock size={13} color="#94a3b8" />
                        {r.fecha_hora ? new Date(r.fecha_hora).toLocaleString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiUser size={13} color="#4f46e5" />
                        </div>
                        {r.usuario || 'Sistema'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {getAccionBadge(r.accion_realizada)}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.evento || ''}>
                      {r.evento || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {r.tipo_documento || '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {r.estado_anterior || r.estado_nuevo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', fontWeight: '500' }}>{r.estado_anterior || '-'}</span>
                          <FiArrowRight size={12} color="#94a3b8" />
                          <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#4338ca', fontWeight: '600' }}>{r.estado_nuevo || '-'}</span>
                        </div>
                      ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
                      {r.direccion_ip || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Mostrando <strong style={{ color: '#0f172a' }}>{paginatedData.length}</strong> de <strong style={{ color: '#0f172a' }}>{dataFiltrada.length}</strong> registros</span>
            <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}>
              <option value={10}>10 / pág</option>
              <option value={25}>25 / pág</option>
              <option value={50}>50 / pág</option>
              <option value={100}>100 / pág</option>
            </select>
          </div>
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

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default HistorialActividadLegal;
