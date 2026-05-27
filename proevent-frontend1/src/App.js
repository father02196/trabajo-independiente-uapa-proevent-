import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PortalProveedoresLogin from "./pages/PortalProveedoresLogin";
import PortalProveedoresDashboard from "./pages/PortalProveedoresDashboard";

function App() {
  const [page, setPage] = useState(() => {
    return localStorage.getItem("page") || "welcome";
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [usuario, setUsuario] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [resetToken, setResetToken] = useState(null);
  
  // Estado para proveedor
  const [proveedor, setProveedor] = useState(() => {
    const saved = localStorage.getItem("proveedor");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("page", page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      localStorage.removeItem("usuario");
    }
  }, [usuario]);

  useEffect(() => {
    if (proveedor) {
      localStorage.setItem("proveedor", JSON.stringify(proveedor));
    } else {
      localStorage.removeItem("proveedor");
    }
  }, [proveedor]);

  useEffect(() => {
    // Detectar token en la URL (ej: /reset-password/TOKEN)
    const path = window.location.pathname;
    if (path.startsWith("/reset-password/")) {
      const token = path.split("/")[2];
      setResetToken(token);
      setPage("reset-password");
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
        <Dashboard
          usuario={usuario}
          onLogoutClick={() => {
            setIsLoggedIn(false);
            setUsuario(null);
            setPage("welcome");
          }}
        />
      )}
    </div>
  );
}

export default App;