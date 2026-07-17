import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiExternalLink, FiSearch, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import '../css/Dashboard.css';

const API = "http://localhost:8080";

export default function LicitacionesElegidas() {
  const [licitaciones, setLicitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    cargarLicitaciones();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const cargarLicitaciones = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/licitaciones-elegidas');
      setLicitaciones(res.data || []);
    } catch (err) {
      toast.error('Error al cargar licitaciones elegidas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    const f = new Date(fechaISO);
    return f.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filtradas = licitaciones.filter(l =>
    l.nombre_evento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.numero_orden_compra?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtradas.length / itemsPerPage);
  const currentItems = filtradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportarExcel = () => {
    try {
      if (currentItems.length === 0) return toast.error('No hay datos para exportar.');
      
      const dataToExport = currentItems.map(l => ({
        'Fecha Evento': formatearFecha(l.fecha_evento),
        'ID Evento': l.id_evento,
        'Nombre Evento': l.nombre_evento,
        'Subido Por': l.oc_nombre_usuario ? `${l.oc_nombre_usuario} (ID: ${l.oc_id_usuario})` : 'N/A',
        'Orden Compra': l.numero_orden_compra || 'Pendiente',
        'Fecha Subida OC': l.oc_fecha_subida ? formatearFecha(l.oc_fecha_subida) : 'N/A',
        'ID Prov': l.id_proveedor,
        'Proveedor Adjudicado': l.proveedor_nombre,
        'ID Cotización': l.id_cotizacion,
        'Monto (DOP)': l.monto_total_detectado
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Licitaciones");
      
      XLSX.writeFile(workbook, `Licitaciones_Pagina${currentPage}.xlsx`);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Hubo un error al generar el archivo Excel. Por favor, inténtelo de nuevo.');
    }
  };

  const exportarPDF = () => {
    try {
      const element = document.getElementById('tabla-licitaciones');
      if (!element) return toast.error('No se pudo encontrar la tabla.');
      
      const opt = {
        margin:       10,
        filename:     `Licitaciones_Pagina${currentPage}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        toast.success('PDF exportado correctamente');
      });
    } catch (error) {
      console.error(error);
      toast.error('Hubo un error al generar el archivo PDF. Por favor, inténtelo de nuevo.');
    }
  };

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiCheckCircle className="header-icon" />
            <div>
              <h3>Historial de Licitaciones Elegidas</h3>
              <p className="subtitle">Registro global de adjudicaciones con órdenes de compra</p>
            </div>
          </div>
        </div>

        <div className="panel-body">
          <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '8px 16px', width: '350px' }}>
              <FiSearch style={{ color: '#64748b', marginRight: '8px' }} />
              <input
                id="search-licitaciones"
                name="search-licitaciones"
                autoComplete="off"
                type="text"
                placeholder="Buscar por evento, proveedor o OC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
              />
            </div>

            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FiDownload /> Exportar Vista
              </button>
              
              {showExportMenu && (
                <div 
                  className="dropdown-export" 
                  style={{ position: 'absolute', right: 0, top: '100%', marginTop: '5px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '160px', overflow: 'hidden' }}
                >
                  <button 
                    onClick={() => { exportarPDF(); setShowExportMenu(false); }} 
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', fontSize: '13.5px', color: '#334155' }}>
                    📄 Exportar a PDF
                  </button>
                  <button 
                    onClick={() => { exportarExcel(); setShowExportMenu(false); }} 
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13.5px', color: '#334155' }}>
                    📊 Exportar a Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando historial...</div>
          ) : (
            <div className="table-responsive" style={{ padding: '0 22px 22px 22px', overflowX: 'auto', background: '#fff' }}>
              <table id="tabla-licitaciones" className="modern-table" style={{ width: '100%', minWidth: '1150px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>
                    <th>Fecha Evento</th>
                    <th>Evento</th>
                    <th>Subido Por (OC)</th>
                    <th>Orden Compra</th>
                    <th>Fecha Subida OC</th>
                    <th>ID Prov.</th>
                    <th>Proveedor Adjudicado</th>
                    <th>ID Cotización</th>
                    <th>Monto (DOP)</th>
                    <th>Cotización Original</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((l, idx) => (
                    <tr key={l.id_cotizacion}>
                      <td style={{ color: '#475569' }}>{formatearFecha(l.fecha_evento)}</td>
                      <td style={{ fontWeight: '500', color: '#0f172a' }}>
                        #{l.id_evento} - {l.nombre_evento}
                      </td>
                      <td>
                        {l.oc_id_usuario ? (
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ fontWeight: 'bold', color: '#334155' }}>{l.oc_nombre_usuario}</span> (ID: {l.oc_id_usuario})
                          </div>
                        ) : <span style={{ color: '#94a3b8' }}>N/A</span>}
                      </td>
                      <td>
                        {l.numero_orden_compra ? (
                          <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#334155' }}>
                            {l.numero_orden_compra}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Pendiente</span>
                        )}
                      </td>
                      <td>
                        {l.oc_fecha_subida ? formatearFecha(l.oc_fecha_subida) : <span style={{ color: '#94a3b8' }}>N/A</span>}
                      </td>
                      <td style={{ color: '#64748b' }}>#{l.id_proveedor}</td>
                      <td style={{ color: '#3b82f6', fontWeight: '600' }}>{l.proveedor_nombre}</td>
                      <td style={{ color: '#64748b' }}>#{l.id_cotizacion}</td>
                      <td>RD$ {l.monto_total_detectado}</td>
                      <td>
                        {l.ruta_documento_pdf ? (
                          <a href={`${API}${l.ruta_documento_pdf.replace(/^\.\//, '/')}`} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FiExternalLink /> Ver Cotización
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>No adjunto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No se encontraron licitaciones adjudicadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && totalPages > 1 && (
            <div className="pagination-container" style={{ padding: '15px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="pagination-info" style={{ fontSize: '13px', color: '#64748B' }}>
                Mostrando página <strong style={{ color: '#0F172A', fontWeight: 700 }}>{currentPage}</strong> de {totalPages} (Total: {filtradas.length})
              </div>
              <div className="pagination-controls" style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}>
                  Anterior
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}>
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
