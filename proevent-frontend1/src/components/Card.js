// ============================================================
// COMPONENTE: Card
// Pertenece a: Componentes Genéricos (UI)
// Propósito: Contenedor reutilizable con estilos de tarjeta (sombras, bordes).
// ============================================================

export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[#e2e8f0] ${className}`}>
      {children}
    </div>
  );
}
