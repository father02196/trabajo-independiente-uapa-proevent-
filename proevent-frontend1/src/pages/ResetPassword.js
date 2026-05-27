import { useState, useEffect } from "react";
import './../css/Login.css';
import lockIcon from "./../img/lock.png";
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";

function ResetPassword({ token, onBackClick }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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
      <div className="login-page">
        <div className="login-wrapper">
          <div className="login-left">
            <p className="brand-subtitle">Validando enlace de seguridad...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-form-box">
            <div className="login-brand-row">
              <div className="login-brand-icon">PE</div>
              <div>
                <p className="welcome-label">Actualización</p>
                <h1 className="brand-name">Pro<span className="brand-name-highlight">Event</span></h1>
              </div>
            </div>

            <p className="brand-subtitle">
              {success 
                ? "Tu contraseña ha sido actualizada con éxito." 
                : "Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta."}
            </p>

            {error && !success && (
              <div className="login-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {!success && !error && (
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <img src={lockIcon} alt="contraseña" className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva Contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <img
                    src={showPassword ? hideIcon : viewIcon}
                    alt={showPassword ? "Ocultar" : "Ver"}
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>

                <div className="input-group">
                  <img src={lockIcon} alt="confirmar contraseña" className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmar Contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? "Procesando..." : "Actualizar Contraseña"}
                </button>
              </form>
            )}

            {(success || error) && (
              <button className="signin-btn" onClick={onBackClick}>
                Ir al Inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
