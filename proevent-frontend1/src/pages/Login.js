import { useState, useEffect, useRef } from "react";
import './../css/Login.css';
import viewIcon  from "./../img/view.png";
import hideIcon  from "./../img/hide.png";
import userIcon  from "./../img/user.png";
import lockIcon  from "./../img/lock.png";

function Login({ onLogin, onBackClick, onForgotPasswordClick }) {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const googleButtonRef = useRef(null);

  /* ΓöÇΓöÇ Google Sign-In ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const handleGoogleCallback = async (response) => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("http://localhost:8080/login-google", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ ...data.usuario, token: data.token });
      } else {
        setError(data.mensaje || "Error al iniciar sesi├│n con Google.");
      }
    } catch {
      setError("No se pudo conectar al servidor.");
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

  /* ΓöÇΓöÇ Credenciales ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email)              return setError("El correo no puede estar vac├¡o.");
    if (password.length < 6) return setError("La contrase├▒a debe tener al menos 6 caracteres.");

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:8080/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ correo: email, contrasena: password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin({ ...data.usuario, token: data.token });
      } else {
        setError(data.mensaje || "Correo o contrase├▒a incorrectos.");
      }
    } catch {
      setError("No se pudo conectar al servidor. Verifique que el backend est├⌐ activo.");
    } finally {
      setLoading(false);
    }
  };

  /* ΓöÇΓöÇ JSX ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
  return (
    <div className="lc-bg">

      {/* Bot├│n volver flotante */}
      {onBackClick && (
        <button className="lc-back" onClick={onBackClick}>
          ΓåÉ Volver al inicio
        </button>
      )}

      {/* Card central */}
      <div className="lc-card">

        {/* Header de la card */}
        <div className="lc-header">
          <div className="lc-logo-badge">PE</div>
          <h1 className="lc-title">ProEvent</h1>
          <p className="lc-subtitle">
            Inicia sesi├│n en tu cuenta institucional
          </p>
        </div>

        {/* Formulario */}
        <form className="lc-form" onSubmit={handleSubmit} noValidate>

          {/* Campo correo */}
          <div className="lc-field">
            <label className="lc-label" htmlFor="lc-email">Correo electr├│nico</label>
            <div className="lc-input-wrap">
              <img src={userIcon} alt="" className="lc-input-icon" />
              <input
                id="lc-email"
                type="email"
                className="lc-input"
                placeholder="usuario@uapa.edu.do"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Campo contrase├▒a */}
          <div className="lc-field">
            <div className="lc-label-row">
              <label className="lc-label" htmlFor="lc-password">Contrase├▒a</label>
              <button
                type="button"
                className="lc-forgot"
                onClick={onForgotPasswordClick}
              >
                ┬┐Olvidaste tu contrase├▒a?
              </button>
            </div>
            <div className="lc-input-wrap">
              <img src={lockIcon} alt="" className="lc-input-icon" />
              <input
                id="lc-password"
                type={showPassword ? "text" : "password"}
                className="lc-input"
                placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lc-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contrase├▒a" : "Mostrar contrase├▒a"}
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
              <span className="lc-error-icon">ΓÜá</span>
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
              : "Iniciar Sesi├│n"
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
          ┬┐Necesitas acceso?{" "}
          <a href="#!" onClick={(e) => e.preventDefault()} className="lc-footer-link">
            Contacta al administrador
          </a>
        </p>

      </div>

      {/* Marca discreta al fondo */}
      <p className="lc-watermark">UAPA ┬╖ ProEvent ┬⌐ 2025</p>

    </div>
  );
}

export default Login;
