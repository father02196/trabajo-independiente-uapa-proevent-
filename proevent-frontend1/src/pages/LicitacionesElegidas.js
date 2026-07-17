import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiExternalLink, FiSearch } from 'react-icons/fi';
import '../css/Dashboard.css';

const API = "http://localhost:8080";

export default function LicitacionesElegidas() {
  const [licitaciones, setLicitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    cargarLicitaciones();
  }, []);

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
          <div style={{ padding: '20px 22px', display: 'flex', justifyContent: 'flex-start' }}>
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
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando historial...</div>
          ) : (
            <div className="table-responsive" style={{ padding: '0 22px 22px 22px', overflowX: 'auto' }}>
              <table className="modern-table" style={{ width: '100%', minWidth: '1300px', fontSize: '13px', whiteSpace: 'nowrap' }}>
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
                  {filtradas.map(l => (
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
        </div>
      </div>
    </div>
  );
}
