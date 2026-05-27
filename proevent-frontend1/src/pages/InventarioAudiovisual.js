import React, { useState, useEffect } from "react";
import "./../css/Dashboard.css";
import { FiBox, FiSearch, FiInfo, FiX, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";

const API = "http://localhost:8080";

function InventarioAudiovisual({ usuario }) {
  const [equipos, setEquipos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resEquipos, resSolicitudes] = await Promise.all([
        fetch(`${API}/equipos-audiovisuales`),
        fetch(`${API}/audiovisual`)
      ]);
      const dataEquipos = await resEquipos.json();
      const dataSolicitudes = await resSolicitudes.json();
      
      setEquipos(Array.isArray(dataEquipos) ? dataEquipos : []);
      // Normalizar datos de solicitudes basados en el servidor
      const solicitudesFormateadas = Array.isArray(dataSolicitudes) ? dataSolicitudes.map(row => ({
        id_servicio: row.id_servicio,
        id_evento: row.id_evento,
        estado_av: row.estado_av,
        cantidad: row.cantidad || 1,
        ubicacion: row.ubicacion || '',
        observaciones: row.observaciones || '',
        nombre_evento: row.nombre_evento,
        fecha_evento: row.fecha_inicio,
        recinto: row.recinto,
        nombre_usuario: row.nombre_usuario || "—",
        equipo: row.equipo // Map de backend a variable
      })) : [];
      setSolicitudes(solicitudesFormateadas);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular inventario
  const inventario = equipos.map(eq => {
    // Solo contar solicitudes activas que retienen equipo
    const solicitudesActivas = solicitudes.filter(req => 
      req.equipo === eq.nombre && 
      ['Pendiente', 'En revisión', 'Aprobado'].includes(req.estado_av)
    );
    const enUso = solicitudesActivas.reduce((sum, req) => sum + req.cantidad, 0);
    const total = eq.cantidad_total || 0;
    const disponible = total - enUso;

    return {
      ...eq,
      total,
      enUso,
      disponible,
      solicitudesActivas
    };
  });

  const filteredInventario = inventario.filter(eq =>
    eq.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "N/D";
    const date = new Date(fechaStr);
    return date.toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const openModal = (equipo) => {
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  return (
    <div className="tab-content fade-in">
      <div className="tab-header">
        <div>
          <h2>Inventario en Tiempo Real</h2>
          <p>Supervisa la disponibilidad de los equipos y las solicitudes que los retienen.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="search-bar" style={{ minWidth: "300px" }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={cargarDatos}>Actualizar</button>
        </div>
      </div>

      <div className="av-card" style={{ marginTop: '20px' }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Cargando inventario...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="requests-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>DISPOSITIVO</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>TOTAL INVENTARIO</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>EN USO / RESERVADO</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>DISPONIBLE</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>ESTADO</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>DETALLES DE USO</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventario.map((eq) => (
                  <tr key={eq.id_equipo} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiBox size={16} color="#64748b" />
                        </div>
                        <strong>{eq.nombre}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{eq.total}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: eq.enUso > 0 ? '#ef4444' : '#64748b' }}>
                      {eq.enUso}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: eq.disponible > 0 ? '#dcfce7' : '#fee2e2', 
                        color: eq.disponible > 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 'bold'
                      }}>
                        {eq.disponible}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {eq.disponible > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#16a34a', fontSize: '13px' }}><FiCheckCircle /> Disponible</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#dc2626', fontSize: '13px' }}><FiAlertCircle /> Agotado</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        className="details-btn" 
                        onClick={() => openModal(eq)}
                        disabled={eq.enUso === 0}
                        style={{ opacity: eq.enUso === 0 ? 0.5 : 1, cursor: eq.enUso === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        <FiInfo /> Ver Solicitudes
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInventario.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No se encontraron dispositivos en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedEquipo && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Detalles de Uso: {selectedEquipo.nombre}</h2>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>{selectedEquipo.total}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total Inventario</div>
                </div>
                <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{selectedEquipo.enUso}</div>
                  <div style={{ fontSize: '12px', color: '#dc2626' }}>En Uso / Reservado</div>
                </div>
                <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{selectedEquipo.disponible}</div>
                  <div style={{ fontSize: '12px', color: '#16a34a' }}>Disponibles</div>
                </div>
              </div>

              <h4 style={{ marginBottom: "15px", color: "var(--primary-color)" }}>Eventos Solicitando este Dispositivo</h4>
              <div style={{ overflowX: "auto", maxHeight: "300px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>ID Evento</th>
                      <th style={{ padding: "10px" }}>Evento</th>
                      <th style={{ padding: "10px" }}>Solicitante</th>
                      <th style={{ padding: "10px" }}>Fecha</th>
                      <th style={{ padding: "10px" }}>Ubicación</th>
                      <th style={{ padding: "10px", textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: "10px", textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEquipo.solicitudesActivas.map(req => (
                      <tr key={req.id_servicio} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px" }}>#EVT-{req.id_evento}</td>
                        <td style={{ padding: "10px", fontWeight: '600' }}>{req.nombre_evento}</td>
                        <td style={{ padding: "10px" }}>{req.nombre_usuario}</td>
                        <td style={{ padding: "10px" }}>{formatFecha(req.fecha_evento)}</td>
                        <td style={{ padding: "10px" }}>{req.ubicacion || "N/A"}</td>
                        <td style={{ padding: "10px", textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{req.cantidad}</td>
                        <td style={{ padding: "10px", textAlign: 'center' }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            background: req.estado_av === "Aprobado" ? "#dcfce7" : req.estado_av === "En revisión" ? "#fef3c7" : "#e0f2fe",
                            color: req.estado_av === "Aprobado" ? "#16a34a" : req.estado_av === "En revisión" ? "#d97706" : "#0284c7"
                          }}>
                            {req.estado_av}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {selectedEquipo.solicitudesActivas.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '15px' }}>Ocurrió un error (lista vacía pero botón habilitado).</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-btn" onClick={closeModal} style={{ background: '#64748b' }}>Cerrar Detalles</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventarioAudiovisual;
