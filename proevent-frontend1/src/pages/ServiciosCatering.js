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
      <div className="checklist" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4>Tipos de detalles corporativos</h4>
        {[...detallesCorp]
          .sort((a, b) => a.nombre.toLowerCase().includes('no aplica') ? 1 : b.nombre.toLowerCase().includes('no aplica') ? -1 : 0)
          .map((d) => (
          <label key={d.id_detalle_corp} className="check-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px dashed #ccc', 
            paddingBottom: '5px',
            marginBottom: '5px',
            cursor: 'pointer'
          }}>
            <span>{d.nombre}</span>
            <input
              type="checkbox"
              checked={data.items?.includes(d.nombre) || false}
              onChange={() => toggleItem(d.nombre, "items")}
              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
            />
          </label>
        ))}
      </div>

      {/* Lista de alimentos y bebidas */}
      <div className="checklist" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4>Alimentos y bebidas</h4>
        {alimentos.map((a) => (
          <label key={a.id_alimento} className="check-item" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px dashed #ccc', 
            paddingBottom: '5px',
            marginBottom: '5px',
            cursor: 'pointer'
          }}>
            <span>{a.nombre}</span>
            <input
              type="checkbox"
              checked={data.catering?.includes(a.nombre) || false}
              onChange={() => toggleItem(a.nombre, "catering")}
              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
