import React, { useState, useEffect } from "react";
import { FiEye, FiMonitor, FiFileText, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from '../components/SortableHeader';

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
          "Authorization": `Bearer ${usuario?.token || ""}`, "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        toast.success(`Estado actualizado a ${nuevoEstado}`);
        cargarSolicitudesAV();
      } else {
        toast.error("Error al cambiar el estado.");
      }
    } catch {
      toast.error("No se pudo conectar al servidor.");
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

  const { items: sortedSolicitudes, requestSort, sortConfig } = useSortableData(solicitudesAV, { key: 'id_evento', direction: 'ascending' });
  const { items: sortedEquipos, requestSort: requestSortEquipos, sortConfig: sortConfigEquipos } = useSortableData(selectedRequest?.equipos || [], { key: 'equipo', direction: 'ascending' });

  const totalPages = Math.ceil(sortedSolicitudes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSolicitudes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>Gestión de Solicitudes Audiovisuales</h1>
          <p style={{ color: '#64748B', fontSize: '13.5px' }}>Administra y actualiza el estado de las solicitudes técnicas de los eventos.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <SortableHeader label="ID Evento" sortKey="id_evento" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Evento" sortKey="nombre_evento" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Solicitante" sortKey="nombre_usuario" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Cant. Equipos" sortKey="total_equipos" sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader label="Estado" sortKey="estado_av" sortConfig={sortConfig} requestSort={requestSort} />
              <th style={{ textAlign: 'center' }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((av) => (
              <tr key={av.id_evento}>
                <td style={{ fontWeight: '600', color: '#64748B' }}>#EVT-{av.id_evento}</td>
                <td style={{ fontWeight: '600', color: '#0F172A' }}>{av.nombre_evento}</td>
                <td>{av.nombre_usuario}</td>
                <td><span className="badge badge-slate">{av.total_equipos} equipo(s)</span></td>
                <td>
                  <select
                    value={av.estado_av || "Pendiente"}
                    onChange={(e) => handleCambiarEstado(av.id_evento, e.target.value)}
                    className="input-base"
                    style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', minWidth: '130px' }}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                    <option value="Completado">Completado</option>
                  </select>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal(av)}>
                    <FiEye size={14} /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {solicitudesAV.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                  <FiMonitor size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontWeight: '600' }}>No hay solicitudes registradas</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      {solicitudesAV.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, solicitudesAV.length)} de {solicitudesAV.length} solicitudes
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Anterior
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
              Página {currentPage} de {totalPages || 1}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLES AUDIOVISUAL */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-premium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Ficha Técnica Audiovisual</h3>
                <span className="modal-subtitle">Revisión de reserva de equipos y logística AV</span>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '14px', padding: '6px 12px' }}>#AV-{selectedRequest.id_solicitud || selectedRequest.id_evento}</span>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid-2">
                {/* Columna 1: Info General */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiFileText size={14} /> Información del Evento
                  </div>
                  <div className="info-row">
                    <span className="info-label">Evento Relacionado</span>
                    <span className="info-value" style={{ color: '#3B82F6', fontSize: '16px' }}>#EVT-{selectedRequest.id_evento} - {selectedRequest.nombre_evento}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Solicitante</span>
                    <span className="info-value">{selectedRequest.nombre_usuario || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha del Evento</span>
                    <span className="info-value">{formatFecha(selectedRequest.fecha_evento)}</span>
                  </div>
                </div>

                {/* Columna 2: Estado */}
                <div className="info-card">
                  <div className="info-card-title">
                    <FiMonitor size={14} /> Estado de Solicitud AV
                  </div>
                  <div className="info-row">
                    <span className="info-label">Estado General</span>
                    <span className={`badge ${selectedRequest.estado_av === 'Aprobado' ? 'badge-green' : selectedRequest.estado_av === 'Rechazado' ? 'badge-red' : 'badge-yellow'}`} style={{ width: 'fit-content', padding: '6px 12px', marginTop: '4px' }}>
                      {selectedRequest.estado_av}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipos Solicitados */}
              <div className="modal-grid-1" style={{ marginTop: '24px' }}>
                <div className="info-card">
                  <div className="info-card-title">
                    <FiCheckCircle size={14} /> Desglose de Equipos Solicitados
                  </div>
                  <div className="table-container" style={{ margin: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <SortableHeader label="Equipo Requerido" sortKey="equipo" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                          <SortableHeader label="Cantidad" sortKey="cantidad" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} style={{ textAlign: 'center' }} />
                          <SortableHeader label="Ubicación" sortKey="ubicacion" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                          <SortableHeader label="Observaciones Especiales" sortKey="observaciones" sortConfig={sortConfigEquipos} requestSort={requestSortEquipos} />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEquipos.map(eq => (
                          <tr key={eq.id_servicio}>
                            <td style={{ fontWeight: '600', color: '#0F172A' }}>{eq.equipo}</td>
                            <td style={{ textAlign: 'center', fontWeight: '700', color: '#3B82F6' }}>{eq.cantidad}</td>
                            <td>{eq.ubicacion || "N/D"}</td>
                            <td style={{ color: '#64748B', fontSize: '13px' }}>{eq.observaciones || "Ninguna"}</td>
                          </tr>
                        ))}
                        {(!selectedRequest.equipos || selectedRequest.equipos.length === 0) && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>
                              No hay detalle de equipos registrado para esta solicitud.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
