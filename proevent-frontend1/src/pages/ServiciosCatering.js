// ============================================================
// COMPONENTE: ServiciosCatering
// Pertenece a: Módulo de Solicitudes / Eventos
// Propósito: Paso de configuración extra en el Wizard de evento.
// Permite seleccionar detalles corporativos, alimentos, y sugerir 
// proveedores externos que podrían requerir una licitación.
// ============================================================

import React, { useState, useEffect } from "react";
import { FiBriefcase, FiCoffee } from "react-icons/fi";

const API = "http://localhost:8080";

export default function ServiciosyDetalles({ data, setData }) {
  // --- ESTADOS ---
  const [detallesCorp, setDetallesCorp] = useState([]);
  const [alimentos, setAlimentos] = useState([]);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    fetch(`${API}/tipos-detalle-corporativo`)
      .then(res => res.json())
      .then(lista => setDetallesCorp(Array.isArray(lista) ? lista : []))
      .catch(err => console.error(err));

    fetch(`${API}/alimentos`)
      .then(res => res.json())
      .then(lista => setAlimentos(Array.isArray(lista) ? lista : []))
      .catch(err => console.error(err));
  }, []);

  // --- FUNCIÓN: toggleItem ---
  // Agrega o remueve un elemento (alimento/detalle) de la lista de selección
  const toggleItem = (item, listName) => {
    const list = data[listName] || [];

    if (listName === "items" || listName === "catering") {
      const isNoAplica = item.trim().toLowerCase() === "no aplica";
      if (isNoAplica) {
        if (list.includes(item)) {
          // Desmarcar "No Aplica" limpia la lista
          setData({ ...data, [listName]: [] });
        } else {
          // Marcar "No Aplica" limpia todo lo demás y solo deja "No Aplica"
          setData({ ...data, [listName]: [item] });
        }
      } else {
        if (list.includes(item)) {
          // Desmarcar opción regular
          setData({ ...data, [listName]: list.filter(i => i !== item) });
        } else {
          // Marcar opción regular: agregarla y remover "No Aplica" si estuviera
          const newList = [...list.filter(i => i.trim().toLowerCase() !== "no aplica"), item];
          setData({ ...data, [listName]: newList });
        }
      }
    } else {
      // Comportamiento normal para otros
      if (list.includes(item)) {
        setData({ ...data, [listName]: list.filter(i => i !== item) });
      } else {
        setData({ ...data, [listName]: [...list, item] });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Servicios alimenticios y Detalles corporativos</h3>
        <p className="text-sm text-text-secondary">Selecciona los elementos extra que requerirá el evento.</p>
      </div>

      <div className="space-y-6">
        {/* Detalles Corporativos */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-3">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase size={15} style={{ color: '#3B82F6' }} />
              Tipos de detalles corporativos
            </span>
          </label>
          <div className="checklist">
            <div className="checklist-grid">
              {detallesCorp.map((d) => {
                const isChecked = data.items?.includes(d.nombre) || false;
                const isNoAplicaOption = d.nombre.trim().toLowerCase() === "no aplica";
                const isNoAplicaSelected = data.items?.some(i => i.trim().toLowerCase() === "no aplica") || false;
                const isDisabled = !isNoAplicaOption && isNoAplicaSelected;

                return (
                  <label 
                    key={d.id_detalle_corp} 
                    className="check-item" 
                    style={{ 
                      gap: '16px', 
                      padding: '14px 20px', 
                      minHeight: '52px',
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleItem(d.nombre, "items")}
                      style={{ 
                        transform: 'scale(1.15)', 
                        cursor: isDisabled ? 'not-allowed' : 'pointer', 
                        flexShrink: 0 
                      }}
                    />
                    <span style={{ 
                      marginLeft: '8px',
                      color: isChecked ? '#2563EB' : (isDisabled ? '#94A3B8' : '#334155'), 
                      fontWeight: isChecked ? 600 : 500,
                      lineHeight: '1.4'
                    }}>
                      {d.nombre}
                    </span>
                  </label>
                );
              })}
            </div>
            {detallesCorp.length === 0 && (
              <p className="text-sm text-text-secondary" style={{ textAlign: 'center', padding: '12px 0' }}>
                No hay detalles disponibles.
              </p>
            )}
          </div>
        </div>

        {/* Alimentos y Bebidas */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-3">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCoffee size={15} style={{ color: '#3B82F6' }} />
              Alimentos y bebidas
            </span>
          </label>
          <div className="checklist">
            <div className="checklist-grid">
              {alimentos.map((a) => {
                const isChecked = data.catering?.includes(a.nombre) || false;
                const isNoAplicaOption = a.nombre.trim().toLowerCase() === "no aplica";
                const isNoAplicaSelected = data.catering?.some(i => i.trim().toLowerCase() === "no aplica") || false;
                const isDisabled = !isNoAplicaOption && isNoAplicaSelected;

                return (
                  <label 
                    key={a.id_alimento} 
                    className="check-item" 
                    style={{ 
                      gap: '16px', 
                      padding: '14px 20px', 
                      minHeight: '52px',
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleItem(a.nombre, "catering")}
                      style={{ 
                        transform: 'scale(1.15)', 
                        cursor: isDisabled ? 'not-allowed' : 'pointer', 
                        flexShrink: 0 
                      }}
                    />
                    <span style={{ 
                      marginLeft: '8px',
                      color: isChecked ? '#2563EB' : (isDisabled ? '#94A3B8' : '#334155'), 
                      fontWeight: isChecked ? 600 : 500,
                      lineHeight: '1.4'
                    }}>
                      {a.nombre}
                    </span>
                  </label>
                );
              })}
            </div>
            {alimentos.length === 0 && (
              <p className="text-sm text-text-secondary" style={{ textAlign: 'center', padding: '12px 0' }}>
                No hay alimentos disponibles.
              </p>
            )}
          </div>
        </div>

        {/* Sugerencias de Proveedores Externos (Flujo Colaborativo) */}
        <div>
          <label className="block text-sm font-bold text-text-main mb-3">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase size={15} style={{ color: '#F59E0B' }} />
              Sugerencias de Servicios Externos (Opcional)
            </span>
          </label>
          <p className="text-sm text-text-secondary mb-3">
            ¿Necesitas contratar servicios de terceros (Transporte, Decoración Especial, Seguridad Extra)? Indícalo aquí para que el Administrador evalúe abrir una licitación.
          </p>
          <textarea
            className="input-base"
            style={{ width: '100%', minHeight: '80px', padding: '12px', resize: 'vertical' }}
            placeholder="Ej: Necesitamos transporte para 50 invitados y decoración temática..."
            value={data.sugerencias_externas || ""}
            onChange={(e) => setData({ ...data, sugerencias_externas: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
