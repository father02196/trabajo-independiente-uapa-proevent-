// ============================================================
// COMPONENTE: Login
// Pertenece a: Módulo de Autenticación / Acceso
// Propósito: Pantalla de inicio de sesión que soporta autenticación
// mediante credenciales clásicas (correo/contraseña) y mediante 
// SSO con Google Sign-In para correos institucionales.
// ============================================================

import { useState, useEffect, useRef } from "react";
import './../css/Login.css';
import viewIcon  from "./../img/view.png";
import hideIcon  from "./../img/hide.png";
import userIcon  from "./../img/user.png";
import lockIcon  from "./../img/lock.png";
import logoProevent from "./../img/logo-proevent.jpeg";
import axios from "../api/axios"; // Usamos la instancia configurada con credentials

function Login({ onLogin, onBackClick, onForgotPasswordClick }) {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const googleButtonRef = useRef(null);

  /* ── Google Sign-In ──────────────────────────────────── */
  // Función de callback que procesa el token JWT devuelto por Google
  // y lo envía al backend para iniciar sesión sin contraseña.
  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post('/login-google', { credential: response.credential });
      if (res.data && res.data.usuario) {
        onLogin(res.data.usuario); // JWT tokens se guardan solos vía HttpOnly cookies
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const script   = document.createElement("script");
    script.src     = "https://accounts.google.com/gsi/client";
    script.async   = true;
    script.defer   = true;
    document.body.appendChild(script);
    script.onload  = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "426335318098-v39ood0lcapc22lgoq3lons62hbf507m.apps.googleusercontent.com",
          callback:  handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline", size: "large", width: "100%", text: "continue_with",
        });
      }
    };
    return () => { document.body.removeChild(script); };
  }, []); // eslint-disable-line


  /* ── Credenciales ────────────────────────────────────── */
  // Envía el correo y contraseña ingresados al backend para autenticarse
  // Retorna el token JWT del sistema propio.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email)              return setError("El correo no puede estar vacío.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");

    setLoading(true);
    try {
      const res = await axios.post('/login', { correo: email, contrasena: password });
      if (res.data && res.data.usuario) {
        onLogin(res.data.usuario); // JWT tokens se guardan solos vía HttpOnly cookies
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo conectar al servidor. Verifique que el backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  /* ── JSX ─────────────────────────────────────────────── */
  return (
    <div className="lc-bg">



      {/* Card central */}
      <div className="lc-card">

        <div className="lc-header">
          {onBackClick && (
            <button className="lc-back" onClick={onBackClick}>← Volver al inicio</button>
          )}
          
          {/* Espacio para el nuevo logo proporcionado */}
          <img src={logoProevent} alt="Logo UAPA ProEvent" className="lc-main-logo" style={{ width: '180px', height: 'auto', margin: '0 auto 10px', display: 'block' }} />
          
          <h1 className="lc-title">ProEvent</h1>
          <p className="lc-subtitle">
            Inicia sesión en tu cuenta institucional
          </p>
        </div>

        {/* Formulario */}
        <form className="lc-form" onSubmit={handleSubmit} noValidate autoComplete="off">

          {/* Campo correo */}
          <div className="lc-field">
            <label className="lc-label" htmlFor="lc-email">Correo electrónico</label>
            <div className="lc-input-wrap">
              <img src={userIcon} alt="" className="lc-input-icon" />
              <input
                id="lc-email"
                type="email"
                className="lc-input"
                placeholder="usuario@uapa.edu.do"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Campo contraseña */}
          <div className="lc-field">
            <div className="lc-label-row">
              <label className="lc-label" htmlFor="lc-password">Contraseña</label>
              <button
                type="button"
                className="lc-forgot"
                onClick={onForgotPasswordClick}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="lc-input-wrap">
              <img src={lockIcon} alt="" className="lc-input-icon" />
              <input
                id="lc-password"
                type={showPassword ? "text" : "password"}
                className="lc-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="lc-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <img
                  src={showPassword ? hideIcon : viewIcon}
                  alt=""
                  className="lc-pw-icon"
                />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="lc-error" role="alert">
              <span className="lc-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="lc-btn-primary"
            disabled={loading}
          >
            {loading
              ? <span className="lc-spinner" />
              : "Iniciar Sesión"
            }
          </button>

        </form>

        {/* Divisor */}
        <div className="lc-sep">
          <span className="lc-sep-line" />
          <span className="lc-sep-text">o continuar con</span>
          <span className="lc-sep-line" />
        </div>

        {/* Google */}
        <div ref={googleButtonRef} className="lc-google-wrap" />

        {/* Footer */}
        <p className="lc-footer-text">
          ¿Necesitas acceso?{" "}
          <a href="#!" onClick={(e) => e.preventDefault()} className="lc-footer-link">
            Contacta al administrador
          </a>
        </p>

      </div>

      {/* Marca discreta al fondo */}
      <p className="lc-watermark">UAPA · ProEvent © 2025</p>

    </div>
  );
}

export default Login;