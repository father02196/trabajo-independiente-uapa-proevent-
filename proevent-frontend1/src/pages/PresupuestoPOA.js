import React from "react";

export default function PresupuestoPOA({ data, setData }) {
  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Presupuesto y POA</h3>
        <p className="text-sm text-text-secondary">Información financiera y observaciones generales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-text-main mb-2">Presupuesto Estimado <span className="text-danger">*</span></label>
          <div className="flex">
            <select 
              className="input-base !w-24 !rounded-r-none border-r-0 bg-bg-subtle"
              value={data.moneda} 
              onChange={(e)=>setData({...data, moneda:e.target.value})}
            >
              <option value="DOP">DOP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <input 
              type="number" 
              className="input-base !rounded-l-none flex-1"
              placeholder="0.00" 
              value={data.presupuesto} 
              onChange={(e)=>setData({...data, presupuesto:e.target.value})} 
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-text-main mb-2">Observaciones / Instrucciones Especiales</label>
        <textarea 
          className="input-base min-h-[120px]"
          placeholder="Escribe cualquier detalle adicional importante..." 
          value={data.observaciones} 
          onChange={(e)=>setData({...data, observaciones:e.target.value})} 
        />
      </div>
    </div>
  );
}
