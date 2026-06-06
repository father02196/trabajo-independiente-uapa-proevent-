import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiCheckCircle, FiMonitor, FiCalendar, FiMapPin, FiCoffee, FiDollarSign } from "react-icons/fi";
import InformacionGeneral from "./InformacionGeneral";
import ModalidadLugar from "./ModalidadLugar";
import ServiciosCatering from "./ServiciosCatering";
import PresupuestoPOA from "./PresupuestoPOA";
import AudiovisualMiniForm from "./AudiovisualMiniForm";
import './../css/Eventos.css';

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

  const [archivo, setArchivo] = useState(null); // Nuevo estado para Flujo Documental

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
    "Presupuesto y POA",
    "Audiovisual"
  ];

  // Las secciones son iguales para todos los roles ahora
  const secciones = baseSecciones;

  const seccionActualIndex = secciones.indexOf(activeSection);

  // Iconos para cada sección
  const seccionIcons = [
    <FiCalendar key="info" />,
    <FiMapPin key="lugar" />,
    <FiCoffee key="catering" />,
    <FiDollarSign key="poa" />,
    <FiMonitor key="av" />
  ];

  // Labels cortos para el wizard
  const seccionLabels = ["Información", "Lugar", "Servicios", "Presupuesto", "Audiovisual"];

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

    // Validate all sections before final submission
    for (let i = 0; i < secciones.length; i++) {
      const section = secciones[i];
      if (section === "Audiovisual") continue; // Validado abajo
      const err = validarSeccion(section);
      if (err) {
        setActiveSection(section);
        setError(`Falta completar ${seccionLabels[i]}: ${err}`);
        return;
      }
    }

    if (needsAV === null) {
      setActiveSection("Audiovisual");
      setError("Por favor, selecciona si deseas gestionar equipos audiovisuales.");
      return;
    }
    if (needsAV === true && avData.equipos.length === 0) {
      setActiveSection("Audiovisual");
      setError("Selecciona al menos un equipo o marca que no necesitas.");
      return;
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

        // --- SUBIDA DE ARCHIVO (Flujo Documental) ---
        if (archivo) {
          const formData = new FormData();
          formData.append("archivo", archivo);
          formData.append("tipo_documento", "Carta de Justificación / Cotización");
          formData.append("id_usuario", usuario?.id_usuario || "");

          try {
            const docRes = await fetch(`${API}/api/eventos/${id_evento}/documentos`, {
              method: "POST",
              headers: { 
                "x-usuario-id": usuario?.id_usuario || ""
              },
              body: formData
            });
            if (!docRes.ok) {
              console.error("Error al subir documento");
            }
          } catch (docErr) {
            console.error("Error de conexión al subir documento:", docErr);
          }
        }
        
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
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2>
          {editingEvent ? "Editar Solicitud de Evento" : "Nueva Solicitud de Evento"}
        </h2>
        <p className="form-sub-title">
          {editingEvent 
            ? `Modificando evento #EVT-${editingEvent.id_evento} — completa todos los pasos requeridos`
            : "Completa los pasos a continuación para registrar un nuevo evento institucional"
          }
        </p>
      </div>

      {/* Step Wizard Premium */}
      <div className="step-wizard">
        {secciones.map((s, i) => {
          const isCompleted = i < seccionActualIndex;
          const isActive = i === seccionActualIndex;
          return (
            <div
              key={s}
              className={`step-wizard-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => { setError(""); setActiveSection(secciones[i]); }}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              title={`Ir a ${seccionLabels[i]}`}
            >
              <div className="step-circle">
                {isCompleted ? <FiCheckCircle style={{ fontSize: '18px' }} /> : (i + 1)}
              </div>
              <span className="step-label">{seccionLabels[i] || s.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {exito && (
        <div className="form-alert form-alert-success" style={{ marginBottom: '20px' }}>
          <FiCheckCircle size={18} aria-hidden="true" />
          <span>{exito}</span>
        </div>
      )}

      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '20px' }}>
          <FiAlertTriangle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Sección activa */}
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
        <PresupuestoPOA data={data} setData={setData} archivo={archivo} setArchivo={setArchivo} />
      )}
      
      {activeSection === "Audiovisual" && (
        <div className="audiovisual-step">
          {needsAV === null ? (
            <div className="av-question-card">
              <div className="av-question-icon">
                <FiMonitor />
              </div>
              <h3>¿Desea gestionar equipos audiovisuales?</h3>
              <p>Esto incluye proyectores, micrófonos, sonido, cámaras y más.</p>
              <div className="av-choices">
                <button 
                  type="button" 
                  className="av-yes-btn"
                  onClick={() => setNeedsAV(true)}
                >
                  <FiMonitor /> Sí, necesito equipos
                </button>
                <button 
                  type="button" 
                  className="av-no-btn"
                  onClick={() => setNeedsAV(false)}
                >
                  No, solo el evento
                </button>
              </div>
            </div>
          ) : needsAV === true ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setNeedsAV(null)} 
                  className="btn btn-ghost"
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                >
                  <FiArrowLeft size={14} /> Cambiar respuesta
                </button>
              </div>
              <AudiovisualMiniForm avData={avData} setAvData={setAvData} />
            </div>
          ) : (
            <div className="av-success-card">
              <FiCheckCircle style={{ fontSize: '52px', color: '#059669', marginBottom: '16px' }} />
              <h3 style={{ color: '#065F46', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                No se requieren servicios audiovisuales
              </h3>
              <p style={{ color: '#15803d', fontSize: '14px', marginBottom: '20px' }}>
                Puede proceder a finalizar el registro de su evento.
              </p>
              <button 
                type="button" 
                onClick={() => setNeedsAV(null)}
                className="av-change-link"
              >
                Cambiar respuesta si se equivocó
              </button>
            </div>
          )}
        </div>
      )}

      {/* Botones de navegación */}
      <div className="actions">
        {!esPrimeraSeccion && (
          <button type="button" onClick={handleAnterior} className="btn btn-secondary">
            <FiArrowLeft aria-hidden="true" size={15} />
            Atrás
          </button>
        )}

        <div className="spacer" />

        <button type="button" onClick={handleBorrador} className="btn btn-ghost">
          Guardar Borrador
        </button>

        {!esUltimaSeccion ? (
          <button type="button" onClick={handleSiguiente} className="btn btn-primary">
            Continuar
            <FiArrowRight aria-hidden="true" size={15} />
          </button>
        ) : (
          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-success"
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px', height: '14px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite'
                }} />
                Enviando...
              </>
            ) : (
              <>
                <FiCheckCircle aria-hidden="true" size={15} />
                Finalizar y Enviar Solicitud
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
