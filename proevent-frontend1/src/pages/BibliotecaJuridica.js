// ============================================================
// COMPONENTE: BibliotecaJuridica
// Pertenece a: Módulo Legal
// Propósito: Repositorio central de documentos legales
// ============================================================

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  FiBookOpen, FiSearch, FiRefreshCw, FiDownload, FiUploadCloud,
  FiFileText, FiTrash2, FiEdit3, FiShare2, FiEye, FiX, FiFilter
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const API = "http://localhost:8080";
const CATEGORIAS = ['Contratos', 'Reglamentos', 'Políticas', 'Leyes', 'Resoluciones', 'Plantillas'];

function BibliotecaJuridica({ usuario }) {
  // --- ESTADOS ---
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modales
  const [modalUpload, setModalUpload] = useState(false);
  const [modalEdit, setModalEdit] = useState({ open: false, doc: null });
  const [modalPdf, setModalPdf] = useState({ open: false, url: '', titulo: '' });
  
  // Formulario Upload
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadNombre, setUploadNombre] = useState('');
  const [uploadCategoria, setUploadCategoria] = useState(CATEGORIAS[0]);
  const [isUploading, setIsUploading] = useState(false);

  // --- FORMATO ---
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatPdfUrl = (ruta) => {
    if (!ruta) return '';
    return ruta.startsWith('http') ? ruta : `${API}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  };

  // --- API CALLS ---
  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/legal/biblioteca`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setDocumentos(data);
      else { setDocumentos([]); if (data.error) toast.error(data.error); }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la biblioteca.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDocumentos(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search, filtroCategoria]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return toast.error('Selecciona un archivo.');
    setIsUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('archivo', fileToUpload);
    formData.append('categoria', uploadCategoria);
    if (uploadNombre) formData.append('nombre_archivo', uploadNombre);

    try {
      const res = await fetch(`${API}/api/legal/biblioteca`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.mensaje || 'Documento subido');
        setModalUpload(false);
        setFileToUpload(null);
        setUploadNombre('');
        cargarDocumentos();
      } else throw new Error(data.error);
    } catch (err) {
      toast.error(err.message || 'Error al subir documento');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/legal/biblioteca/${modalEdit.doc.id_documento}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre_archivo: modalEdit.doc.nombre_archivo, categoria: modalEdit.doc.categoria })
      });
      if (res.ok) {
        toast.success('Documento actualizado');
        setModalEdit({ open: false, doc: null });
        cargarDocumentos();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message || 'Error actualizando documento');
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"? Esta acción se registrará en la auditoría.`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/legal/biblioteca/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Documento eliminado');
        cargarDocumentos();
      } else throw new Error('Error al eliminar');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCompartir = (ruta) => {
    const urlCompleta = formatPdfUrl(ruta);
    navigator.clipboard.writeText(urlCompleta);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleDescargar = async (ruta, nombre) => {
    try {
      const res = await fetch(formatPdfUrl(ruta));
      if (!res.ok) throw new Error('Error de descarga');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = nombre || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('No se pudo descargar el archivo.');
    }
  };

  // --- FILTRADO LOCAL ---
  const dataFiltrada = documentos.filter(d => {
    const matchBusqueda = (d.nombre_archivo || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filtroCategoria === 'Todas' || d.categoria === filtroCategoria;
    return matchBusqueda && matchCat;
  });

  const totalPages = Math.ceil(dataFiltrada.length / itemsPerPage);
  const paginatedData = dataFiltrada.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- KPI ---
  const ultimosAgregados = documentos.filter(d => {
    if (!d.fecha_carga) return false;
    const dias = (new Date() - new Date(d.fecha_carga)) / (1000 * 3600 * 24);
    return dias <= 7;
  }).length;
  const docsContratos = documentos.filter(d => d.categoria === 'Contratos').length;

  return (
    <div className="admin-page-container fade-in" style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiBookOpen color="#4f46e5" /> Biblioteca Jurídica
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Repositorio centralizado de documentos legales, plantillas y normativas.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setModalUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }} className="scale-up-hover">
            <FiUploadCloud size={16} /> Subir Documento
          </button>
        </div>
      </div>

      {/* MÉTRICAS (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiFileText size={24} color="#3b82f6" />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total de Documentos</span>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{documentos.length}</h3>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUploadCloud size={24} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Últimos Agregados (7d)</span>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{ultimosAgregados}</h3>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiBookOpen size={24} color="#6366f1" />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Contratos Activos</span>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{docsContratos}</h3>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Filtros */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input type="text" placeholder="Buscar documento por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}>
            <option value="Todas">Todas las Categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ background: '#fff', color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Nombre del Documento</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Categoría</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Fecha de Carga</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Tamaño</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Responsable</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><FiRefreshCw className="spin-icon" size={24} /></td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No hay documentos en la biblioteca.</td></tr>
              ) : (
                paginatedData.map(d => (
                  <tr key={d.id_documento} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiFileText color="#6366f1" /> {d.nombre_archivo}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#eff6ff', color: '#2563eb' }}>
                        {d.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>
                      {d.fecha_carga ? new Date(d.fecha_carga).toLocaleDateString('es-DO') : '-'}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>{formatBytes(d.tamano_bytes)}</td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{d.responsable || 'Sistema'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => setModalPdf({ open: true, url: formatPdfUrl(d.ruta_archivo), titulo: d.nombre_archivo })} title="Ver PDF" style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}><FiEye size={15} /></button>
                        <button onClick={() => handleDescargar(d.ruta_archivo, d.nombre_archivo)} title="Descargar" style={{ background: '#ecfdf5', border: 'none', color: '#10b981', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}><FiDownload size={15} /></button>
                        <button onClick={() => handleCompartir(d.ruta_archivo)} title="Compartir Enlace" style={{ background: '#f5f3ff', border: 'none', color: '#8b5cf6', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}><FiShare2 size={15} /></button>
                        <button onClick={() => setModalEdit({ open: true, doc: { ...d } })} title="Editar Metadata" style={{ background: '#fffbeb', border: 'none', color: '#d97706', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}><FiEdit3 size={15} /></button>
                        <button onClick={() => handleEliminar(d.id_documento, d.nombre_archivo)} title="Eliminar" style={{ background: '#fef2f2', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer' }}><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL UPLOAD */}
      {modalUpload && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s' }}>
          <div className="scale-up" style={{ background: '#fff', width: '90%', maxWidth: '450px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Subir Documento a Biblioteca</h3>
              <button onClick={() => setModalUpload(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleUpload} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Archivo (PDF, DOCX)</label>
                <input type="file" required onChange={e => {
                  setFileToUpload(e.target.files[0]);
                  if (e.target.files[0] && !uploadNombre) {
                    setUploadNombre(e.target.files[0].name.split('.')[0]);
                  }
                }} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Nombre del Documento</label>
                <input type="text" required value={uploadNombre} onChange={e => setUploadNombre(e.target.value)} placeholder="Ej: Reglamento Interno v2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Categoría</label>
                <select value={uploadCategoria} onChange={e => setUploadCategoria(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setModalUpload(false)} style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isUploading} style={{ padding: '10px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                  {isUploading ? 'Subiendo...' : 'Guardar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* MODAL EDITAR METADATA */}
      {modalEdit.open && modalEdit.doc && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.2s' }}>
          <div className="scale-up" style={{ background: '#fff', width: '90%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Actualizar Documento</h3>
              <button onClick={() => setModalEdit({ open: false, doc: null })} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Nombre del Documento</label>
                <input type="text" required value={modalEdit.doc.nombre_archivo} onChange={e => setModalEdit({ ...modalEdit, doc: { ...modalEdit.doc, nombre_archivo: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Categoría</label>
                <select value={modalEdit.doc.categoria} onChange={e => setModalEdit({ ...modalEdit, doc: { ...modalEdit.doc, categoria: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* MODAL VISOR PDF */}
      {modalPdf.open && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.2s' }}>
          <div className="scale-up" style={{ background: '#fff', width: '95%', maxWidth: '1000px', height: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#f8fafc', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>{modalPdf.titulo}</h4>
              <button onClick={() => setModalPdf({ open: false, url: '', titulo: '' })} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><FiX size={24} /></button>
            </div>
            <iframe src={modalPdf.url} title="Visor PDF" style={{ width: '100%', flex: 1, border: 'none' }} />
          </div>
        </div>
      , document.body)}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); } to { transform: scale(1); } }
        .scale-up { animation: scaleUp 0.2s ease-out; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .table-row-hover:hover { background: #f8fafc; }
        .scale-up-hover:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}

export default BibliotecaJuridica;
