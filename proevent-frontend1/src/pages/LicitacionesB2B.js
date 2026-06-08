import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiCalendar, FiExternalLink, FiSearch, FiFilter } from 'react-icons/fi';
import './../css/PortalProveedores.css';

const API = "http://localhost:8080";

export default function LicitacionesB2B({ onGoToLogin }) {
  const [licitaciones, setLicitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');

  useEffect(() => {
    const fetchLicitaciones = async () => {
      try {
        const res = await fetch(`${API}/api/licitaciones-abiertas`);
        if (!res.ok) throw new Error('No se pudieron cargar las licitaciones');
        const data = await res.json();
        setLicitaciones(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLicitaciones();
  }, []);

  const categoriasUnicas = ['Todas', ...new Set(licitaciones.map(l => l.categoria_servicio))];

  const filteredLicitaciones = licitaciones.filter(l => {
    const matchSearch = l.nombre_evento.toLowerCase().includes(search.toLowerCase()) || 
                        l.descripcion_requerimientos.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoriaFilter === 'Todas' || l.categoria_servicio === categoriaFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="b2b-public-container" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#1e293b', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Portal Público de Licitaciones B2B</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Explora las oportunidades de negocio y requerimientos logísticos activos de la UAPA. Registra tu empresa y envía tus cotizaciones de manera directa.
          </p>
        </header>

        <div className="filters-bar" style={{ display: 'flex', gap: '16px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div className="filter-group" style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Buscar por evento o requerimiento..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
            />
          </div>
          <div className="filter-group" style={{ flex: '0 0 250px', position: 'relative' }}>
            <FiFilter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <select 
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', appearance: 'none', backgroundColor: '#fff' }}
            >
              {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button 
            onClick={onGoToLogin}
            style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Acceso Proveedores <FiExternalLink />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Cargando licitaciones...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px' }}>{error}</div>
        ) : filteredLicitaciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <FiBriefcase size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#475569', fontSize: '1.2rem', marginBottom: '8px' }}>No hay licitaciones abiertas</h3>
            <p style={{ color: '#94a3b8' }}>En este momento no hay requerimientos activos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {filteredLicitaciones.map(lic => (
              <div key={lic.id_solicitud} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '600' }}>
                    {lic.categoria_servicio}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCalendar /> Cierra: {new Date(lic.fecha_limite).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px', fontWeight: 'bold' }}>{lic.nombre_evento}</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px', flex: '1' }}>
                  {lic.descripcion_requerimientos}
                </p>
                <button 
                  onClick={onGoToLogin}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#e2e8f0'; e.target.style.color = '#0f172a'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = '#f1f5f9'; e.target.style.color = '#334155'; }}
                >
                  Enviar Oferta <FiExternalLink />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
