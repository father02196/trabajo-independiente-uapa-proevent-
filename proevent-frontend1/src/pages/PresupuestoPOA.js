import React from "react";

export default function PresupuestoPOA({ data, setData }) {
  return (
    <section>
      <h3>Presupuesto y POA</h3>
      <input 
        type="number" 
        placeholder="Presupuesto Estimado" 
        value={data.presupuesto} 
        onChange={(e)=>setData({...data, presupuesto:e.target.value})} 
      />
      <select value={data.moneda} onChange={(e)=>setData({...data, moneda:e.target.value})}>
        <option value="DOP">DOP</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
      <textarea 
        placeholder="Observaciones / Instrucciones Especiales" 
        value={data.observaciones} 
        onChange={(e)=>setData({...data, observaciones:e.target.value})} 
      />
    </section>
  );
}
