import React, { useState, useEffect } from "react";
import { FiUsers, FiMapPin, FiCheckCircle, FiCalendar, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";

const API = "http://localhost:8080";

function AsignacionPersonal({ usuario }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [coordinadores, setCoordinadores] = useState([]);
  const [organizadoresAsignados, setOrganizadoresAsignados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState('Coordinador');

  useEffect(() => {
    cargarEventos();
    fetch(`${API}/usuarios-coordinadores`)
      .then(res => res.json())
      .then(data => setCoordinadores(data))
      .catch(err => console.error("Error al cargar coordinadores:", err));
  }, [usuario]);

  const cargarEventos = async () => {
    setLoading(true);
    try {
      const url = usuario?.rol === "Solicitante" 
        ? `${API}/eventos?usuario_id=${usuario.id_usuario}`
        : `${API}/eventos`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEventos(data);
      } else {
        toast.error("Error al cargar lista de eventos.");
      }
    } catch (err) {
      toast.error("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const cargarOrganizadoresAsignados = async (id_evento) => {
    try {
      const res = await fetch(`${API}/organizadores/${id_evento}`);
      if (res.ok) {
        setOrganizadoresAsignados(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvent = (e) => {
    const id = e.target.value;
    if (!id) {
      setEventoSeleccionado(null);
      setOrganizadoresAsignados([]);
      return;
    }
    const evt = eventos.find((ev) => ev.id_evento.toString() === id);
    setEventoSeleccionado(evt);
    cargarOrganizadoresAsignados(id);
  };

  const asignarRol = async (id_evento, id_usuario, rol) => {
    if (!id_usuario) return;
    try {
      const res = await fetch(`${API}/organizadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_evento, id_usuario, rol_organizacion: rol })
      });
      if (res.ok) {
        toast.success(`${rol} asignado correctamente`);
        cargarOrganizadoresAsignados(id_evento);
      } else {
        toast.error(`Error al asignar ${rol}`);
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const eliminarRol = async (id_evento_org, id_evento) => {
    if (!window.confirm("¿Seguro que deseas remover a esta persona de la organización del evento?")) return;
    try {
      const res = await fetch(`${API}/organizadores/${id_evento_org}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Personal removido del evento");
        cargarOrganizadoresAsignados(id_evento);
      } else {
        toast.error("Error al remover personal");
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  if (usuario?.rol === "Solicitante") {
    return <div style={{ padding: '20px' }}>No tienes permisos para asignar personal operativo.</div>;
  }

  return (
    <div className="admin-page-container fade-in">
      <div className="admin-controls-card">
        <div className="controls-header">
          <div className="title-section">
            <FiUsers className="header-icon" />
            <div>
              <h3>Asignación de Personal Operativo</h3>
              <p className="subtitle">Selecciona un evento para asignarle el equipo (Responsable, Coordinador o Apoyo)</p>
            </div>
          </div>
        </div>

        <div className="filters-grid" style={{ marginTop: '20px' }}>
          <div className="filter-item full-width">
            <label>Seleccionar Evento</label>
            <select onChange={handleSelectEvent} className="table-select-premium" style={{ width: '100%', padding: '10px' }}>
              <option value="">-- Elige un evento de la lista --</option>
              {eventos.map((ev) => (
                <option key={ev.id_evento} value={ev.id_evento}>
                  {`#EVT-${ev.id_evento} - ${ev.nombre} (${new Date(ev.fecha_inicio).toLocaleDateString()}) - ${ev.estado}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eventoSeleccionado && (
          <div style={{ marginTop: '30px' }}>
            <div style={{ marginBottom: '25px', background: '#eef2f5', padding: '15px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Evento Activo: {eventoSeleccionado.nombre}</h4>
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: '#555' }}>
                <span><FiCalendar /> {new Date(eventoSeleccionado.fecha_inicio).toLocaleDateString()}</span>
                <span><FiMapPin /> {eventoSeleccionado.recinto_nombre || 'Recinto'}</span>
                <span><FiCheckCircle /> {eventoSeleccionado.estado}</span>
              </div>
            </div>
            
            <div className="detail-group full-width" style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ color: '#1e40af', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👨‍💼 Panel de Asignación Operativa
              </h4>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Asignar Miembro del Equipo:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    className="table-select-premium" 
                    style={{ width: '150px', padding: '10px', borderRadius: '6px' }}
                    value={rolSeleccionado}
                    onChange={(e) => setRolSeleccionado(e.target.value)}
                  >
                    <option value="Responsable">Responsable</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Apoyo">Apoyo</option>
                  </select>
                  <select 
                    className="table-select-premium" 
                    style={{ flex: 1, padding: '10px', borderRadius: '6px' }}
                    onChange={(e) => {
                      asignarRol(eventoSeleccionado.id_evento, e.target.value, rolSeleccionado);
                      e.target.value = ""; // Reset after assign
                    }}
                  >
                    <option value="">-- Seleccionar personal --</option>
                    {coordinadores.map(c => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {organizadoresAsignados.length > 0 && (
                <div style={{ marginTop: '10px', background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Personal actualmente asignado:</label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {organizadoresAsignados.map(org => (
                      <li key={org.id_evento_org} style={{ background: '#e0f2fe', padding: '10px 15px', borderRadius: '6px', marginBottom: '8px', fontSize: '0.95rem', color: '#0369a1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{org.nombre}</strong> <span style={{opacity: 0.8, fontSize: '0.85rem', marginLeft: '8px'}}>({org.rol_organizacion})</span></span>
                        <button 
                          onClick={() => eliminarRol(org.id_evento_org, eventoSeleccionado.id_evento)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
                          title="Remover asignación"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AsignacionPersonal;
