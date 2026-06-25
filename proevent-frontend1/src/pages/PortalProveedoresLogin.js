// ============================================================
// COMPONENTE: PortalProveedoresLogin
// Pertenece a: Módulo de Proveedores (B2B)
// Propósito: Vista de inicio de sesión exclusiva para proveedores.
// Permite autenticarse enviando las credenciales al backend y
// manejando el estado de error o carga.
// ============================================================

import React, { useState } from 'react';
import './../css/Login.css';
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";
import userIcon from "./../img/user.png";
import lockIcon from "./../img/lock.png";
import logoProevent from "./../img/logo-proevent.jpeg";

function PortalProveedoresLogin({ onLoginSuccess, onBackClick, onForgotPasswordClick }) {
  // --- ESTADOS ---
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
    <div className="lc-bg">

      {/* Card central */}
      <div className="lc-card">

        {/* Header de la card */}
        <div className="lc-header">
          {onBackClick && (
            <button className="lc-back" onClick={onBackClick}>← Volver al inicio</button>
          )}
          {/* Espacio para el nuevo logo proporcionado */}
          <img src={logoProevent} alt="Logo UAPA ProEvent" className="lc-main-logo" style={{ width: '220px', height: 'auto', margin: '0 auto 15px', display: 'block' }} />
          <h1 className="lc-title">Portal de Suplidores</h1>
          <p className="lc-subtitle">
            Acceso para licitación automatizada UAPA
          </p>
        </div>

        {/* Formulario */}
        <form className="lc-form" onSubmit={handleSubmit} noValidate>

          {/* Campo correo */}
          <div className="lc-field">
            <label className="lc-label" htmlFor="b2b-email">Correo de la Empresa</label>
            <div className="lc-input-wrap">
              <img src={userIcon} alt="" className="lc-input-icon" />
              <input
                id="b2b-email"
                type="email"
                className="lc-input"
                placeholder="contacto@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Campo contraseña */}
          <div className="lc-field">
            <div className="lc-label-row">
              <label className="lc-label" htmlFor="b2b-password">Contraseña</label>
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
                id="b2b-password"
                type={showPassword ? "text" : "password"}
                className="lc-input"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
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
              <span className="lc-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="lc-btn-primary"
            disabled={loading}
          >
            {loading
              ? <span className="lc-spinner" />
              : "Acceder al Portal Seguro"
            }
          </button>

        </form>

        {/* Divisor */}
        <div className="lc-sep">
          <span className="lc-sep-line" />
          <span className="lc-sep-text">¿Aún no eres proveedor?</span>
          <span className="lc-sep-line" />
        </div>

        {/* Footer */}
        <p className="lc-footer-text" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          <a href="#!" onClick={(e) => e.preventDefault()} className="lc-footer-link">
            Contacta al departamento de compras
          </a>
        </p>

      </div>

      {/* Marca discreta al fondo */}
      <p className="lc-watermark">Portal de Suplidores - ProEvent © 2025</p>

    </div>
  );
}

export default PortalProveedoresLogin;
