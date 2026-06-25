// ============================================================
// COMPONENTE: FichaTecnicaPDF
// Pertenece a: Generación de Reportes / Ficha del Evento
// Propósito: Funciona como un modal "imprimible" que consolida
// toda la información del evento (detalles, presupuesto VAF, legal, 
// servicios externos y organizadores) usando 'react-to-print' para PDF.
// ============================================================

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import './../css/Dashboard.css';

/**
 * COMPONENTE: FichaTecnicaPDF
 * Props:
 * - evento: Objeto principal del evento.
 * - presupuesto: Datos del estado VAF
 * - legal: Datos del estado del dictamen legal
 * - servicios: Arrays de servicios externos vinculados
 * - organizadores: Personal asignado al evento
 * - onClose: función para cerrar la vista modal.
 */
export default function FichaTecnicaPDF({ evento, presupuesto, legal, servicios, organizadores, observaciones, onClose }) {
  const componentRef = useRef();

  // --- FUNCIÓN: handlePrint ---
  // Invoca el diálogo nativo de impresión del navegador
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    contentRef: componentRef,
    documentTitle: `Ficha_Tecnica_EVT_${evento.id_evento}`,
  });

  // --- FUNCIÓN: handleDownloadPDF ---
  // Convierte el HTML renderizado a un archivo PDF descargable
  const handleDownloadPDF = () => {
    const element = componentRef.current;
    const opt = {
      margin:       0.5,
      filename:     `Ficha_Tecnica_EVT_${evento.id_evento}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!evento) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' }}>
      
      <div style={{ background: '#f8fafc', width: '100%', maxWidth: '900px', height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Toolbar superior (No se imprime) */}
        <div style={{ padding: '15px 20px', background: '#ffffff', color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiDownload /> Generador de Ficha Técnica
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
              <FiPrinter /> Imprimir
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
              <FiDownload /> Guardar PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenedor escroleable y área imprimible */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#e2e8f0' }}>
          <div 
            ref={componentRef} 
            style={{ 
              background: 'white', 
              padding: '40px', 
              margin: '0 auto', 
              width: '100%',
              maxWidth: '210mm', 
              minHeight: '297mm', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Cabecera del Documento */}
            <div style={{ borderBottom: '3px solid #1e293b', paddingBottom: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#0f172a' }}>Ficha Técnica Consolidada</h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Sistema Integral de Eventos Institucionales</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>#EVT-{evento.id_evento}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Impreso el: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* 1. Información General */}
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', color: '#1e293b' }}>1. Información General del Evento</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div><strong>Nombre del Evento:</strong> {evento.nombre}</div>
                <div><strong>Estado Actual:</strong> <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px' }}>{evento.estado}</span></div>
                <div><strong>Modalidad:</strong> {evento.modalidad}</div>
                <div><strong>Asistentes Estimados:</strong> {evento.cantidad_asistentes}</div>
                <div><strong>Fecha de Inicio:</strong> {new Date(evento.fecha_inicio).toLocaleDateString()} ({evento.hora_inicio?.substring(0,5)})</div>
                <div><strong>Fecha de Fin:</strong> {new Date(evento.fecha_fin).toLocaleDateString()} ({evento.hora_fin})</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Ubicación:</strong> {evento.recinto_nombre || 'No especificada'}</div>
              </div>
            </section>

            {/* 2. Situación Administrativa y Legal */}
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', color: '#1e293b' }}>2. Estatus Presupuestario y Legal</h2>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', fontSize: '14px' }}>
                <div style={{ marginBottom: '10px' }}><strong>Estado del Presupuesto (VAF):</strong> {presupuesto?.estado || 'Pendiente'}</div>
                <div style={{ marginBottom: '10px' }}><strong>Dictamen Legal:</strong> {legal?.estado_legal || 'Pendiente'}</div>
                {legal?.observacion_legal && (
                  <div><strong>Observaciones Legales:</strong> <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', color: '#475569' }}>"{legal.observacion_legal}"</p></div>
                )}
              </div>
            </section>

            {/* 3. Personal Operativo Asignado */}
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', color: '#1e293b' }}>3. Estructura Organizativa</h2>
              {organizadores && organizadores.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Nombre</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Rol en el Evento</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Correo Institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizadores.map((org, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{org.nombre}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{org.rol_organizacion}</td>
                        <td style={{ padding: '10px' }}>{org.correo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '14px', color: '#64748b' }}>No hay personal organizador asignado.</p>
              )}
            </section>

            {/* 4. Logística y Servicios Externos */}
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', color: '#1e293b' }}>4. Requerimientos de Logística</h2>
              {servicios && servicios.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Tipo de Servicio</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Estado Logístico</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Clasificación</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Orden de Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicios.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{s.tipo_servicio}</td>
                        <td style={{ padding: '10px' }}>{s.estado}</td>
                        <td style={{ padding: '10px' }}>{s.clasificacion}</td>
                        <td style={{ padding: '10px' }}>{s.numero_orden_compra || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '14px', color: '#64748b' }}>El evento no requiere servicios externos registrados.</p>
              )}
            </section>

            {/* 5. Historial de Observaciones */}
            <section style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', color: '#1e293b' }}>5. Historial de Observaciones</h2>
              {observaciones && observaciones.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {observaciones.map((obs, index) => (
                    <div key={index} style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #f59e0b', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#92400e', fontWeight: 'bold' }}>
                        <span>Departamento: {obs.departamento}</span>
                        <span>{new Date(obs.fecha).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#78350f', margin: 0 }}>{obs.comentario}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#64748b' }}>No hay observaciones registradas para este evento.</p>
              )}
            </section>

            {/* Pie de Firma */}
            <div style={{ marginTop: '60px', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center' }}>
              <div>
                <div style={{ borderTop: '1px solid #94a3b8', width: '80%', margin: '0 auto', paddingTop: '10px', fontSize: '12px' }}>Firma del Solicitante</div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #94a3b8', width: '80%', margin: '0 auto', paddingTop: '10px', fontSize: '12px' }}>Firma Depto. Legal</div>
              </div>
              <div>
                <div style={{ borderTop: '1px solid #94a3b8', width: '80%', margin: '0 auto', paddingTop: '10px', fontSize: '12px' }}>Dirección Administrativa</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
