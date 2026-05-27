import React, { useState } from 'react';
import './../css/Login.css';
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";
import userIcon from "./../img/user.png";
import lockIcon from "./../img/lock.png";

const RIGHT_FEATURES = [
  { icon: "📄", text: "Subida digital de cotizaciones PDF" },
  { icon: "💰", text: "Proceso de licitación transparente" },
  { icon: "🤖", text: "Análisis inteligente con IA" },
  { icon: "🔒", text: "Plataforma segura B2B" },
];

function PortalProveedoresLogin({ onLoginSuccess, onBackClick }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!correo) return setError("El correo no puede estar vacío.");
    if (!contrasena) return setError("La contraseña es obligatoria.");

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/proveedor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      const data = await res.json();
      
      if (res.ok) {
        onLoginSuccess(data.proveedor);
      } else {
        setError(data.error || "Credenciales inválidas.");
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
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
              <div className="login-brand-icon" style={{backgroundColor: '#2c3e50', color: 'white'}}>B2B</div>
              <div>
                <p className="welcome-label">Bienvenido al</p>
                <h1 className="brand-name">Portal de <span className="brand-name-highlight">Proveedores</span></h1>
              </div>
            </div>

            <p className="brand-subtitle">
              Inicia sesión con las credenciales que la UAPA te envió por correo para someter tus cotizaciones.
            </p>

            <div className="form-divider">
              <div className="form-divider-line" />
              <span className="form-divider-text">Acceso de Suplidor</span>
              <div className="form-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <img src={userIcon} alt="usuario" className="input-icon" />
                <input
                  type="email"
                  placeholder="Correo de la Empresa"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <img src={lockIcon} alt="contraseña" className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña B2B"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  autoComplete="current-password"
                />
                <img
                  src={showPassword ? hideIcon : viewIcon}
                  alt={showPassword ? "Ocultar" : "Ver"}
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              {error && (
                <div className="login-error">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" className="signin-btn" disabled={loading} style={{marginTop: '20px'}}>
                {loading ? "Verificando..." : "Acceder al Portal"}
              </button>
            </form>

            <p className="signup-text" style={{marginTop: '20px'}}>
              ¿Aún no eres proveedor?&nbsp;
              <a href="#" onClick={(e) => e.preventDefault()}>
                Contacta al depto. de compras
              </a>
            </p>
          </div>
        </div>

        {/* ── RIGHT: Brand panel ── */}
        <div className="login-right">
          <div className="login-right-content">
            <div className="login-right-icon" style={{backgroundColor: '#8e44ad', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px', marginBottom: '20px'}}>B2B</div>
            <h2 className="brand-name-right">Red de Suplidores</h2>
            <p className="brand-desc">
              Sistema B2B para la licitación inteligente y automatizada de los proveedores externos de la UAPA.
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

export default PortalProveedoresLogin;
