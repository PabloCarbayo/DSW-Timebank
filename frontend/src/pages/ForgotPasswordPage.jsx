import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/timebankApi";
import { Mail, ArrowLeft } from "lucide-react";
import "./AuthPages.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      if (res.status === 200) {
        setMessage(res.data.message || "A password reset link has been sent if the email exists.");
      } else {
        setError(res.data.detail || "Could not request password reset.");
      }
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-bg" />
      <div className="auth-card">
        <Link to="/login" className="auth-back"><ArrowLeft size={18} /> Volver al Login</Link>

        <div className="auth-header">
          <Mail size={28} className="auth-header-icon" />
          <h1 className="auth-title">Recuperar Contraseña</h1>
          <p className="auth-subtitle">Ingresa tu correo para recibir un enlace de recuperación.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="auth-input"
            />
          </label>

          {message && <p className="auth-error" style={{ color: "var(--success-color)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      </div>
    </div>
  );
}
