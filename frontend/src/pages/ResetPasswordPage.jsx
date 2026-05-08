import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../api/timebankApi";
import { KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./AuthPages.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No reset token found in the URL. Please request a new link.");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Invalid or missing token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, new_password: newPassword });
      if (res.status === 200) {
        setMessage("Contraseña actualizada exitosamente. Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(res.data.detail || "Error al actualizar la contraseña.");
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
          <KeyRound size={28} className="auth-header-icon" />
          <h1 className="auth-title">Nueva Contraseña</h1>
          <p className="auth-subtitle">Ingresa tu nueva contraseña para acceder.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Nueva Contraseña
            <div className="auth-input-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                required
                className="auth-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="auth-label">
            Confirmar Contraseña
            <div className="auth-input-wrap">
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma la contraseña"
                required
                className="auth-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {message && <p className="auth-error" style={{ color: "var(--success-color)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>{message}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading || !token} className="auth-submit">
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
