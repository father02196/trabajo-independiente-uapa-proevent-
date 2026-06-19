// ============================================================
// COMPONENTE: StatCard
// Pertenece a: Componentes Genéricos (UI)
// Propósito: Tarjeta de estadísticas para dashboards. Muestra un 
// título, un valor numérico/texto y un icono de forma estandarizada.
// ============================================================

import React from 'react';

export default function StatCard({ title, value, icon: Icon, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 flex items-center gap-3 ${className}`}>
      {Icon && <Icon className="text-2xl text-primary" />}
      <div className="flex-1">
        <p className="text-sm text-text-secondary mb-1">{title}</p>
        <p className="text-2xl font-bold text-text-main">{value}</p>
      </div>
    </div>
  );
}
