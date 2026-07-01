import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Componente Wrapper para proteger rutas según autenticación y roles.
 * @param {Object} props.usuario - Objeto usuario actual (puede ser null).
 * @param {Array} props.allowedRoles - Arreglo de roles permitidos (ej. ["Administrador", "Compras"]). Si se pasa "*" permite cualquiera logueado.
 * @param {React.ReactNode} props.children - Los componentes a renderizar si el usuario tiene acceso.
 * @param {string} props.redirectPath - Ruta a redireccionar si falla la validación.
 */
const ProtectedRoute = ({ usuario, allowedRoles, children, redirectPath = "/login" }) => {
  // 1. Validar si está logueado
  if (!usuario) {
    return <Navigate to={redirectPath} replace />;
  }

  // 2. Validar rol específico
  if (allowedRoles && !allowedRoles.includes("*") && !allowedRoles.includes(usuario.rol)) {
    // Si el usuario está logueado pero no tiene el rol correcto, enviarlo a Welcome
    return <Navigate to="/" replace />;
  }

  // 3. Todo correcto, renderizar el componente protegido
  return children;
};

export default ProtectedRoute;
