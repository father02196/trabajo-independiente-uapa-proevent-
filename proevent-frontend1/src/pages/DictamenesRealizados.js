import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FiFileText, FiSearch, FiRefreshCw, FiEye, FiDownload, FiX, FiUser, FiCalendar, FiHash, FiPackage, FiDollarSign, FiArrowUp, FiArrowDown, FiPrinter, FiFilter, FiChevronDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API = "http://localhost:8080";

const formatPdfUrl = (path) => {
  if (!path) return '';
  return path.startsWith('./') ? `${API}${path.substring(1)}` : path.startsWith('/') ? `${API}${path}` : `${API}/${path}`;
};

function DictamenesRealizados({ usuario }) {
  const [dictamenes, setDictamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('Todos');
  const [sortField, setSortField] = useState('id_evento');
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalDetalle, setModalDetalle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tablaRef = useRef(null);

  const cargarDictamenes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/legal/dictamenes-realizados`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDictamenes(data);
      } else {
        console.error('Respuesta inválida:', data);
        setDictamenes([]);
        if (data.error) toast.error('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar dictámenes realizados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDictamenes(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filtroEstado, fechaDesde, fechaHasta, filtroResponsable, itemsPerPage]);

  // Responsables únicos
  const responsablesUnicos = [...new Set(dictamenes.map(d => d.responsable_legal).filter(Boolean))];

  // Filtrado avanzado
  const hayFiltros = search || filtroEstado !== 'Todos' || fechaDesde || fechaHasta || filtroResponsable !== 'Todos';

  const limpiarFiltros = () => {
    setSearch(''); setFiltroEstado('Todos'); setFechaDesde(''); setFechaHasta(''); setFiltroResponsable('Todos');
  };

  let dataFiltrada = dictamenes.filter(d => {
    const s = search.toLowerCase();
    const matchBusqueda = s === '' ||
      d.nombre_evento?.toLowerCase().includes(s) ||
      d.proveedor_ganador?.toLowerCase().includes(s) ||
      d.id_evento?.toString().includes(s) ||
      (d.numero_orden_compra || '').toLowerCase().includes(s);
    const matchEstado = filtroEstado === 'Todos' || d.estado_legal === filtroEstado;
    const matchResponsable = filtroResponsable === 'Todos' || d.responsable_legal === filtroResponsable;
    let matchFecha = true;
    if (fechaDesde && d.fecha_dictamen) matchFecha = d.fecha_dictamen.slice(0, 10) >= fechaDesde;
    if (matchFecha && fechaHasta && d.fecha_dictamen) matchFecha = d.fecha_dictamen.slice(0, 10) <= fechaHasta;
    if ((fechaDesde || fechaHasta) && !d.fecha_dictamen) matchFecha = false;
    return matchBusqueda && matchEstado && matchFecha && matchResponsable;
  });

  // Ordenamiento multi-columna
  const toggleSort = (field) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  dataFiltrada.sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'id_evento': valA = a.id_evento || 0; valB = b.id_evento || 0; break;
      case 'nombre_evento': valA = (a.nombre_evento || '').toLowerCase(); valB = (b.nombre_evento || '').toLowerCase(); break;
      case 'fecha_dictamen': valA = a.fecha_dictamen || ''; valB = b.fecha_dictamen || ''; break;
      case 'estado_legal': valA = (a.estado_legal || '').toLowerCase(); valB = (b.estado_legal || '').toLowerCase(); break;
      case 'responsable_legal': valA = (a.responsable_legal || '').toLowerCase(); valB = (b.responsable_legal || '').toLowerCase(); break;
      default: valA = a.id_evento || 0; valB = b.id_evento || 0;
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Stats (se calculan sobre dataFiltrada para que reflejen los filtros activos)
  const stats = {
    total: dataFiltrada.length,
    aprobados: dataFiltrada.filter(d => d.estado_legal === 'Aprobado').length,
    rechazados: dataFiltrada.filter(d => d.estado_legal === 'Rechazado').length,
    enRevision: dataFiltrada.filter(d => d.estado_legal === 'En revisión').length,
    observados: dataFiltrada.filter(d => d.estado_legal === 'Observado').length,
  };

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const paginatedData = dataFiltrada.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ field }) => (
    sortField === field
      ? (sortOrder === 'asc' ? <FiArrowUp size={12} color="#4f46e5" /> : <FiArrowDown size={12} color="#4f46e5" />)
      : <FiChevronDown size={12} color="#94a3b8" />
  );

  // Export Excel
  const exportarExcel = () => {
    const rows = dataFiltrada.map(d => ({
      'ID Evento': d.id_evento,
      'Evento': d.nombre_evento,
      'ID Cotización': d.id_cotizacion_ganadora,
      'ID Proveedor': d.id_proveedor,
      'Proveedor': d.proveedor_ganador,
      'OC': d.numero_orden_compra || 'N/A',
      'Estado': d.estado_legal,
      'Fecha Dictamen': d.fecha_dictamen ? new Date(d.fecha_dictamen).toLocaleDateString('es-DO') : 'N/A',
      'Responsable': d.responsable_legal || 'Sin asignar',
      'Monto': d.monto_total_detectado || 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dictámenes');
    XLSX.writeFile(wb, `Dictamenes_Realizados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Archivo Excel generado con éxito.');
  };

  // Export PDF (print)
  const exportarPDF = () => {
    const printWindow = window.open('', '_blank');
    const rows = dataFiltrada.map(d => `
      <tr>
        <td>${d.id_evento}</td>
        <td>${d.nombre_evento}</td>
        <td>${d.id_cotizacion_ganadora}</td>
        <td>${d.id_proveedor}</td>
        <td>${d.proveedor_ganador}</td>
        <td>${d.numero_orden_compra || 'N/A'}</td>
        <td>${d.estado_legal}</td>
        <td>${d.fecha_dictamen ? new Date(d.fecha_dictamen).toLocaleDateString('es-DO') : 'N/A'}</td>
        <td>${d.responsable_legal || 'Sin asignar'}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Dictámenes Realizados - UAPA ProEvent</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 20px; color: #1e1b4b; margin-bottom: 4px; }
        p { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <h1>Dictámenes Realizados</h1>
        <p>Generado: ${new Date().toLocaleDateString('es-DO')} — Total: ${dataFiltrada.length} registros</p>
        <table><thead><tr>
          <th>ID</th><th>Evento</th><th>Cot.</th><th>ID Prov.</th><th>Proveedor</th><th>OC</th><th>Estado</th><th>Fecha</th><th>Responsable</th>
        </tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
    toast.success('Documento PDF listo para imprimir.');
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Aprobado': { bg: '#dcfce7', color: '#166534' },
      'Rechazado': { bg: '#fee2e2', color: '#991b1b' },
      'En revisión': { bg: '#fef3c7', color: '#92400e' },
      'Observado': { bg: '#ffedd5', color: '#9a3412' },
    };
    const s = estilos[estado] || { bg: '#e2e8f0', color: '#475569' };
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{estado}</span>;
  };

  const ActionBtn = ({ icon: Icon, title, onClick, color = '#3b82f6', bgHover = '#e0f2fe' }) => (
    <button onClick={onClick} title={title} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color, width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHover; }} onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}>
      <Icon size={14} />
    </button>
  );

  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiFileText color="#4f46e5" /> Dictámenes Realizados
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Historial completo de dictámenes emitidos por la oficina jurídica</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportarExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'} onMouseLeave={e => e.currentTarget.style.background = '#ecfdf5'}>
            <FiDownload size={15} /> Excel
          </button>
          <button onClick={exportarPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
            <FiPrinter size={15} /> PDF
          </button>
          <button onClick={cargarDictamenes} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            <FiRefreshCw className={loading ? 'spin-icon' : ''} size={15} /> Recargar
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: stats.total, icon: <FiFileText size={18} />, bg: '#eff6ff', color: '#2563eb', iconBg: '#dbeafe' },
          { label: 'Aprobados', value: stats.aprobados, icon: <FiHash size={18} />, bg: '#ecfdf5', color: '#059669', iconBg: '#d1fae5' },
          { label: 'Rechazados', value: stats.rechazados, icon: <FiX size={18} />, bg: '#fef2f2', color: '#dc2626', iconBg: '#fee2e2' },
          { label: 'En Revisión', value: stats.enRevision, icon: <FiRefreshCw size={18} />, bg: '#fffbeb', color: '#d97706', iconBg: '#fef3c7' },
          { label: 'Observados', value: stats.observados, icon: <FiEye size={18} />, bg: '#fff7ed', color: '#ea580c', iconBg: '#ffedd5' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease', cursor: 'default', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div ref={tablaRef} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Filtros Avanzados */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input type="text" placeholder="Buscar por evento, proveedor, OC o ID..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En revisión">En revisión</option>
              <option value="Observado">Observado</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Firmado">Firmado</option>
            </select>
            <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}>
              <option value="Todos">Todos los Responsables</option>
              {responsablesUnicos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
              <FiCalendar size={14} /> Desde:
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
              Hasta:
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>
            {hayFiltros && (
              <button onClick={limpiarFiltros} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                <FiX size={13} /> Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: '#fff', color: '#64748b', fontSize: '11.5px', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th onClick={() => toggleSort('id_evento')} style={{ padding: '14px 16px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ID <SortIcon field="id_evento" /></div></th>
                <th onClick={() => toggleSort('nombre_evento')} style={{ padding: '14px 16px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Evento <SortIcon field="nombre_evento" /></div></th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Proveedor</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>OC</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Dictamen</th>
                <th onClick={() => toggleSort('fecha_dictamen')} style={{ padding: '14px 16px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Fecha <SortIcon field="fecha_dictamen" /></div></th>
                <th onClick={() => toggleSort('responsable_legal')} style={{ padding: '14px 16px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Responsable <SortIcon field="responsable_legal" /></div></th>
                <th onClick={() => toggleSort('estado_legal')} style={{ padding: '14px 16px', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Estado <SortIcon field="estado_legal" /></div></th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><FiRefreshCw className="spin-icon" style={{ display: 'inline' }} size={24} /><p>Cargando dictámenes...</p></td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No se encontraron dictámenes con los filtros actuales.</td></tr>
              ) : (
                paginatedData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>#EVT-{d.id_evento}</td>
                    <td style={{ padding: '14px 16px', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>{d.nombre_evento}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#0369a1', fontWeight: '600', fontSize: '12.5px' }}>{d.proveedor_ganador}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>ID: {d.id_proveedor} · Cot. #{d.id_cotizacion_ganadora}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontWeight: '500' }}>{d.numero_orden_compra || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {d.ruta_dictamen_pdf ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '12px', fontWeight: '600' }}><FiFileText size={13} /> Cargado</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sin cargar</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12.5px' }}>{d.fecha_dictamen ? new Date(d.fecha_dictamen).toLocaleDateString('es-DO') : 'N/A'}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12.5px' }}>{d.responsable_legal || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ padding: '14px 16px' }}>{getEstadoBadge(d.estado_legal)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <ActionBtn icon={FiEye} title="Ver Detalles" onClick={() => setModalDetalle(d)} />
                        {d.ruta_dictamen_pdf && <ActionBtn icon={FiDownload} title="Descargar Dictamen" color="#059669" bgHover="#dcfce7" onClick={() => window.open(formatPdfUrl(d.ruta_dictamen_pdf), '_blank')} />}
                        {d.ruta_oc_pdf && <ActionBtn icon={FiPackage} title="Ver Orden de Compra" color="#d97706" bgHover="#fef3c7" onClick={() => window.open(formatPdfUrl(d.ruta_oc_pdf), '_blank')} />}
                        {d.ruta_cotizacion_pdf && <ActionBtn icon={FiDollarSign} title="Ver Cotización" color="#7c3aed" bgHover="#ede9fe" onClick={() => window.open(formatPdfUrl(d.ruta_cotizacion_pdf), '_blank')} />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer con paginación y selector de registros */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Mostrando <strong style={{ color: '#0f172a' }}>{paginatedData.length}</strong> de <strong style={{ color: '#0f172a' }}>{dataFiltrada.length}</strong> dictámenes</span>
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

      {/* Modal de Detalle */}
      {modalDetalle && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#fff', width: '92%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.2s ease-out', maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ background: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFileText size={20} color="#475569" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Detalle del Dictamen</h4>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>EVT-{modalDetalle.id_evento} · {modalDetalle.nombre_evento}</p>
                </div>
              </div>
              <button onClick={() => setModalDetalle(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiX size={18} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: '24px', background: '#f8fafc' }}>
              {/* Info Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Proveedor</label>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{modalDetalle.proveedor_ganador}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>ID: {modalDetalle.id_proveedor}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Monto</label>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiDollarSign size={16} /> {Number(modalDetalle.monto_total_detectado).toLocaleString('es-DO')}
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Orden de Compra</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{modalDetalle.numero_orden_compra || 'Sin asignar'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Responsable Legal</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><FiUser size={14} color="#6366f1" /> {modalDetalle.responsable_legal || 'Sin asignar'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Fecha Dictamen</label>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><FiCalendar size={14} color="#3b82f6" /> {modalDetalle.fecha_dictamen ? new Date(modalDetalle.fecha_dictamen).toLocaleDateString('es-DO') : 'N/A'}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>Estado</label>
                  {getEstadoBadge(modalDetalle.estado_legal)}
                </div>
              </div>

              {modalDetalle.observacion_legal && (
                <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px' }}>Observaciones Legales</label>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{modalDetalle.observacion_legal}</p>
                </div>
              )}

              {/* Botones de Documentos */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setModalDetalle(null)} style={{ padding: '10px 18px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer', fontSize: '13px' }}>Cerrar</button>
                {modalDetalle.ruta_dictamen_pdf && (
                  <a href={formatPdfUrl(modalDetalle.ruta_dictamen_pdf)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#4f46e5', color: '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '13px' }}>
                    <FiFileText size={15} /> Ver Dictamen
                  </a>
                )}
                {modalDetalle.ruta_oc_pdf && (
                  <a href={formatPdfUrl(modalDetalle.ruta_oc_pdf)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#d97706', color: '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '13px' }}>
                    <FiPackage size={15} /> Ver OC
                  </a>
                )}
                {modalDetalle.ruta_cotizacion_pdf && (
                  <a href={formatPdfUrl(modalDetalle.ruta_cotizacion_pdf)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#7c3aed', color: '#fff', borderRadius: '8px', fontWeight: '600', fontSize: '13px' }}>
                    <FiDollarSign size={15} /> Ver Cotización
                  </a>
                )}
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

export default DictamenesRealizados;
