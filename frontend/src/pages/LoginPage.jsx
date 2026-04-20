import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/timebankApi";
import { useAuth } from "../context/AuthContext";
import { KeyRound, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./AuthPages.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.status === 200 && res.data.access_token) {
        login(res.data.access_token, email);
        navigate("/dashboard");
      } else {
        setError(res.data.detail || res.data.error || "Credenciales incorrectas");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-bg" />
      <div className="auth-card">
        <Link to="/" className="auth-back"><ArrowLeft size={18} /> Volver</Link>

        <div className="auth-header">
          <KeyRound size={28} className="auth-header-icon" />
          <h1 className="auth-title">Iniciar sesión</h1>
          <p className="auth-subtitle">Bienvenido de vuelta a <em>TimeBank</em></p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="auth-input"
            />
          </label>

          <label className="auth-label">
            Password
            <div className="auth-input-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="auth-input"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
