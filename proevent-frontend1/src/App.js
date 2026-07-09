// ============================================================
// COMPONENTE: App
// Pertenece a: Raíz de la Aplicación
// Propósito: Controla el enrutamiento principal con React Router,
// gestiona la seguridad mediante rutas protegidas y renderiza 
// el Layout adecuado (aislado) según el rol del usuario.
// ============================================================

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "./api/axios"; // Nuestra instancia global

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


// LoginWrapper: usa useNavigate() que solo funciona dentro del árbol de BrowserRouter.
// Este componente siempre se renderiza dentro de <Routes> que a su vez está dentro de <BrowserRouter>.
function LoginWrapper({ onLogin }) {
  const navigate = useNavigate();
  return (
    <Login
      onLogin={onLogin}
      onBackClick={() => navigate('/')}
      onForgotPasswordClick={() => navigate('/forgot-password')}
    />
  );
}

// PortalProveedoresLoginWrapper: mismo patrón para el portal de suplidores
function PortalProveedoresLoginWrapper({ onLoginSuccess }) {
  const navigate = useNavigate();
  return (
    <PortalProveedoresLogin
      onLoginSuccess={onLoginSuccess}
      onBackClick={() => navigate('/')}
      onForgotPasswordClick={() => navigate('/portal-proveedores/forgot-password')}
    />
  );
}

function ForgotWrapper() {
  const navigate = useNavigate();
  return <ForgotPassword onBackClick={() => navigate('/')} />;
}

function ResetWrapper() {
  const navigate = useNavigate();
  const { token } = useParams();
  return <ResetPassword token={token} onBackClick={() => navigate('/')} />;
}

function PortalProveedoresForgotWrapper() {
  const navigate = useNavigate();
  return <PortalProveedoresForgotPassword onBackClick={() => navigate('/portal-proveedores')} />;
}

function PortalProveedoresResetWrapper() {
  const navigate = useNavigate();
  const { token } = useParams();
  return <PortalProveedoresResetPassword token={token} onBackClick={() => navigate('/portal-proveedores')} />;
}


function App() {
  // --- ESTADOS GLOBALES DE AUTENTICACIÓN ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Evita parpadeos mientras valida
  
  const [proveedor, setProveedor] = useState(() => {
    const saved = sessionStorage.getItem("proveedor");
    return saved ? JSON.parse(saved) : null;
  });

  // Validar sesión con JWT (HttpOnly Cookie) al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data.usuario) {
          setIsLoggedIn(true);
          setUsuario(response.data.usuario);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUsuario(null);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Sincronización legacy de proveedor (fuera del alcance JWT por ahora)
  useEffect(() => {
    if (proveedor) {
      sessionStorage.setItem("proveedor", JSON.stringify(proveedor));
    } else {
      sessionStorage.removeItem("proveedor");
    }
  }, [proveedor]);

  // Manejo de Logout centralizado
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
    setIsLoggedIn(false);
    setUsuario(null);
    setProveedor(null);
    sessionStorage.removeItem("dashboard_activeTab"); // Limpiar estado legacy
  };

  // Escuchar eventos de deslogueo forzado (ej. Token expirado en Axios)
  useEffect(() => {
    const forcedLogout = () => handleLogout();
    window.addEventListener('auth:logout', forcedLogout);
    return () => window.removeEventListener('auth:logout', forcedLogout);
  }, []);

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

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <p>Verificando sesión segura...</p>
      </div>
    );
  }

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
          <LoginWrapper
            onLogin={(usuarioData) => {
              setIsLoggedIn(true);
              setUsuario(usuarioData);
              sessionStorage.removeItem("dashboard_activeTab");
            }}
          />
        } />

        <Route path="/forgot-password" element={<ForgotWrapper />} />
        <Route path="/reset-password/:token" element={<ResetWrapper />} />

        {/* --- RUTAS PORTAL PROVEEDORES --- */}
        <Route path="/portal-proveedores" element={
          proveedor ? <Navigate to="/portal-proveedores/dashboard" replace /> : 
          <PortalProveedoresLoginWrapper
            onLoginSuccess={(provData) => setProveedor(provData)}
          />
        } />
        <Route path="/portal-proveedores/forgot-password" element={<PortalProveedoresForgotWrapper />} />
        <Route path="/proveedor/reset-password/:token" element={<PortalProveedoresResetWrapper />} />

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