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
    <section>
      <h3>Servicios alimenticios y Detalles corporativos</h3>

      {/* Lista de detalles corporativos */}
      <div className="checklist">
        <h4>Tipos de detalles corporativos</h4>
        {detallesCorp.map((d) => (
          <label key={d.id_detalle_corp} className="check-item">
            <input
              type="checkbox"
              checked={data.items?.includes(d.nombre) || false}
              onChange={() => toggleItem(d.nombre, "items")}
            />
            {d.nombre}
          </label>
        ))}
      </div>

      {/* Lista de alimentos y bebidas */}
      <div className="checklist">
        <h4>Alimentos y bebidas</h4>
        {alimentos.map((a) => (
          <label key={a.id_alimento} className="check-item">
            <input
              type="checkbox"
              checked={data.catering?.includes(a.nombre) || false}
              onChange={() => toggleItem(a.nombre, "catering")}
            />
            {a.nombre}
          </label>
        ))}
      </div>
    </section>
  );
}
