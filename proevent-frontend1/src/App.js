// ============================================================
// COMPONENTE: App
// Pertenece a: Raíz de la Aplicación
// Propósito: Controla el enrutamiento principal, el estado global 
// de autenticación y renderiza el Layout adecuado según el rol.
// ============================================================

import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import DashboardComprasLayout from "./pages/DashboardComprasLayout";
import DashboardLegalLayout from "./pages/DashboardLegalLayout";
import DashboardVAFLayout from "./pages/DashboardVAFLayout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PortalProveedoresLogin from "./pages/PortalProveedoresLogin";
import PortalProveedoresDashboard from "./pages/PortalProveedoresDashboard";
import PortalProveedoresForgotPassword from "./pages/PortalProveedoresForgotPassword";
import PortalProveedoresResetPassword from "./pages/PortalProveedoresResetPassword";

function App() {
  // --- ESTADOS GLOBALES ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
  const [proveedor, setProveedor] = useState(() => {
    const saved = sessionStorage.getItem("proveedor");
    return saved ? JSON.parse(saved) : null;
  });

  const [page, setPage] = useState(() => {
    const savedPage = sessionStorage.getItem("page");
    const isLogged = sessionStorage.getItem("isLoggedIn") === "true";
    const hasProveedor = sessionStorage.getItem("proveedor") !== null;

    // Si es un usuario administrativo/solicitante logueado y recarga, forzar al dashboard
    if (isLogged) {
      if (!savedPage || savedPage === "welcome" || savedPage === "login") return "dashboard";
      return savedPage;
    }
    
    // Si es un proveedor logueado y recarga, forzar al dashboard de proveedores
    if (hasProveedor) {
      if (!savedPage || savedPage === "welcome" || savedPage === "proveedores-login") return "proveedores-dashboard";
      return savedPage;
    }

    // Si no está logueado, mostrar landing page por defecto o la página guardada
    return savedPage || "welcome";
  });

  const [usuario, setUsuario] = useState(() => {
    const savedUser = sessionStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [resetToken, setResetToken] = useState(null);

  // --- EFECTOS: Sincronización con Session Storage ---
  useEffect(() => {
    sessionStorage.setItem("page", page);
  }, [page]);

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

  useEffect(() => {
    // Detectar token en la URL (ej: /reset-password/TOKEN o /proveedor/reset-password/TOKEN)
    const path = window.location.pathname;
    if (path.startsWith("/reset-password/")) {
      const token = path.split("/")[2];
      setResetToken(token);
      setPage("reset-password");
    } else if (path.startsWith("/proveedor/reset-password/")) {
      const token = path.split("/")[3];
      setResetToken(token);
      setPage("proveedores-reset-password");
    } else if (path === "/portal-proveedores") {
      if (proveedor) setPage("proveedores-dashboard");
      else setPage("proveedores-login");
    }
  }, [proveedor]);

  return (
    <div>
      {page === "reset-password" ? (
        <ResetPassword 
          token={resetToken} 
          onBackClick={() => {
            window.history.pushState({}, "", "/");
            setPage("login");
          }} 
        />
      ) : page === "login" ? (
        <Login
          onLogin={(usuarioData) => {
            setIsLoggedIn(true);
            setUsuario(usuarioData);
            // Asegurar que inicie siempre en la pantalla "Dashboard" principal
            sessionStorage.removeItem("dashboard_activeTab");
            localStorage.removeItem("dashboard_activeTab"); // por compatibilidad legacy
            setPage("dashboard");
          }}
          onBackClick={() => setPage("welcome")}
          onForgotPasswordClick={() => setPage("forgot-password")}
        />
      ) : page === "forgot-password" ? (
        <ForgotPassword 
          onBackClick={() => setPage("login")} 
        />
      ) : page === "welcome" ? (
        <Welcome
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setPage("login")}
          onLogoutClick={() => {
            setIsLoggedIn(false);
            setUsuario(null);
          }}
          onDashboardClick={() => setPage("dashboard")}
          onPortalProveedores={() => setPage("proveedores-login")}
        />
      ) : page === "proveedores-login" ? (
        <PortalProveedoresLogin 
          onLoginSuccess={(provData) => {
            setProveedor(provData);
            setPage("proveedores-dashboard");
            window.history.pushState({}, "", "/portal-proveedores");
          }}
          onBackClick={() => {
            window.history.pushState({}, "", "/");
            setPage("welcome");
          }}
          onForgotPasswordClick={() => setPage("proveedores-forgot-password")}
        />
      ) : page === "proveedores-forgot-password" ? (
        <PortalProveedoresForgotPassword 
          onBackClick={() => setPage("proveedores-login")} 
        />
      ) : page === "proveedores-reset-password" ? (
        <PortalProveedoresResetPassword 
          token={resetToken} 
          onBackClick={() => {
            window.history.pushState({}, "", "/portal-proveedores");
            setPage("proveedores-login");
          }} 
        />
      ) : page === "proveedores-dashboard" ? (
        <PortalProveedoresDashboard 
          proveedor={proveedor}
          onLogout={() => {
            setProveedor(null);
            setPage("welcome");
            window.history.pushState({}, "", "/");
          }}
        />
      ) : (
        (usuario?.rol === "Compras" || usuario?.rol === "Administrador de Compras") ? (
          <DashboardComprasLayout
            usuario={usuario}
            onLogoutClick={() => {
              setIsLoggedIn(false);
              setUsuario(null);
              setPage("welcome");
            }}
          />
        ) : (usuario?.rol === "Legal" || usuario?.rol === "Administrador de Legal" || usuario?.rol === "Administrador Legal") ? (
          <DashboardLegalLayout
            usuario={usuario}
            onLogoutClick={() => {
              setIsLoggedIn(false);
              setUsuario(null);
              setPage("welcome");
            }}
          />
        ) : (usuario?.rol === "Administrador V-A-F") ? (
          <DashboardVAFLayout
            usuario={usuario}
            onLogout={() => {
              setIsLoggedIn(false);
              setUsuario(null);
              setPage("welcome");
            }}
          />
        ) : (
          <Dashboard
            usuario={usuario}
            onLogoutClick={() => {
              setIsLoggedIn(false);
              setUsuario(null);
              setPage("welcome");
            }}
          />
        )
      )}
    </div>
  );
}

export default App;