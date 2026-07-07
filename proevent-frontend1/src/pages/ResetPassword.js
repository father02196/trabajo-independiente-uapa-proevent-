// ============================================================
// COMPONENTE: ResetPassword
// Pertenece a: Módulo de Autenticación
// Propósito: Interfaz donde el usuario introduce su nueva
// contraseña, validando el token proporcionado por la URL.
// ============================================================

import { useState, useEffect } from "react";
import './../css/Login.css';
import lockIcon from "./../img/lock.png";
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";
import logoProevent from "./../img/logo-proevent.jpeg";

function ResetPassword({ token, onBackClick }) {
  // --- ESTADOS ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);

  // --- EFECTOS INICIALES ---
  useEffect(() => {
    // --- FUNCIÓN: validateToken ---
    // Verifica si el token en la URL aún es válido antes de permitir el cambio
    const validateToken = async () => {
      try {
        const response = await fetch(`http://localhost:8080/validar-token/${token}`);
        if (!response.ok) {
          setError("El enlace de recuperación es inválido o ha expirado.");
        }
      } catch (err) {
        setError("Error al conectar con el servidor.");
      } finally {
        setValidating(false);
      }
    };
    validateToken();
  }, [token]);

  // --- FUNCIÓN: handleSubmit ---
  // Envía la nueva contraseña al backend junto con el token
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/restablecer-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContrasena: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.mensaje || "Ocurrió un error al restablecer la contraseña.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="lc-bg">
        <div className="lc-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <p className="lc-subtitle">Validando enlace de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lc-bg">
      <div className="lc-card">
        
        <div className="lc-header">
          {onBackClick && (
            <button type="button" className="lc-back" onClick={onBackClick}>← Volver al inicio</button>
          )}

          {/* Espacio para el nuevo logo proporcionado */}
          <img src={logoProevent} alt="Logo UAPA ProEvent" className="lc-main-logo" style={{ width: '220px', height: 'auto', margin: '0 auto 15px', display: 'block' }} />
          
          <p className="lc-subtitle" style={{ margin: '10px 0 5px', fontWeight: 'bold' }}>Actualización</p>
          <h1 className="lc-title">ProEvent</h1>
          <p className="lc-subtitle">
            {success 
              ? "Tu contraseña ha sido actualizada con éxito." 
              : "Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta."}
          </p>
        </div>

        {!success && (
          <form className="lc-form" onSubmit={handleSubmit}>
            <div className="lc-field">
              <div className="lc-input-wrap">
                <img src={lockIcon} alt="contraseña" className="lc-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="lc-input"
                  placeholder="Nueva Contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <img
                  src={showPassword ? hideIcon : viewIcon}
                  alt={showPassword ? "Ocultar" : "Ver"}
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', width: '20px' }}
                />
              </div>
            </div>

            <div className="lc-field">
              <div className="lc-input-wrap">
                <img src={lockIcon} alt="confirmar contraseña" className="lc-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="lc-input"
                  placeholder="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <span className="lc-spinner" /> : "Actualizar Contraseña"}
            </button>
          </form>
        )}

        {success && (
          <div className="lc-form">
            <button type="button" className="lc-btn-primary" onClick={onBackClick}>
              Ir al Inicio
            </button>
          </div>
        )}

      </div>
      <p className="lc-watermark">UAPA · ProEvent © 2025</p>
    </div>
  );
}

export default ResetPassword;
