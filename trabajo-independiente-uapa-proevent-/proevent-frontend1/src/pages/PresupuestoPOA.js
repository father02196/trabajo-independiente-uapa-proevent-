// ============================================================
// COMPONENTE: PresupuestoPOA
// Pertenece a: Módulo de Solicitudes / Eventos
// Propósito: Paso del Wizard de creación de eventos donde el 
// usuario indica el presupuesto estimado, observaciones 
// adicionales, y puede adjuntar documentación (Flujo Documental).
// ============================================================

import React from "react";
import { FiDollarSign, FiFileText, FiPaperclip } from "react-icons/fi";

export default function PresupuestoPOA({ data, setData, archivo, setArchivo }) {
  return (
    <div className="space-y-6 animate-fade">
      <div>
        <h3 className="text-xl font-bold text-text-main mb-1">Presupuesto y POA</h3>
        <p className="text-sm text-text-secondary">Información financiera, observaciones generales y documentación adjunta.</p>
      </div>

      <div className="form-grid-2">
        {/* Presupuesto Estimado */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-bold text-text-main mb-2">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiDollarSign size={14} style={{ color: '#3B82F6' }} />
              Presupuesto Estimado <span className="text-danger">*</span>
            </span>
          </label>
          <div style={{ display: 'flex', gap: '0' }}>
            <select
              className="input-base"
              value={data.moneda}
              onChange={(e) => setData({ ...data, moneda: e.target.value })}
              style={{ width: '100px', borderRadius: '12px 0 0 12px', borderRight: 'none', background: '#F1F5F9', flexShrink: 0 }}
            >
              <option value="DOP">DOP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <input
              type="number"
              className="input-base"
              placeholder="0.00"
              value={data.presupuesto}
              onChange={(e) => setData({ ...data, presupuesto: e.target.value })}
              style={{ borderRadius: '0 12px 12px 0', flex: 1 }}
              required
            />
          </div>
        </div>

        {/* Observaciones */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-bold text-text-main mb-2">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiFileText size={14} style={{ color: '#3B82F6' }} />
              Observaciones / Instrucciones Especiales
            </span>
          </label>
          <textarea
            className="input-base"
            placeholder="Escribe cualquier detalle adicional importante sobre el presupuesto o requisitos especiales..."
            value={data.observaciones}
            onChange={(e) => setData({ ...data, observaciones: e.target.value })}
            style={{ minHeight: '110px', resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Flujo Documental */}
      <div className="doc-upload-card">
        <label className="block text-sm font-bold text-text-main mb-1">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiPaperclip size={14} style={{ color: '#3B82F6' }} />
            Flujo Documental Adjunto <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginLeft: '4px' }}>(Opcional)</span>
          </span>
        </label>
        <p className="text-sm text-text-secondary" style={{ marginBottom: '14px' }}>
          Adjunta la carta de justificación, cotizaciones preliminares o plan de trabajo (PDF, Word, Excel).
        </p>
        <input
          type="file"
          className="input-base"
          onChange={(e) => setArchivo && setArchivo(e.target.files[0])}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          style={{ cursor: 'pointer', background: '#fff' }}
        />
        {archivo && (
          <p style={{ marginTop: '10px', color: '#059669', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✅ Archivo seleccionado: {archivo.name}
          </p>
        )}
      </div>
    </div>
  );
}
