import { useState, useEffect, useRef } from "react";
import './../css/Login.css';
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";
import userIcon from "./../img/user.png";
import lockIcon from "./../img/lock.png";

const RIGHT_FEATURES = [
  { icon: "📋", text: "Solicita eventos institucionales fácilmente" },
  { icon: "🎥", text: "Gestiona servicios audiovisuales" },
  { icon: "📊", text: "Reportes y evaluaciones en tiempo real" },
  { icon: "🔒", text: "Acceso seguro con credenciales UAPA" },
];

function Login({ onLogin, onBackClick, onForgotPasswordClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);

  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8080/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.usuario);
      } else {
        setError(data.mensaje || "Error al iniciar sesión con Google.");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor. Verifique que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "426335318098-v39ood0lcapc22lgoq3lons62hbf507m.apps.googleusercontent.com",
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("El correo no puede estar vacío.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, contrasena: password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.usuario);
      } else {
        setError(data.mensaje || "Correo o contraseña incorrectos.");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor. Verifique que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">

        {/* ── LEFT: Form panel ── */}
        <div className="login-left">
          <div className="login-form-box">

            {/* Back to home */}
            {onBackClick && (
              <button className="login-back-link" onClick={onBackClick}>
                <span className="login-back-icon">←</span> Volver al inicio
              </button>
            )}

            {/* Brand */}
            <div className="login-brand-row">
              <div className="login-brand-icon">PE</div>
              <div>
                <p className="welcome-label">Bienvenido a</p>
                <h1 className="brand-name">Pro<span className="brand-name-highlight">Event</span></h1>
              </div>
            </div>

            <p className="brand-subtitle">
              Inicia sesión con tus credenciales institucionales para gestionar protocolos y eventos de la UAPA.
            </p>

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">Acceso Institucional</span>
              <div className="form-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <img src={userIcon} alt="usuario" className="input-icon" />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <img src={lockIcon} alt="contraseña" className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <img
                  src={showPassword ? hideIcon : viewIcon}
                  alt={showPassword ? "Ocultar" : "Ver"}
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="login-helpers">
                <button type="button" className="login-forgot" onClick={onForgotPasswordClick}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <div className="login-error">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading ? "Verificando..." : "Iniciar Sesión"}
              </button>
            </form>

            <div className="google-divider">
              <div className="google-divider-line"></div>
              <span>o continuar con</span>
              <div className="google-divider-line"></div>
            </div>

            <div ref={googleButtonRef} className="google-btn-container"></div>

            <p className="signup-text">
              ¿Necesitas acceso?&nbsp;
              <a href="#" onClick={(e) => e.preventDefault()}>
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Brand panel ── */}
        <div className="login-right">
          <div className="login-right-content">
            <div className="login-right-icon">PE</div>
            <h2 className="brand-name-right">ProEvent</h2>
            <p className="brand-desc">
              Sistema de Gestión de Protocolos y Eventos Institucionales de la Universidad APEC (UAPA).
            </p>
            <div className="login-right-features">
              {RIGHT_FEATURES.map((f) => (
                <div key={f.text} className="login-right-feature">
                  <div className="feature-bullet">{f.icon}</div>
                  <span className="feature-bullet-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;