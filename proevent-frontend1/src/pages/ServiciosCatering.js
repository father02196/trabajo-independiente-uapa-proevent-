import React, { useState, useEffect } from "react";
import { FiBriefcase, FiCoffee } from "react-icons/fi";

const API = "http://localhost:8080";

export default function ServiciosyDetalles({ data, setData }) {
  const [detallesCorp, setDetallesCorp] = useState([]);
  const [alimentos, setAlimentos] = useState([]);

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

  const toggleItem = (item, listName) => {
    const list = data[listName] || [];
    if (list.includes(item)) {
      setData({ ...data, [listName]: list.filter(i => i !== item) });
    } else {
      setData({ ...data, [listName]: [...list, item] });
    }
  };

  return (
    <div className="space-y-6 animate-fade">
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
                return (
                  <label key={d.id_detalle_corp} className="check-item" style={{ gap: '16px', padding: '14px 20px', minHeight: '52px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(d.nombre, "items")}
                      style={{ transform: 'scale(1.15)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ 
                      marginLeft: '8px',
                      color: isChecked ? '#2563EB' : '#334155', 
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
                return (
                  <label key={a.id_alimento} className="check-item" style={{ gap: '16px', padding: '14px 20px', minHeight: '52px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(a.nombre, "catering")}
                      style={{ transform: 'scale(1.15)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ 
                      marginLeft: '8px',
                      color: isChecked ? '#2563EB' : '#334155', 
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
