import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiCheckCircle, FiMonitor } from "react-icons/fi";
import InformacionGeneral from "./InformacionGeneral";
import ModalidadLugar from "./ModalidadLugar";
import ServiciosCatering from "./ServiciosCatering";
import PresupuestoPOA from "./PresupuestoPOA";
import AudiovisualMiniForm from "./AudiovisualMiniForm";

const API = "http://localhost:8080";

export default function NuevaSolicitudEvento({ activeSection, setActiveSection, usuario, editingEvent, setEditingEvent }) {
  const [data, setData] = useState({
    titulo: "",
    departamento: "",
    id_dependencia: "",
    tipo: "",
    otroTipo: "",
    inicio: "",
    fin: "",
    horaInicio: "",
    horaFin: "",
    modalidad: "Presencial",
    campus: "",
    id_recinto: "",
    asistentes: "",
    items: [],
    catering: [],
    presupuesto: "",
    moneda: "DOP",
    observaciones: ""
  });

  useEffect(() => {
    if (editingEvent) {
      setData({
        id_evento: editingEvent.id_evento,
        titulo: editingEvent.nombre || "",
        id_dependencia: editingEvent.id_dependencia || "",
        tipo: editingEvent.tipo_evento || "",
        otroTipo: "",
        inicio: editingEvent.fecha_inicio ? editingEvent.fecha_inicio.substring(0, 10) : "",
        fin: editingEvent.fecha_fin ? editingEvent.fecha_fin.substring(0, 10) : "",
        horaInicio: editingEvent.hora_inicio || "",
        horaFin: editingEvent.hora_fin || "",
        modalidad: editingEvent.modalidad || "Presencial",
        id_recinto: editingEvent.id_recinto || "",
        asistentes: editingEvent.cantidad_asistentes || "",
        items: editingEvent.detalles_corporativos ? editingEvent.detalles_corporativos.split(', ') : [],
        catering: editingEvent.alimentos ? editingEvent.alimentos.split(', ') : [],
        presupuesto: editingEvent.monto_poa || "",
        moneda: editingEvent.moneda || "DOP",
        observaciones: editingEvent.observaciones || ""
      });
    }
  }, [editingEvent]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [needsAV, setNeedsAV] = useState(null);

  const [avData, setAvData] = useState({ equipos: [], observaciones: "" });

  const [poaFiscal, setPoaFiscal] = useState(null);

  useEffect(() => {
    const fetchPoa = async () => {
      try {
        const res = await fetch(`${API}/poa`);
        const dataJson = await res.json();
        if (dataJson.poas && dataJson.poas.length > 0) {
          setPoaFiscal(dataJson.poas[0]);
        }
      } catch (e) {
        console.error("Error fetching POA for validation:", e);
      }
    };
    fetchPoa();
  }, []);

  const validarSeccion = (seccion) => {
    if (seccion === "Información General") {
      if (!data.titulo.trim()) return "El título del evento es obligatorio.";
      if (!data.id_dependencia) return "Debes seleccionar una dependencia.";
      if (!data.tipo) return "Debes seleccionar el tipo de evento.";
      if (!data.inicio) return "La fecha de inicio es obligatoria.";
      if (!data.horaInicio) return "La hora de inicio es obligatoria.";
      if (!data.fin) return "La fecha de finalización es obligatoria.";
      if (!data.horaFin) return "La hora de cierre es obligatoria.";
      if (data.fin < data.inicio) return "La fecha de fin no puede ser antes de la fecha de inicio.";

      // Validar Horario de Oficina (08:00 AM - 06:00 PM)
      const hI = parseInt(data.horaInicio.split(':')[0], 10);
      const mI = parseInt(data.horaInicio.split(':')[1], 10);
      const hF = parseInt(data.horaFin.split(':')[0], 10);
      const mF = parseInt(data.horaFin.split(':')[1], 10);

      if (hI < 8 || hI >= 18) {
        if (!(hI === 18 && mI === 0)) return "La hora de inicio debe estar entre las 08:00 AM y 06:00 PM.";
      }
      if (hF < 8 || hF > 18 || (hF === 18 && mF > 0)) {
        return "La hora de finalización debe estar entre las 08:00 AM y 06:00 PM.";
      }

      // Validar contra Año Fiscal POA
      if (poaFiscal) {
        const pInicio = poaFiscal.fecha_inicio.substring(0, 10);
        const pFin = poaFiscal.fecha_fin.substring(0, 10);
        
        if (data.inicio < pInicio || data.inicio > pFin || data.fin < pInicio || data.fin > pFin) {
          return `La fecha seleccionada está fuera del año fiscal activo (${pInicio} al ${pFin}).`;
        }
        
        // Validar que no sea un año pasado (comparando el inicio del POA con el año actual si se requiere, 
        // pero la instrucción dice "no se agrege fecha de años fiscales pasados", lo cual se cumple si solo validamos contra el POA ACTIVO)
        const hoy = new Date().toISOString().substring(0, 10);
        if (data.inicio < hoy) {
            return "No se permite registrar eventos en fechas pasadas.";
        }
      }
    }
    if (seccion === "Modalidad y Lugar") {
      if (!data.modalidad) return "Debes seleccionar una modalidad.";
      if (!data.id_recinto) return "Debes seleccionar un recinto.";
      if (!data.asistentes || Number(data.asistentes) < 1) return "La cantidad de asistentes debe ser al menos 1.";
    }
    if (seccion === "Presupuesto y POA") {
      if (!data.presupuesto || Number(data.presupuesto) <= 0) return "El presupuesto estimado debe ser mayor a 0.";
    }
    return null;
  };

  const baseSecciones = [
    "Información General",
    "Modalidad y Lugar",
    "Servicios alimenticios y Detalles coorporativos",
    "Presupuesto y POA"
  ];

  // Las secciones cambian si el usuario es Solicitante
  const secciones = usuario?.rol === "Solicitante" 
    ? [...baseSecciones, "Audiovisual"] 
    : baseSecciones;

  const seccionActualIndex = secciones.indexOf(activeSection);

  const handleSiguiente = () => {
    const err = validarSeccion(activeSection);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    if (seccionActualIndex < secciones.length - 1) {
      setActiveSection(secciones[seccionActualIndex + 1]);
    }
  };

  const handleAnterior = () => {
    setError("");
    if (seccionActualIndex > 0) {
      setActiveSection(secciones[seccionActualIndex - 1]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (usuario?.rol === "Solicitante") {
      if (activeSection === "Audiovisual") {
        if (needsAV === null) {
          setError("Por favor, selecciona si deseas gestionar equipos audiovisuales.");
          return;
        }
        if (needsAV === true && avData.equipos.length === 0) {
          setError("Selecciona al menos un equipo o marca que no necesitas.");
          return;
        }
      }
    }

    ejecutarEnvioFinal();
  };

  const ejecutarEnvioFinal = async () => {
    setLoading(true);
    try {
      const payload = {
        nombre: data.titulo,
        modalidad: data.modalidad,
        fecha_inicio: data.inicio,
        fecha_fin: data.fin,
        hora_inicio: data.horaInicio,
        hora_fin: data.horaFin,
        cantidad_asistentes: Number(data.asistentes),
        tipo_evento: data.tipo,
        monto_poa: Number(data.presupuesto),
        moneda: data.moneda,
        id_usuario: usuario?.id_usuario || null,
        id_dependencia: data.id_dependencia || null,
        id_recinto: data.id_recinto || null,
        detalles_corporativos: data.items,
        alimentos: data.catering,
        observaciones: data.observaciones
      };

      const method = data.id_evento ? "PUT" : "POST";
      const url = data.id_evento ? `${API}/eventos/${data.id_evento}` : `${API}/eventos`;

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "x-usuario-id": usuario?.id_usuario || ""
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Error en enviarSolicitud:", result);
        setError(result.mensaje || result.error || "Error al enviar la solicitud.");
      } else {
        const id_evento = result.id_evento || data.id_evento;
        
        if (needsAV === true && avData.equipos.length > 0) {
          try {
            const avRes = await fetch(`${API}/audiovisual`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "x-usuario-id": usuario?.id_usuario || ""
              },
              body: JSON.stringify({
                id_evento: id_evento,
                servicios: avData.equipos
              })
            });
            if (!avRes.ok) {
              const avResult = await avRes.json();
              setError(`Evento creado (#EVT-${id_evento}), pero la solicitud audiovisual falló: ${avResult.mensaje}`);
              setLoading(false);
              return;
            }
          } catch (avErr) {
            console.error("Error al enviar solicitud AV:", avErr);
            setError(`Evento creado (#EVT-${id_evento}), pero hubo un problema de conexión para la solicitud audiovisual.`);
            setLoading(false);
            return;
          }
        }

        setExito(`Solicitud ${data.id_evento ? "actualizada" : "enviada"} con éxito. ID del evento: #EVT-${id_evento || data.id_evento}${needsAV ? " (Incluye requerimientos de audiovisual)" : ""}`);
        
        setData({
          titulo: "", departamento: "", id_dependencia: "", tipo: "", otroTipo: "",
          inicio: "", fin: "", horaInicio: "", horaFin: "",
          modalidad: "Presencial", campus: "", id_recinto: "", asistentes: "",
          items: [], catering: [], presupuesto: "", moneda: "DOP", observaciones: ""
        });
        setNeedsAV(null);
        setAvData({ equipos: [], observaciones: "" });
        if (setEditingEvent) setEditingEvent(null);
        setActiveSection(secciones[0]);
      }
    } catch (err) {
      setError("No se pudo conectar al servidor. Verifica que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const handleBorrador = () => {
    alert("Borrador guardado localmente. (Funcionalidad completa próximamente)");
  };

  const esPrimeraSeccion = seccionActualIndex === 0;
  const esUltimaSeccion = seccionActualIndex === secciones.length - 1;

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Nueva Solicitud de Evento</h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {secciones.map((s, i) => (
          <div key={s} style={{
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: i === seccionActualIndex ? "bold" : "normal",
            background: i < seccionActualIndex ? "#22c55e" : i === seccionActualIndex ? "#1e40af" : "#e2e8f0",
            color: i <= seccionActualIndex ? "white" : "#64748b"
          }}>
            {i + 1}. {s.split(" ")[0]}
          </div>
        ))}
      </div>

      {exito && (
        <div style={{ background: "#dcfce7", border: "1px solid #16a34a", color: "#15803d", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiCheckCircle aria-hidden="true" />
          {exito}
        </div>
      )}

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #dc2626", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FiAlertTriangle aria-hidden="true" />
          {error}
        </div>
      )}

      {activeSection === "Información General" && (
        <InformacionGeneral data={data} setData={setData} />
      )}
      {activeSection === "Modalidad y Lugar" && (
        <ModalidadLugar data={data} setData={setData} />
      )}
      {activeSection === "Servicios alimenticios y Detalles coorporativos" && (
        <ServiciosCatering data={data} setData={setData} />
      )}
      {activeSection === "Presupuesto y POA" && (
        <PresupuestoPOA data={data} setData={setData} />
      )}
      
      {activeSection === "Audiovisual" && (
        <div className="audiovisual-step">
          {needsAV === null ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: 'var(--navy)', marginBottom: '20px' }}>
                <FiMonitor style={{ fontSize: '48px', opacity: 0.5 }} />
              </div>
              <h3 style={{ marginBottom: '10px' }}>¿Desea gestionar equipos audiovisuales?</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Esto incluye proyectores, micrófonos, sonido, cámaras, etc.</p>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setNeedsAV(true)}
                  style={{ padding: '12px 30px', borderRadius: '8px', border: 'none', background: 'var(--navy)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  Sí, necesito
                </button>
                <button 
                  type="button" 
                  onClick={() => setNeedsAV(false)}
                  style={{ padding: '12px 30px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontWeight: '700', cursor: 'pointer' }}
                >
                  No, solo el evento
                </button>
              </div>
            </div>
          ) : needsAV === true ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <button type="button" onClick={() => setNeedsAV(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                  <FiArrowLeft /> Cambiar respuesta
                </button>
              </div>
              <AudiovisualMiniForm avData={avData} setAvData={setAvData} />
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <FiCheckCircle style={{ fontSize: '48px', color: '#16a34a', marginBottom: '15px' }} />
              <h3>No se requieren servicios audiovisuales</h3>
              <p style={{ color: '#15803d' }}>Puede proceder a finalizar el registro de su evento.</p>
              <button 
                type="button" 
                onClick={() => setNeedsAV(null)}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#16a34a', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Cambiar respuesta si se equivocó
              </button>
            </div>
          )}
        </div>
      )}

      <div className="actions" style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
        {!esPrimeraSeccion && (
          <button type="button" onClick={handleAnterior}
            style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #94a3b8", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <FiArrowLeft aria-hidden="true" />
            Atrás
          </button>
        )}

        <button type="button" onClick={handleBorrador}
          style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #94a3b8", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: "600", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          Guardar Borrador
        </button>

        {!esUltimaSeccion ? (
          <button type="button" onClick={handleSiguiente}
            style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#1e40af", color: "white", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            Siguiente
            <FiArrowRight aria-hidden="true" />
          </button>
        ) : (
          <button type="submit" disabled={loading}
            style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: loading ? "#94a3b8" : "#16a34a", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            {!loading && <FiCheckCircle aria-hidden="true" />}
            {loading ? "Enviando..." : "Finalizar y Enviar Solicitud"}
          </button>
        )}
      </div>
    </form>
  );
}
