// ============================================================
// COMPONENTE: PortalProveedoresForgotPassword
// Pertenece a: Módulo de Proveedores (B2B)
// Propósito: Interfaz para que el proveedor solicite un enlace de 
// restablecimiento de contraseña enviando su correo electrónico.
// ============================================================

import { useState } from "react";
import './../css/Login.css';
import userIcon from "./../img/user.png";
import logoProevent from "./../img/logo-proevent.jpeg";

function PortalProveedoresForgotPassword({ onBackClick }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Por favor, ingrese el correo de la empresa.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/proveedor/solicitar-restablecimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.mensaje || "Error al verificar el correo.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lc-bg">
      <div className="lc-card">

        <div className="lc-header">
          {onBackClick && (
            <button type="button" className="lc-back" onClick={onBackClick}>← Volver al login</button>
          )}

          <img src={logoProevent} alt="Logo UAPA ProEvent" className="lc-main-logo" style={{ width: '220px', height: 'auto', margin: '0 auto 15px', display: 'block' }} />

          <p className="lc-subtitle">
            {success
              ? "Se ha enviado un enlace de recuperación a su correo."
              : "Ingrese el correo de la empresa para recibir el enlace de restablecimiento."}
          </p>
        </div>

        {!success ? (
          <form className="lc-form" onSubmit={handleVerifyEmail}>
            <div className="lc-field">
              <label className="lc-label" htmlFor="fp-email">Correo de la Empresa</label>
              <div className="lc-input-wrap">
                <img src={userIcon} alt="usuario" className="lc-input-icon" />
                <input
                  id="fp-email"
                  type="email"
                  className="lc-input"
                  placeholder="contacto@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="lc-error" role="alert">
                <span className="lc-error-icon">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="lc-btn-primary" disabled={loading}>
              {loading ? <span className="lc-spinner" /> : "Enviar Enlace"}
            </button>
          </form>
        ) : (
          <div className="lc-form">
            <div className="lc-success-msg" style={{ textAlign: 'center', marginBottom: '20px', color: '#10b981' }}>
              Por favor, revisa la bandeja de entrada o la carpeta de spam para encontrar el enlace de recuperación.
            </div>
            <button type="button" className="lc-btn-primary" onClick={onBackClick}>
              Regresar al Inicio
            </button>
          </div>
        )}

      </div>
      <p className="lc-watermark">Portal de Suplidores - ProEvent © 2025</p>
    </div>
  );
}

export default PortalProveedoresForgotPassword;
