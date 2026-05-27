import React, { useState, useEffect } from "react";
import "./../css/Audiovisual.css";
import { FiEye } from "react-icons/fi";

const API = "http://localhost:8080";

export default function GestionSolicitudesAV({ usuario }) {
  const [solicitudesAV, setSolicitudesAV] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarSolicitudesAV();
  }, [usuario]);

  const cargarSolicitudesAV = () => {
    fetch(`${API}/audiovisual`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const agrupadas = Object.values(data.reduce((acc, req) => {
            if (!acc[req.id_evento]) {
              acc[req.id_evento] = {
                id_evento: req.id_evento,
                nombre_evento: req.nombre_evento,
                fecha_evento: req.fecha_evento,
                nombre_usuario: req.nombre_usuario || "—",
                estado_av: req.estado_av,
                equipos: [],
                total_equipos: 0
              };
            }
            acc[req.id_evento].equipos.push({
              id_servicio: req.id_servicio,
              equipo: req.equipo,
              cantidad: req.cantidad,
              ubicacion: req.ubicacion,
              observaciones: req.observaciones,
              estado_av: req.estado_av
            });
            acc[req.id_evento].total_equipos += 1;
            if (req.estado_av === "Pendiente") acc[req.id_evento].estado_av = "Pendiente";
            return acc;
          }, {}));
          setSolicitudesAV(agrupadas);
        } else {
          setSolicitudesAV([]);
        }
      })
      .catch((err) => console.error("Error cargando solicitudes audiovisuales:", err));
  };

  const handleCambiarEstado = async (id_evento, nuevoEstado) => {
    try {
      const res = await fetch(`${API}/audiovisual/evento/${id_evento}/estado`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        cargarSolicitudesAV();
      } else {
        alert("Error al cambiar el estado.");
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    }
  };

  const openModal = (req) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil(solicitudesAV.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = solicitudesAV.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="audiovisual-section">
      <div className="av-card">
        <h2 className="av-title" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Gestión de Solicitudes Audiovisuales</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="requests-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>ID EVENTO</th>
                <th style={{ padding: "12px" }}>EVENTO</th>
                <th style={{ padding: "12px" }}>SOLICITANTE</th>
                <th style={{ padding: "12px" }}>CANT. EQ.</th>
                <th style={{ padding: "12px" }}>ESTADO</th>
                <th style={{ padding: "12px" }}>DETALLES</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((av) => (
                <tr key={av.id_evento} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px" }}>#EVT-{av.id_evento}</td>
                  <td style={{ padding: "12px" }}>{av.nombre_evento}</td>
                  <td style={{ padding: "12px" }}>{av.nombre_usuario}</td>
                  <td style={{ padding: "12px" }}>{av.total_equipos} equipo(s)</td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={av.estado_av || "Pendiente"}
                      onChange={(e) => handleCambiarEstado(av.id_evento, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", cursor: "pointer" }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En revisión">En revisión</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Completado">Completado</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button className="details-btn" onClick={() => openModal(av)}>
                      <FiEye /> Ver
                    </button>
                  </td>
                </tr>
              ))}
              {solicitudesAV.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "12px", color: "#64748b" }}>
                    No hay solicitudes registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {solicitudesAV.length > 0 && (
          <div className="pagination-container" style={{ marginTop: "10px" }}>
            <div className="pagination-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, solicitudesAV.length)} de {solicitudesAV.length} solicitudes
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span className="page-number">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLES AUDIOVISUAL */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <h2>Detalles de Solicitud Audiovisual</h2>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Evento Relacionado:</label>
                <p>#EVT-{selectedRequest.id_evento} - {selectedRequest.nombre_evento}</p>
              </div>
              <div className="detail-group">
                <label>Solicitante:</label>
                <p>{selectedRequest.nombre_usuario || "—"}</p>
              </div>
              <div className="detail-group">
                <label>Fecha del Evento:</label>
                <p>{formatFecha(selectedRequest.fecha_evento)}</p>
              </div>
              <div className="detail-group">
                <label>Estado General:</label>
                <p>{selectedRequest.estado_av}</p>
              </div>
              
              <div style={{ gridColumn: "1 / -1", marginTop: "15px" }}>
                <h4 style={{ marginBottom: "10px", color: "var(--text-color)" }}>Equipos Solicitados</h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", background: "#f8fafc" }}>
                        <th style={{ padding: "10px" }}>Equipo</th>
                        <th style={{ padding: "10px" }}>Cant.</th>
                        <th style={{ padding: "10px" }}>Ubicación</th>
                        <th style={{ padding: "10px" }}>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.equipos && selectedRequest.equipos.map(eq => (
                        <tr key={eq.id_servicio} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px" }}>{eq.equipo}</td>
                          <td style={{ padding: "10px" }}>{eq.cantidad}</td>
                          <td style={{ padding: "10px" }}>{eq.ubicacion || "N/D"}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{eq.observaciones || "Ninguna"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
