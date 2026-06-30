// ============================================================
// COMPONENTE: App
// Pertenece a: Raíz de la Aplicación
// Propósito: Controla el enrutamiento principal con React Router,
// gestiona la seguridad mediante rutas protegidas y renderiza 
// el Layout adecuado (aislado) según el rol del usuario.
// ============================================================

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Componente de Seguridad
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas Públicas
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Portal Proveedores
import PortalProveedoresLogin from "./pages/PortalProveedoresLogin";
import PortalProveedoresDashboard from "./pages/PortalProveedoresDashboard";
import PortalProveedoresForgotPassword from "./pages/PortalProveedoresForgotPassword";
import PortalProveedoresResetPassword from "./pages/PortalProveedoresResetPassword";

// Layouts Exclusivos por Rol
import DashboardAdminLayout from "./pages/DashboardAdminLayout";
import DashboardSolicitanteLayout from "./pages/DashboardSolicitanteLayout";
import DashboardApoyoLayout from "./pages/DashboardApoyoLayout";
import DashboardAdminEventosLayout from "./pages/DashboardAdminEventosLayout";
import DashboardAudiovisualLayout from "./pages/DashboardAudiovisualLayout";
import DashboardResponsableLayout from "./pages/DashboardResponsableLayout";

// Layouts Tradicionales
import DashboardComprasLayout from "./pages/DashboardComprasLayout";
import DashboardLegalLayout from "./pages/DashboardLegalLayout";
import DashboardVAFLayout from "./pages/DashboardVAFLayout";

function App() {
  // --- ESTADOS GLOBALES DE AUTENTICACIÓN ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
  const [usuario, setUsuario] = useState(() => {
    const savedUser = sessionStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [proveedor, setProveedor] = useState(() => {
    const saved = sessionStorage.getItem("proveedor");
    return saved ? JSON.parse(saved) : null;
  });

  // Sincronización con Session Storage
  useEffect(() => {
    sessionStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    if (usuario) {
      sessionStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      sessionStorage.removeItem("usuario");
    }
  }, [usuario]);

  useEffect(() => {
    if (proveedor) {
      sessionStorage.setItem("proveedor", JSON.stringify(proveedor));
    } else {
      sessionStorage.removeItem("proveedor");
    }
  }, [proveedor]);

  // Manejo de Logout centralizado
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsuario(null);
    setProveedor(null);
    sessionStorage.removeItem("dashboard_activeTab"); // Limpiar estado legacy
  };

  // Función para determinar el inicio del usuario logueado según su rol
  const getDashboardPath = (rol) => {
    switch (rol) {
      case "Administrador": return "/admin";
      case "Solicitante": return "/solicitante";
      case "Personal de Apoyo": return "/apoyo";
      case "Administrador de Eventos": return "/admin-eventos";
      case "Especialista de eventos": return "/admin-eventos";
      case "Administrador de Audiovisual": return "/audiovisual";
      case "Responsable de área audiovisual": return "/audiovisual";
      case "Responsable": return "/responsable";
      case "Compras": return "/compras";
      case "Administrador de Compras": return "/compras";
      case "Legal": return "/legal";
      case "Administrador de Legal": return "/legal";
      case "Administrador Legal": return "/legal";
      case "Administrador V-A-F": return "/vaf";
      default: return "/solicitante"; // Fallback
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={
          isLoggedIn && usuario ? <Navigate to={getDashboardPath(usuario.rol)} replace /> : 
          <Welcome 
            isLoggedIn={isLoggedIn}
            onLogoutClick={handleLogout}
          />
        } />
        
        <Route path="/login" element={
          isLoggedIn && usuario ? <Navigate to={getDashboardPath(usuario.rol)} replace /> : 
          <Login 
            onLogin={(usuarioData) => {
              setIsLoggedIn(true);
              setUsuario(usuarioData);
              sessionStorage.removeItem("dashboard_activeTab");
            }}
          />
        } />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* --- RUTAS PORTAL PROVEEDORES --- */}
        <Route path="/portal-proveedores" element={
          proveedor ? <Navigate to="/portal-proveedores/dashboard" replace /> : 
          <PortalProveedoresLogin 
            onLoginSuccess={(provData) => setProveedor(provData)}
          />
        } />
        <Route path="/portal-proveedores/forgot-password" element={<PortalProveedoresForgotPassword />} />
        <Route path="/proveedor/reset-password/:token" element={<PortalProveedoresResetPassword />} />

        <Route path="/portal-proveedores/dashboard/*" element={
          proveedor ? <PortalProveedoresDashboard proveedor={proveedor} onLogout={handleLogout} /> : <Navigate to="/portal-proveedores" replace />
        } />

        {/* --- RUTAS PROTEGIDAS POR ROL (Code Splitting y Aislamiento) --- */}
        <Route path="/admin/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Administrador"]}>
            <DashboardAdminLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/solicitante/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Solicitante"]}>
            <DashboardSolicitanteLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/apoyo/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Personal de Apoyo"]}>
            <DashboardApoyoLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/admin-eventos/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Administrador de Eventos", "Especialista de eventos"]}>
            <DashboardAdminEventosLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/audiovisual/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Administrador de Audiovisual", "Responsable de área audiovisual"]}>
            <DashboardAudiovisualLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/responsable/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Responsable"]}>
            <DashboardResponsableLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        {/* Layouts Tradicionales (Legacy compat mode) */}
        <Route path="/compras/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Compras", "Administrador de Compras"]}>
            <DashboardComprasLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/legal/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Legal", "Administrador de Legal", "Administrador Legal"]}>
            <DashboardLegalLayout usuario={usuario} onLogoutClick={handleLogout} />
          </ProtectedRoute>
        } />

        <Route path="/vaf/*" element={
          <ProtectedRoute usuario={usuario} allowedRoles={["Administrador V-A-F"]}>
            <DashboardVAFLayout usuario={usuario} onLogout={handleLogout} />
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;