import { useState } from "react";
import './../css/Login.css';
import userIcon from "./../img/user.png";
import lockIcon from "./../img/lock.png";
import viewIcon from "./../img/view.png";
import hideIcon from "./../img/hide.png";

function ForgotPassword({ onBackClick }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Por favor, ingrese su correo.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/solicitar-restablecimiento", {
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
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-form-box">
            
            <button className="login-back-link" onClick={onBackClick}>
              <span className="login-back-icon">←</span> Volver al login
            </button>

            <div className="login-brand-row">
              <div className="login-brand-icon">PE</div>
              <div>
                <p className="welcome-label">Seguridad</p>
                <h1 className="brand-name">Pro<span className="brand-name-highlight">Event</span></h1>
              </div>
            </div>

            <p className="brand-subtitle">
              {success 
                ? "Se ha enviado un enlace de recuperación a su correo electrónico. Por favor, revise su bandeja de entrada."
                : "Ingresa tu correo institucional para recibir un enlace de recuperación."}
            </p>

            {!success && (
              <form onSubmit={handleVerifyEmail}>
                <div className="input-group">
                  <img src={userIcon} alt="usuario" className="input-icon" />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="login-error">
                    <span>⚠️</span>
                    {error}
                  </div>
                )}

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? "Procesando..." : "Enviar Enlace"}
                </button>
              </form>
            )}

            {success && (
              <button className="signin-btn" onClick={onBackClick}>
                Regresar al Inicio
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
