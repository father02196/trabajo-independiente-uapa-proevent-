import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiArrowLeft, FiArrowRight, FiCheckCircle, FiMonitor, FiCalendar, FiMapPin, FiCoffee, FiDollarSign } from "react-icons/fi";
import InformacionGeneral from "./InformacionGeneral";
import ModalidadLugar from "./ModalidadLugar";
import ServiciosCatering from "./ServiciosCatering";
import PresupuestoPOA from "./PresupuestoPOA";
import AudiovisualMiniForm from "./AudiovisualMiniForm";
import './../css/Eventos.css';

const API = "http://localhost:8080";

const getDaysDifference = (startDateStr) => {
  if (!startDateStr) return 0;
  const [y, m, d] = startDateStr.split('-');
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffTime = start.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

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
    observaciones: "",
    sugerencias_externas: ""
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
        observaciones: editingEvent.observaciones || "",
        sugerencias_externas: "" // No se mapea porque se guarda dentro de observaciones
      });
    }
  }, [editingEvent]);

  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const [exito, setExito] = useState("");
  const [needsAV, setNeedsAV] = useState(null);
  const [omitirServicios, setOmitirServicios] = useState(false);
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: "", targetSection: "" });

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

  // Validación en tiempo real para días de anticipación
  useEffect(() => {
    if (!data.inicio) return;
    const dias = getDaysDifference(data.inicio);
    const tieneAlimentos = data.catering && data.catering.length > 0;
    const tieneExternos = data.sugerencias_externas && data.sugerencias_externas.trim().length > 0;

    let errMsg = "";
    if (tieneAlimentos && tieneExternos && dias < 20) {
      errMsg = "Este evento incluye Servicios de Alimentos, por lo que debe registrarse con al menos 20 días de anticipación.";
    } else if (tieneAlimentos && dias < 20) {
      errMsg = "Este evento incluye Servicios de Alimentos, por lo que debe registrarse con al menos 20 días de anticipación.";
    } else if (tieneExternos && dias < 15) {
      errMsg = "Este evento requiere Proveedores Externos, por lo que debe registrarse con al menos 15 días de anticipación.";
    }

    if (errMsg) {
      setError(errMsg);
    } else {
      if (error && (error.includes("anticipación") || error.includes("Proveedores Externos") || error.includes("Servicios de Alimentos"))) {
        setError("");
      }
    }
  }, [data.inicio, data.catering, data.sugerencias_externas]);

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

      // Validar Horario de Oficina (08:00 - 18:00) y coherencia de tiempos
      const hI = parseInt(data.horaInicio.split(':')[0], 10);
      const mI = parseInt(data.horaInicio.split(':')[1], 10);
      const hF = parseInt(data.horaFin.split(':')[0], 10);
      const mF = parseInt(data.horaFin.split(':')[1], 10);
      
      if (hI < 8 || hI > 18) {
        if (!(hI === 18 && mI === 0)) return "La hora de inicio debe estar entre las 08:00 y las 18:00.";
      }
      if (hF < 8 || hF > 18 || (hF === 18 && mF > 0)) {
        return "La hora de finalización debe estar entre las 08:00 y las 18:00.";
      }

      const minInicio = hI * 60 + mI;
      const minFin = hF * 60 + mF;
      if (minFin <= minInicio) {
        return "La hora de cierre debe ser mayor que la hora de inicio.";
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
    if (seccion === "Servicios alimenticios y Detalles coorporativos") {
      const tieneSugerencias = data.sugerencias_externas && data.sugerencias_externas.trim().length > 0;
      if (!tieneSugerencias && !omitirServicios) {
        return "(Llene el recuadro se servicios externos o presione omitir en caso de no necesitar estos servicios)";
      }
    }
    if (seccion === "Presupuesto y POA") {
      if (!data.presupuesto || Number(data.presupuesto) <= 0) return "El presupuesto estimado debe ser mayor a 0.";
    }

    // Validación global de días de anticipación
    if (data.inicio) {
      const dias = getDaysDifference(data.inicio);
      const tieneAlimentos = data.catering && data.catering.length > 0;
      const tieneExternos = data.sugerencias_externas && data.sugerencias_externas.trim().length > 0;

      if (tieneAlimentos && dias < 20) {
        return "Este evento incluye Servicios de Alimentos, por lo que debe registrarse con al menos 20 días de anticipación.";
      }
      if (tieneExternos && dias < 15) {
        return "Este evento requiere Proveedores Externos, por lo que debe registrarse con al menos 15 días de anticipación.";
      }
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
      if (err.includes("Llene el recuadro se servicios externos")) {
        setShowServiceModal(true);
        return;
      }
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
        setValidationModal({
          isOpen: true,
          message: `Falta completar ${seccionLabels[i]}: ${err}`,
          targetSection: section
        });
        return;
      }
    }

    if (needsAV === null) {
      setValidationModal({
        isOpen: true,
        message: "Por favor, selecciona si deseas gestionar equipos audiovisuales.",
        targetSection: "Audiovisual"
      });
      return;
    }
    if (needsAV === true && avData.equipos.length === 0) {
      setValidationModal({
        isOpen: true,
        message: "Selecciona al menos un equipo o marca que no necesitas.",
        targetSection: "Audiovisual"
      });
      return;
    }

    ejecutarEnvioFinal();
  };

  const ejecutarEnvioFinal = async () => {
    setLoading(true);
    try {
      // Preparar observaciones combinadas con sugerencias externas
      let finalObservaciones = data.observaciones;
      if (data.sugerencias_externas && data.sugerencias_externas.trim() !== "") {
        finalObservaciones += `\n\n[SUGERENCIAS EXTERNAS]: ${data.sugerencias_externas}`;
      }

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
        observaciones: finalObservaciones.trim()
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
          items: [], catering: [], presupuesto: "", moneda: "DOP", observaciones: "", sugerencias_externas: ""
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
      {exito && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ width: '600px', maxWidth: '90%', padding: '48px 32px', textAlign: 'center', borderRadius: '16px' }}>
            <FiCheckCircle size={64} color="#10B981" style={{ margin: '0 auto 24px', display: 'block' }} />
            <h3 style={{ marginBottom: '16px', fontSize: '24px', color: '#1E293B', fontWeight: '800' }}>¡Evento Creado Exitosamente!</h3>
            <p style={{ color: '#475569', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
              {exito}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-success btn-lg" 
                onClick={() => {
                  sessionStorage.setItem("dashboard_activeTab", "Dashboard");
                  window.location.reload();
                }}
              >
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {error && (
        <div 
          ref={errorRef}
          tabIndex={-1}
          className="form-alert form-alert-error" 
          style={{ marginBottom: '20px', outline: 'none' }}
        >
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
      {activeSection === "Servicios alimenticios y Detalles coorporativos" && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="omitirServicios" 
            checked={omitirServicios} 
            onChange={(e) => setOmitirServicios(e.target.checked)} 
            style={{ transform: 'scale(1.15)', cursor: 'pointer' }}
          />
          <label htmlFor="omitirServicios" style={{ cursor: 'pointer', color: '#475569', fontWeight: '500', fontSize: '14px', margin: 0 }}>
            Deseo omitir este paso porque no necesito ningún servicio.
          </label>
        </div>
      )}
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

      {/* Modal de Validación de Servicios */}
      {showServiceModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <FiAlertTriangle size={48} color="#F59E0B" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ marginBottom: '12px', fontSize: '18px', color: '#1E293B' }}>Validación de Servicios</h3>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              (Llene el recuadro se servicios externos o presione omitir en caso de no necesitar estos servicios)
            </p>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setShowServiceModal(false)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Volver a la solicitud
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Validación General (Pantalla Completa) */}
      {validationModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '450px', padding: '40px 32px', textAlign: 'center', borderRadius: '16px' }}>
            <FiAlertTriangle size={56} color="#EF4444" style={{ margin: '0 auto 20px', display: 'block' }} />
            <h3 style={{ marginBottom: '16px', fontSize: '22px', color: '#1E293B', fontWeight: '800' }}>
              Información Incompleta
            </h3>
            <p style={{ color: '#475569', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
              {validationModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setValidationModal({ isOpen: false, message: "", targetSection: "" });
                  setActiveSection(validationModal.targetSection);
                }}
              >
                Ir al apartado a completar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </form>
  );
}
