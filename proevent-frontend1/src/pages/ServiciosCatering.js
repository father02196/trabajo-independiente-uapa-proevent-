import React, { useState, useEffect } from "react";

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
    <div className="space-y-8 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Servicios alimenticios y Detalles corporativos</h3>
        <p className="text-sm text-text-secondary">Selecciona los elementos extra que requerirá el evento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lista de detalles corporativos */}
        <div className="p-6 border border-border-soft rounded-xl bg-bg-card shadow-sm">
          <h4 className="text-base font-bold text-text-main mb-4 border-b border-border-soft pb-2">Tipos de detalles corporativos</h4>
          <div className="space-y-3">
            {detallesCorp.map((d) => {
              const isChecked = data.items?.includes(d.nombre) || false;
              return (
                <label key={d.id_detalle_corp} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-accent-light border-accent-primary text-accent-primary font-semibold' : 'border-transparent hover:bg-bg-subtle text-text-secondary'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-accent-primary rounded border-border-medium focus:ring-accent-primary"
                    checked={isChecked}
                    onChange={() => toggleItem(d.nombre, "items")}
                  />
                  <span>{d.nombre}</span>
                </label>
              );
            })}
            {detallesCorp.length === 0 && <p className="text-sm text-text-muted">No hay detalles disponibles.</p>}
          </div>
        </div>

        {/* Lista de alimentos y bebidas */}
        <div className="p-6 border border-border-soft rounded-xl bg-bg-card shadow-sm">
          <h4 className="text-base font-bold text-text-main mb-4 border-b border-border-soft pb-2">Alimentos y bebidas</h4>
          <div className="space-y-3">
            {alimentos.map((a) => {
              const isChecked = data.catering?.includes(a.nombre) || false;
              return (
                <label key={a.id_alimento} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-accent-light border-accent-primary text-accent-primary font-semibold' : 'border-transparent hover:bg-bg-subtle text-text-secondary'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-accent-primary rounded border-border-medium focus:ring-accent-primary"
                    checked={isChecked}
                    onChange={() => toggleItem(a.nombre, "catering")}
                  />
                  <span>{a.nombre}</span>
                </label>
              );
            })}
            {alimentos.length === 0 && <p className="text-sm text-text-muted">No hay alimentos disponibles.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
