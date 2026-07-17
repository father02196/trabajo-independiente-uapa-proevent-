// ============================================================
// COMPONENTE: InventarioAudiovisual (Version Profesional)
// Modulo de Gestion de Activos Audiovisuales - UAPA ProEvent
// Incluye: KPIs, filtros avanzados, estados profesionales,
// historial, mantenimiento, ubicacion y exportacion.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiBox, FiSearch, FiCheckCircle, FiAlertCircle,
  FiMonitor, FiSpeaker, FiMic, FiVideo, FiRadio, FiSun, FiCast,
  FiRefreshCw, FiDownload, FiTool, FiAlertTriangle,
  FiClock, FiCalendar, FiMapPin, FiUser, FiActivity,
  FiArchive, FiPlusCircle, FiEye, FiPackage, FiXCircle
} from "react-icons/fi";

import html2pdf from "html2pdf.js";

const API = "http://localhost:8080";

// -- CONSTANTES --
const ESTADOS_EQUIPO = [
  { value: "Disponible",              label: "Disponible",         color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  { value: "Reservado",               label: "Reservado",          color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  { value: "En uso",                  label: "En uso",             color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "Pendiente de devolucion", label: "Pend. devolucion",   color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { value: "En mantenimiento",        label: "En mantenimiento",   color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { value: "Dañado",                  label: "Dañado",             color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { value: "Fuera de servicio",       label: "Fuera de servicio",  color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
];

const UBICACIONES = [
  "Almacen AV Central", "Edificio Principal", "Sala de Control",
  "Auditorio UAPA", "Sala de Capacitacion", "Laboratorio Multimedia", "Oficina Audiovisual",
];

const RESPONSABLES = [
  "Carlos Mendez", "Laura Jimenez", "Rafael Santos", "Ana Peralta", "Miguel Torres",
];

// -- ICONO EQUIPO --
const IconoEquipo = ({ icono, size = 18 }) => {
  if (icono === "FiMonitor") return <FiMonitor size={size} />;
  if (icono === "FiSpeaker") return <FiSpeaker size={size} />;
  if (icono === "FiMic")     return <FiMic     size={size} />;
  if (icono === "FiVideo")   return <FiVideo   size={size} />;
  if (icono === "FiRadio")   return <FiRadio   size={size} />;
  if (icono === "FiSun")     return <FiSun     size={size} />;
  if (icono === "FiCast")    return <FiCast    size={size} />;
  return <FiMonitor size={size} />;
};

// -- BADGE ESTADO --
const EstadoBadge = ({ estado }) => {
  const cfg = ESTADOS_EQUIPO.find(e => e.value === estado) || ESTADOS_EQUIPO[0];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: "6px", padding: "3px 9px", fontSize: "11.5px", fontWeight: "700", whiteSpace: "nowrap",
    }}>
      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

// -- EXPORTAR CSV --
const exportarCSV = (inventario) => {
  const hdrs = ["ID", "Equipo", "Categoria", "Ubicacion", "Responsable", "Total", "Disponible", "Reservado", "En Uso", "Mantenimiento", "Estado"];
  const rows = inventario.map(eq => [
    eq.id_equipo, eq.nombre, eq.categoria || "-", eq.ubicacion || "-", eq.responsable || "-",
    eq.total, eq.disponible, eq.reservados, eq.enUso, eq.enMantenimiento, eq.estadoGeneral
  ]);
  const csv = [hdrs, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario_av_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// -- EXPORTAR PDF --
const exportarPDF = (inventario, filtros, usuario) => {
  const element = document.createElement("div");
  
  // Sumatorias (con la lógica de topes ya aplicada en la UI)
  const total = inventario.reduce((a,e)=>a+e.total,0);
  const disp = inventario.reduce((a,e)=>a+e.disponible,0);
  const res = inventario.reduce((a,e)=>a+e.reservados,0);
  const uso = inventario.reduce((a,e)=>a+e.enUso,0);
  const mant = inventario.filter(e=>e.estadoGeneral==="En mantenimiento").length;
  
  const generador = usuario?.nombre || "Administrador del Sistema";
  const fechaGeneracion = new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  let filtrosTexto = "Todos los registros";
  if(filtros) {
    const fArr = [];
    if(filtros.searchTerm) fArr.push(`Búsqueda: "${filtros.searchTerm}"`);
    if(filtros.filtroCategoria !== "Todos") fArr.push(`Cat: ${filtros.filtroCategoria}`);
    if(filtros.filtroEstado !== "Todos") fArr.push(`Est: ${filtros.filtroEstado}`);
    if(filtros.filtroUbicacion !== "Todos") fArr.push(`Ubic: ${filtros.filtroUbicacion}`);
    if(filtros.filtroResponsable !== "Todos") fArr.push(`Resp: ${filtros.filtroResponsable}`);
    if(fArr.length > 0) filtrosTexto = fArr.join(" | ");
  }

  element.innerHTML = `
    <div style="padding: 10px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: white;">
      
      <!-- HEADER CORPORATIVO -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h1 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Inventario Audiovisual</h1>
          <h2 style="color: #64748b; margin: 2px 0 0; font-size: 11px; font-weight: 600;">Reporte Oficial de Activos - UAPA ProEvent</h2>
        </div>
        <div style="text-align: right; font-size: 9px; color: #475569; line-height: 1.4;">
          <strong>Fecha:</strong> ${fechaGeneracion}<br>
          <strong>Generado por:</strong> ${generador}<br>
          <strong>Filtros:</strong> ${filtrosTexto}
        </div>
      </div>
      
      <!-- RESUMEN EJECUTIVO (Adaptado a vertical) -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 15px; flex: 1;">
          <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Total Equipos</div>
          <div style="font-size: 20px; color: #0f172a; font-weight: 800;">${total}</div>
        </div>
        <div style="text-align: center; border-right: 1px solid #e2e8f0; padding: 0 15px; flex: 1;">
          <div style="font-size: 9px; color: #059669; text-transform: uppercase; font-weight: 700;">Disponibles</div>
          <div style="font-size: 20px; color: #10b981; font-weight: 800;">${disp}</div>
        </div>
        <div style="text-align: center; border-right: 1px solid #e2e8f0; padding: 0 15px; flex: 1;">
          <div style="font-size: 9px; color: #1d4ed8; text-transform: uppercase; font-weight: 700;">En Uso</div>
          <div style="font-size: 20px; color: #3b82f6; font-weight: 800;">${uso}</div>
        </div>
        <div style="text-align: center; border-right: 1px solid #e2e8f0; padding: 0 15px; flex: 1;">
          <div style="font-size: 9px; color: #4338ca; text-transform: uppercase; font-weight: 700;">Reservados</div>
          <div style="font-size: 20px; color: #6366f1; font-weight: 800;">${res}</div>
        </div>
        <div style="text-align: center; padding-left: 15px; flex: 1;">
          <div style="font-size: 9px; color: #c2410c; text-transform: uppercase; font-weight: 700;">Mantenimiento</div>
          <div style="font-size: 20px; color: #ea580c; font-weight: 800;">${mant}</div>
        </div>
      </div>

      <!-- TABLA VERTICAL COMPACTA Y ELEGANTE -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-top: 2px solid #1e3a8a; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px 8px; text-align: left; font-weight: 800; color: #1e293b; width: 32%;">ACTIVO</th>
            <th style="padding: 10px 8px; text-align: left; font-weight: 800; color: #1e293b; width: 28%;">CLASIFICACIÓN</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: 800; color: #1e293b; width: 20%;">DISTRIBUCIÓN</th>
            <th style="padding: 10px 8px; text-align: center; font-weight: 800; color: #1e293b; width: 20%;">ESTADO ACTUAL</th>
          </tr>
        </thead>
        <tbody>
          ${inventario.map((eq, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
              <td style="padding: 12px 8px;">
                <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${eq.nombre}</div>
                <div style="font-size: 9px; color: #64748b; font-family: monospace; margin-top: 3px;">CÓDIGO: #${String(eq.id_equipo).padStart(4, '0')}</div>
              </td>
              <td style="padding: 12px 8px;">
                <div style="font-size: 10px; font-weight: 600; color: #334155;">${eq.ubicacion}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 3px;">Cat: ${eq.categoria || '-'}</div>
              </td>
              <td style="padding: 12px 8px;">
                <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #64748b; padding-bottom: 3px; text-align: right;">Total:</td><td style="font-weight: 800; color: #0f172a; text-align: left; padding-left: 4px; padding-bottom: 3px;">${eq.total}</td>
                    <td style="color: #64748b; padding-bottom: 3px; text-align: right; border-left: 1px solid #e2e8f0; padding-left: 6px;">Uso:</td><td style="font-weight: 800; color: #3b82f6; text-align: left; padding-left: 4px; padding-bottom: 3px;">${eq.enUso}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; text-align: right;">Disp:</td><td style="font-weight: 800; color: #10b981; text-align: left; padding-left: 4px;">${eq.disponible}</td>
                    <td style="color: #64748b; text-align: right; border-left: 1px solid #e2e8f0; padding-left: 6px;">Res:</td><td style="font-weight: 800; color: #6366f1; text-align: left; padding-left: 4px;">${eq.reservados}</td>
                  </tr>
                </table>
                ${eq.enMantenimiento > 0 ? `<div style="font-size: 9px; color: #ea580c; text-align: center; margin-top: 4px; font-weight: 700; background: #fff7ed; padding: 2px; border-radius: 3px;">En Mantenimiento: ${eq.enMantenimiento}</div>` : ''}
              </td>
              <td style="padding: 12px 8px; text-align: center;">
                <div style="display: inline-block; padding: 4px 8px; border-radius: 5px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
                  ${eq.estadoGeneral === 'Disponible' ? 'background: #ecfdf5; color: #10b981;' : 
                    eq.estadoGeneral === 'En uso' ? 'background: #eff6ff; color: #3b82f6;' : 
                    eq.estadoGeneral === 'Reservado' ? 'background: #eef2ff; color: #6366f1;' : 
                    eq.estadoGeneral === 'En mantenimiento' ? 'background: #fff7ed; color: #ea580c;' : 
                    'background: #fef2f2; color: #ef4444;'}">
                  ${eq.estadoGeneral}
                </div>
                <div style="font-size: 9px; color: #64748b; margin-top: 6px;">Resp: <strong>${eq.responsable}</strong></div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- FOOTER CORPORATIVO -->
      <div style="page-break-inside: avoid; margin-top: 30px;">
        <div style="background: #f8fafc; border-left: 3px solid #1e3a8a; padding: 12px; margin-bottom: 30px; font-size: 9px; color: #475569; line-height: 1.4;">
          <strong>OBSERVACIONES:</strong> El presente reporte refleja el estado consolidado de los activos audiovisuales. La columna "Distribución" desglosa matemáticamente la ocupación real del equipo. La disponibilidad es calculada en tiempo real tras deducir usos, reservas aprobadas y unidades en mantenimiento.
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="width: 200px; text-align: center;">
            <div style="border-bottom: 1px solid #1e293b; margin-bottom: 6px; height: 30px;"></div>
            <div style="font-size: 10px; font-weight: 700; color: #1e293b;">${generador}</div>
            <div style="font-size: 9px; color: #64748b;">Firma del Responsable</div>
          </div>
          
          <div style="text-align: right; font-size: 8px; color: #94a3b8; line-height: 1.3;">
            Documento de uso interno UAPA<br>
            Generado automáticamente por ProEvent System
          </div>
        </div>
      </div>

    </div>
  `;

  const opt = {
    margin:       [10, 10, 15, 10], // top, left, bottom, right
    filename:     `Inventario_Audiovisual_UAPA_${new Date().toISOString().slice(0, 10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }, // <--- CAMBIO A PORTRAIT AQUI
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184); 
      pdf.text(
        'Página ' + i + ' de ' + totalPages,
        pdf.internal.pageSize.getWidth() - 15,
        pdf.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }
  }).save();
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function InventarioAudiovisual({ usuario }) {
  const [equipos,     setEquipos]     = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Filtros
  const [searchTerm,        setSearchTerm]        = useState("");
  const [filtroCategoria,   setFiltroCategoria]   = useState("Todos");
  const [filtroEstado,      setFiltroEstado]       = useState("Todos");
  const [filtroUbicacion,   setFiltroUbicacion]   = useState("Todos");
  const [filtroResponsable, setFiltroResponsable] = useState("Todos");

  // Modal detalle
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [modalTab,       setModalTab]       = useState("resumen");
  const [isModalOpen,    setIsModalOpen]    = useState(false);

  // Modal mantenimiento
  const [mantModal,       setMantModal]       = useState(false);
  const [mantEquipo,      setMantEquipo]      = useState(null);
  const [mantTipo,        setMantTipo]        = useState("Preventivo");
  const [mantDescripcion, setMantDescripcion] = useState("");
  const [mantFecha,       setMantFecha]       = useState(new Date().toISOString().slice(0, 10));
  const [mantenimientos,  setMantenimientos]  = useState({});

  // Meta (ubicacion/responsable por ID de equipo)
  const equiposMeta = useRef({});
  const getMeta = useCallback((id) => {
    if (!equiposMeta.current[id]) {
      equiposMeta.current[id] = {
        ubicacion:   UBICACIONES[id % UBICACIONES.length],
        responsable: RESPONSABLES[id % RESPONSABLES.length],
      };
    }
    return equiposMeta.current[id];
  }, []);

  // -- CARGA DE DATOS --
  const cargarDatos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/equipos-audiovisuales`),
        fetch(`${API}/audiovisual`),
        fetch(`${API}/mantenimiento-audiovisual`),
      ]);
      const dEq  = await r1.json();
      const dSol = await r2.json();
      const dMant = await r3.json();

      setEquipos(Array.isArray(dEq) ? dEq : []);
      
      const mantMap = {};
      if (Array.isArray(dMant)) {
        dMant.forEach(m => {
          if (!mantMap[m.id_equipo]) mantMap[m.id_equipo] = { activo: true, cantidad: 0, registros: [] };
          mantMap[m.id_equipo].cantidad += m.cantidad || 1;
          mantMap[m.id_equipo].registros.push(m);
        });
      }
      setMantenimientos(mantMap);

      setSolicitudes(Array.isArray(dSol) ? dSol.map(row => ({
        id_servicio:     row.id_servicio,
        id_evento:       row.id_evento,
        estado_av:       row.estado_av,
        cantidad:        row.cantidad || 1,
        nombre_evento:   row.nombre_evento,
        fecha_evento:    row.fecha_inicio,
        fecha_devolucion:row.fecha_fin || null,
        recinto:         row.recinto,
        nombre_usuario:  row.nombre_usuario || "-",
        equipo:          row.equipo,
      })) : []);
    } catch {
      setError("No se pudo conectar con el servidor ProEvent.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // -- INVENTARIO CALCULADO --
  const inventario = equipos.map(eq => {
    const meta  = getMeta(eq.id_equipo);
    const solEq = solicitudes.filter(s => s.equipo === eq.nombre);

    const total           = eq.cantidad_total || 0;
    const rawMantenimiento = mantenimientos[eq.id_equipo]?.cantidad || 0;
    const rawUso           = solEq.filter(s => s.estado_av === "Aprobado").reduce((a, s) => a + s.cantidad, 0);
    const rawReservados    = solEq.filter(s => s.estado_av === "Pendiente").reduce((a, s) => a + s.cantidad, 0);

    // Lógica para que la suma nunca exceda el total (Prioridad: Mantenimiento > Uso > Reservas)
    const enMantenimiento = Math.min(rawMantenimiento, total);
    const enUso           = Math.min(rawUso, total - enMantenimiento);
    const reservados      = Math.min(rawReservados, total - enMantenimiento - enUso);
    const disponible      = Math.max(0, total - enMantenimiento - enUso - reservados);

    let estadoGeneral = "Disponible";
    if (enMantenimiento > 0 && disponible === 0)  estadoGeneral = "En mantenimiento";
    else if (enUso > 0 && disponible === 0)       estadoGeneral = "En uso";
    else if (reservados > 0 && disponible === 0)  estadoGeneral = "Reservado";
    else if (disponible === 0)                    estadoGeneral = "Fuera de servicio";
    else if (enMantenimiento > 0)                 estadoGeneral = "En mantenimiento";

    const activas   = solEq.filter(s => ["Pendiente", "En revision", "Aprobado"].includes(s.estado_av));
    const historial = solEq.filter(s => !["Pendiente", "En revision", "Aprobado"].includes(s.estado_av));

    return {
      ...eq, total, disponible, reservados, enUso, enMantenimiento,
      estadoGeneral, activas, historial,
      ubicacion:   eq.ubicacion   || meta.ubicacion,
      responsable: eq.responsable || meta.responsable,
    };
  });

  // -- FILTRADO --
  const filtered = inventario.filter(eq =>
    eq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filtroCategoria   === "Todos" || eq.categoria     === filtroCategoria) &&
    (filtroEstado      === "Todos" || eq.estadoGeneral === filtroEstado) &&
    (filtroUbicacion   === "Todos" || eq.ubicacion     === filtroUbicacion) &&
    (filtroResponsable === "Todos" || eq.responsable   === filtroResponsable)
  );

  const categorias = ["Todos", ...new Set(inventario.map(e => e.categoria).filter(Boolean))];
  const hayFiltros = searchTerm || filtroCategoria !== "Todos" || filtroEstado !== "Todos"
    || filtroUbicacion !== "Todos" || filtroResponsable !== "Todos";

  // -- KPIs --
  const kpiTotal       = inventario.reduce((a, e) => a + e.total, 0);
  const kpiDisp        = inventario.reduce((a, e) => a + e.disponible, 0);
  const kpiRes         = inventario.reduce((a, e) => a + e.reservados, 0);
  const kpiUso         = inventario.reduce((a, e) => a + e.enUso, 0);
  const kpiMant        = inventario.filter(e => e.estadoGeneral === "En mantenimiento").length;
  const kpiDan         = inventario.filter(e => ["Dañado", "Fuera de servicio"].includes(e.estadoGeneral)).length;

  const fmt = (f) => {
    if (!f) return "N/D";
    return new Date(f).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  // -- MANTENIMIENTO --
  const [mantCantidad, setMantCantidad] = useState(1);

  const openMant = (eq) => {
    setMantEquipo(eq);
    setMantDescripcion("");
    setMantTipo("Preventivo");
    setMantCantidad(1);
    setMantFecha(new Date().toISOString().slice(0, 10));
    setMantModal(true);
  };

  const saveMant = async () => {
    if (!mantEquipo) return;
    try {
      const res = await fetch(`${API}/mantenimiento-audiovisual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_equipo: mantEquipo.id_equipo,
          tipo: mantTipo,
          descripcion: mantDescripcion,
          cantidad: parseInt(mantCantidad, 10) || 1,
          fecha_inicio: mantFecha
        })
      });
      if (res.ok) {
        setMantModal(false);
        cargarDatos(true);
      } else {
        alert("Error al registrar mantenimiento");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const liberarMant = async (id_equipo) => {
    if (!window.confirm("¿Seguro que deseas liberar todos los mantenimientos activos de este equipo?")) return;
    const registros = mantenimientos[id_equipo]?.registros || [];
    try {
      await Promise.all(registros.map(r => 
        fetch(`${API}/mantenimiento-audiovisual/${r.id_mantenimiento}/resolver`, { method: "PUT" })
      ));
      cargarDatos(true);
    } catch (e) {
      alert("Error al resolver mantenimientos.");
    }
  };

  const liberarMantRecord = async (id_mantenimiento) => {
    try {
      const res = await fetch(`${API}/mantenimiento-audiovisual/${id_mantenimiento}/resolver`, { method: "PUT" });
      if (res.ok) cargarDatos(true);
    } catch (e) {
      alert("Error al resolver mantenimiento");
    }
  };

  // -- MODALES --
  const openModal = (eq, tab = "resumen") => {
    setSelectedEquipo(eq);
    setModalTab(tab);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEquipo(null);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="animate-fade" style={{ fontFamily: "var(--font-family-base, 'Inter', sans-serif)" }}>
      <style>{`
        @media print { .no-print { display: none !important; } body { background: white !important; } }
        .inv-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .inv-btn:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
        .inv-btn.primary { color: #3b82f6; border-color: #bfdbfe; }
        .inv-btn.primary:hover { background: #eff6ff; }
        .inv-btn.danger { color: #ef4444; border-color: #fecaca; }
        .inv-btn.danger:hover { background: #fef2f2; }
        .inv-btn.orange { color: #ea580c; border-color: #fed7aa; }
        .inv-btn.orange:hover { background: #fff7ed; }
        .inv-btn:disabled { opacity: .4; cursor: not-allowed; }
        .tab-btn { padding: 8px 16px; border: none; background: transparent; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all .15s; }
        .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        .tab-btn:hover:not(.active) { color: #1e293b; background: #f8fafc; }
        .inv-sel { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; font-size: 13px; font-weight: 500; outline: none; cursor: pointer; }
        .inv-sel:focus { border-color: #3b82f6; }
        .kpi-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.05); transition: box-shadow .2s; }
        .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
        .inv-tr:hover { background: #f0f7ff !important; }
        .mant-badge { display: inline-flex; align-items: center; gap: 4px; background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 700; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }} className="no-print">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FiPackage style={{ color: "#3b82f6" }} /> Inventario Audiovisual
          </h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", marginTop: "4px" }}>
            Gestion profesional de activos · Control en tiempo real
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" className="inv-btn primary" onClick={() => exportarCSV(filtered)}>
            <FiDownload size={14} /> Exportar CSV
          </button>
          <button type="button" className="inv-btn" onClick={() => exportarPDF(filtered, { searchTerm, filtroCategoria, filtroEstado, filtroUbicacion, filtroResponsable }, usuario)}>
            <FiDownload size={14} /> Exportar PDF
          </button>
          <button type="button" className="inv-btn" onClick={() => cargarDatos()}>
            <FiRefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#991b1b", display: "flex", gap: "8px", alignItems: "center" }} className="no-print">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* KPIs */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: "14px", marginBottom: "22px" }}>
          {[
            { label: "Total Equipos",    value: kpiTotal, icon: <FiBox />,          color: "#3b82f6", bg: "#eff6ff" },
            { label: "Disponibles",      value: kpiDisp,  icon: <FiCheckCircle />,  color: "#10b981", bg: "#ecfdf5" },
            { label: "Reservados",       value: kpiRes,   icon: <FiCalendar />,     color: "#6366f1", bg: "#eef2ff" },
            { label: "En Uso",           value: kpiUso,   icon: <FiActivity />,     color: "#f59e0b", bg: "#fffbeb" },
            { label: "En Mantenimiento", value: kpiMant,  icon: <FiTool />,         color: "#ea580c", bg: "#fff7ed" },
            { label: "Dañados / F.S.",   value: kpiDan,   icon: <FiAlertTriangle />,color: "#ef4444", bg: "#fef2f2" },
          ].map((k, i) => (
            <div key={i} className="kpi-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</span>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, flexShrink: 0 }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px", marginBottom: "18px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }} className="no-print">
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <FiSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={13} />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: "30px", paddingRight: "10px", paddingTop: "7px", paddingBottom: "7px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select className="inv-sel" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="inv-sel" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="Todos">Todos los estados</option>
          {ESTADOS_EQUIPO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select className="inv-sel" value={filtroUbicacion} onChange={e => setFiltroUbicacion(e.target.value)}>
          <option value="Todos">Todas las ubicaciones</option>
          {UBICACIONES.map(u => <option key={u}>{u}</option>)}
        </select>
        <select className="inv-sel" value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}>
          <option value="Todos">Todos los responsables</option>
          {RESPONSABLES.map(r => <option key={r}>{r}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="inv-btn danger"
            onClick={() => { setSearchTerm(""); setFiltroCategoria("Todos"); setFiltroEstado("Todos"); setFiltroUbicacion("Todos"); setFiltroResponsable("Todos"); }}>
            <FiXCircle size={13} /> Limpiar
          </button>
        )}
        <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto", fontWeight: "500" }}>
          {filtered.length} de {inventario.length} equipos
        </span>
      </div>

      {/* TABLA */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
            <div className="loader" style={{ margin: "0 auto 14px", borderColor: "#e2e8f0", borderTopColor: "#3b82f6" }} />
            <p style={{ margin: 0 }}>Cargando inventario...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Equipo", "Total", "Disponible", "Reservado", "En Uso", "Mant.", "Estado", "Ubicacion", "Responsable", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: h === "Equipo" ? "left" : "center", fontWeight: "700", color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                      <FiBox size={32} style={{ display: "block", margin: "0 auto 12px", opacity: .3 }} />
                      No se encontraron equipos con los filtros aplicados.
                    </td>
                  </tr>
                ) : filtered.map((eq, idx) => {
                  const bloqueado = ["En mantenimiento", "Fuera de servicio", "Dañado"].includes(eq.estadoGeneral);
                  return (
                    <tr key={eq.id_equipo} className="inv-tr"
                      style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafbfc", transition: "background .15s" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bloqueado ? "linear-gradient(135deg,#94a3b8,#64748b)" : "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                            <IconoEquipo icono={eq.icono} />
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>{eq.nombre}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500" }}>{eq.categoria || "General"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "700", color: "#334155" }}>{eq.total}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: "800", fontSize: "15px", color: eq.disponible > 0 ? "#10b981" : "#ef4444" }}>{eq.disponible}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {eq.reservados > 0
                          ? <span style={{ fontWeight: "700", color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: "5px" }}>{eq.reservados}</span>
                          : <span style={{ color: "#cbd5e1" }}>-</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {eq.enUso > 0
                          ? <span style={{ fontWeight: "700", color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: "5px" }}>{eq.enUso}</span>
                          : <span style={{ color: "#cbd5e1" }}>-</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {eq.enMantenimiento > 0
                          ? <span className="mant-badge"><FiTool size={10} />{eq.enMantenimiento}</span>
                          : <span style={{ color: "#cbd5e1" }}>-</span>}
                      </td>
                      <td style={{ textAlign: "center" }}><EstadoBadge estado={eq.estadoGeneral} /></td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12px" }}>
                          <FiMapPin size={11} style={{ flexShrink: 0, color: "#94a3b8" }} />{eq.ubicacion}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12px" }}>
                          <FiUser size={11} style={{ flexShrink: 0, color: "#94a3b8" }} />{eq.responsable}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "nowrap" }}>
                          <button type="button" className="inv-btn primary" title="Ver detalle" onClick={() => openModal(eq, "resumen")}>
                            <FiEye size={13} />
                          </button>
                          <button type="button" className="inv-btn" title="Historial" onClick={() => openModal(eq, "historial")}>
                            <FiArchive size={13} />
                          </button>
                          <button type="button" className="inv-btn" title="Ver reservas" onClick={() => openModal(eq, "reservas")}>
                            <FiCalendar size={13} />
                          </button>
                          {eq.enMantenimiento > 0
                            ? <button type="button" className="inv-btn orange" title="Liberar de mantenimiento" onClick={() => liberarMant(eq.id_equipo)}><FiCheckCircle size={13} /></button>
                            : <button type="button" className="inv-btn orange" title="Registrar mantenimiento" onClick={() => openMant(eq)}><FiTool size={13} /></button>
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {isModalOpen && selectedEquipo && createPortal(
        <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 9999 }}>
          <div className="modal-content modal-premium" onClick={e => e.stopPropagation()} style={{ maxWidth: "760px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <IconoEquipo icono={selectedEquipo.icono} size={22} />
                </div>
                <div>
                  <h3 className="modal-title">{selectedEquipo.nombre}</h3>
                  <span className="modal-subtitle">{selectedEquipo.categoria || "Audiovisual"} - {selectedEquipo.ubicacion}</span>
                </div>
              </div>
              <EstadoBadge estado={selectedEquipo.estadoGeneral} />
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0, padding: "0 24px", gap: "4px" }}>
              {[
                { id: "resumen",       label: "Resumen",        icon: <FiBox size={13} /> },
                { id: "reservas",      label: "Reservas",       icon: <FiCalendar size={13} /> },
                { id: "historial",     label: "Historial",      icon: <FiArchive size={13} /> },
                { id: "mantenimiento", label: "Mantenimiento",  icon: <FiTool size={13} /> },
              ].map(t => (
                <button key={t.id} className={`tab-btn ${modalTab === t.id ? "active" : ""}`} onClick={() => setModalTab(t.id)}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>{t.icon} {t.label}</span>
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>

              {/* TAB RESUMEN */}
              {modalTab === "resumen" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px", marginBottom: "18px" }}>
                    {[
                      { label: "Total",          value: selectedEquipo.total,           color: "#3b82f6", bg: "#eff6ff" },
                      { label: "Disponibles",    value: selectedEquipo.disponible,      color: "#10b981", bg: "#ecfdf5" },
                      { label: "Reservados",     value: selectedEquipo.reservados,      color: "#6366f1", bg: "#eef2ff" },
                      { label: "En Uso",         value: selectedEquipo.enUso,           color: "#f59e0b", bg: "#fffbeb" },
                      { label: "Mantenimiento",  value: selectedEquipo.enMantenimiento, color: "#ea580c", bg: "#fff7ed" },
                    ].map((k, i) => (
                      <div key={i} style={{ background: k.bg, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "800", color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>{k.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div className="info-card">
                      <div className="info-card-title"><FiBox size={14} /> Informacion General</div>
                      <div className="info-row"><span className="info-label">Nombre</span><span className="info-value">{selectedEquipo.nombre}</span></div>
                      <div className="info-row"><span className="info-label">Categoria</span><span className="info-value">{selectedEquipo.categoria || "-"}</span></div>
                      <div className="info-row"><span className="info-label">Estado</span><EstadoBadge estado={selectedEquipo.estadoGeneral} /></div>
                    </div>
                    <div className="info-card">
                      <div className="info-card-title"><FiMapPin size={14} /> Localizacion</div>
                      <div className="info-row"><span className="info-label">Ubicacion</span><span className="info-value">{selectedEquipo.ubicacion}</span></div>
                      <div className="info-row"><span className="info-label">Responsable</span><span className="info-value">{selectedEquipo.responsable}</span></div>
                      <div className="info-row"><span className="info-label">Reservas activas</span><span className="info-value" style={{ fontWeight: "700", color: "#6366f1" }}>{selectedEquipo.activas?.length || 0}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB RESERVAS */}
              {modalTab === "reservas" && (
                selectedEquipo.activas?.length === 0
                  ? <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><FiCalendar size={30} style={{ display: "block", margin: "0 auto 10px", opacity: .3 }} />No hay reservas activas.</div>
                  : <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                          {["ID", "Evento", "Solicitante", "Fecha", "Recinto", "Cant.", "Estado"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: "700", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEquipo.activas.map(s => (
                          <tr key={s.id_servicio} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px", fontWeight: "600", color: "#64748b" }}>#{s.id_evento}</td>
                            <td style={{ padding: "10px 12px", fontWeight: "600", color: "#0f172a" }}>{s.nombre_evento}</td>
                            <td style={{ padding: "10px 12px", color: "#475569" }}>{s.nombre_usuario}</td>
                            <td style={{ padding: "10px 12px", color: "#475569" }}>{fmt(s.fecha_evento)}</td>
                            <td style={{ padding: "10px 12px", color: "#475569" }}>{s.recinto || "-"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "700", color: "#6366f1" }}>{s.cantidad}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span className={`badge ${s.estado_av === "Aprobado" ? "badge-green" : "badge-yellow"}`} style={{ fontSize: "11px", padding: "3px 8px" }}>{s.estado_av}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              )}

              {/* TAB HISTORIAL */}
              {modalTab === "historial" && (
                selectedEquipo.historial?.length === 0
                  ? <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}><FiArchive size={30} style={{ display: "block", margin: "0 auto 10px", opacity: .3 }} />Sin historial de movimientos.</div>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedEquipo.historial.map((s, i) => (
                      <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FiArchive size={15} style={{ color: "#64748b" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>{s.nombre_evento}</div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <span><FiUser size={11} style={{ verticalAlign: "middle" }} /> {s.nombre_usuario}</span>
                            <span><FiCalendar size={11} style={{ verticalAlign: "middle" }} /> {fmt(s.fecha_evento)}</span>
                            {s.fecha_devolucion && <span><FiClock size={11} style={{ verticalAlign: "middle" }} /> Dev: {fmt(s.fecha_devolucion)}</span>}
                            <span>Cant: <strong>{s.cantidad}</strong></span>
                          </div>
                        </div>
                        <span className={`badge ${s.estado_av === "Aprobado" ? "badge-green" : "badge-red"}`} style={{ fontSize: "11px", padding: "3px 8px" }}>{s.estado_av}</span>
                      </div>
                    ))}
                  </div>
              )}

              {/* TAB MANTENIMIENTO */}
              {modalTab === "mantenimiento" && (
                <div>
                  {mantenimientos[selectedEquipo.id_equipo]?.activo && (
                    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "700", color: "#ea580c", display: "flex", gap: "6px", alignItems: "center" }}><FiTool size={14} /> Equipo en mantenimiento activo</div>
                        <div style={{ fontSize: "12px", color: "#c2410c", marginTop: "3px" }}>
                          {mantenimientos[selectedEquipo.id_equipo]?.tipo} - {fmt(mantenimientos[selectedEquipo.id_equipo]?.fecha)}
                        </div>
                      </div>
                      <button type="button" className="inv-btn primary" onClick={() => { liberarMant(selectedEquipo.id_equipo); closeModal(); }}>
                        <FiCheckCircle size={13} /> Liberar equipo
                      </button>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h4 style={{ margin: 0, fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>Historial de Mantenimientos</h4>
                    <button type="button" className="inv-btn orange" onClick={() => { closeModal(); openMant(selectedEquipo); }}>
                      <FiPlusCircle size={13} /> Registrar
                    </button>
                  </div>
                  {(mantenimientos[selectedEquipo.id_equipo]?.registros || []).length === 0
                    ? <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}><FiTool size={28} style={{ display: "block", margin: "0 auto 10px", opacity: .3 }} />Sin registros de mantenimiento.</div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {mantenimientos[selectedEquipo.id_equipo].registros.map((r, i) => (
                        <div key={i} style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <span style={{ fontWeight: "700", color: "#ea580c", fontSize: "12px" }}>{r.tipo} (Cant: {r.cantidad})</span>
                              <span style={{ marginLeft: "8px", fontSize: "11px", color: "#94a3b8" }}>{fmt(r.fecha_inicio)}</span>
                            </div>
                            <button type="button" className="inv-btn primary" style={{ padding: '2px 8px' }} onClick={() => liberarMantRecord(r.id_mantenimiento)}>Resolver</button>
                          </div>
                          {r.descripcion && <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#475569" }}>{r.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ flexShrink: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL REGISTRAR MANTENIMIENTO */}
      {mantModal && mantEquipo && createPortal(
        <div className="modal-overlay" onClick={() => setMantModal(false)} style={{ zIndex: 10000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: "800", fontSize: "18px", color: "#0f172a" }}>Registrar Mantenimiento</h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>{mantEquipo.nombre}</p>
              </div>
              <span className="mant-badge"><FiTool size={12} /> Mantenimiento</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>Tipo</label>
                <select className="inv-sel" value={mantTipo} onChange={e => setMantTipo(e.target.value)} style={{ width: "100%" }}>
                  <option>Preventivo</option>
                  <option>Correctivo</option>
                  <option>Inspeccion</option>
                  <option>Calibracion</option>
                  <option>Dañado</option>
                  <option>Fuera de servicio</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>Cantidad</label>
                  <input type="number" min="1" max={mantEquipo.total} value={mantCantidad} onChange={e => setMantCantidad(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>Fecha de inicio</label>
                  <input type="date" value={mantFecha} onChange={e => setMantFecha(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>Descripcion / Diagnostico</label>
                <textarea rows={3} value={mantDescripcion} onChange={e => setMantDescripcion(e.target.value)}
                  placeholder="Describe el mantenimiento o falla detectada..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setMantModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" style={{ background: "#ea580c", borderColor: "#ea580c" }} onClick={saveMant}>
                <FiTool style={{ marginRight: "6px" }} /> Registrar y Bloquear
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default InventarioAudiovisual;
