import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import './../css/Dashboard.css';

/**
 * Props:
 * - evento: Objeto principal del evento.
 * - detalles: Arrays relacionados (servicios, personal, cronograma, etc).
 * - onClose: función para cerrar el modal o vista.
 */
export default function FichaTecnicaPDF({ evento, presupuesto, legal, servicios, organizadores, onClose }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    contentRef: componentRef,
    documentTitle: `Ficha_Tecnica_EVT_${evento.id_evento}`,
  });

  if (!evento) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
      
      <div style={{ background: '#f8fafc', width: '100%', maxWidth: '900px', height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Toolbar superior (No se imprime) */}
        <div style={{ padding: '15px 20px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiDownload /> Generador de Ficha Técnica
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiPrinter /> Imprimir / Guardar PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ background: '#475569', color: 'white', border: 'none' }}>
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
                <div><strong>Fecha de Inicio:</strong> {new Date(evento.fecha_inicio).toLocaleDateString()} ({evento.hora_inicio})</div>
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
    </div>
  );
}
