import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/timebankApi";
import { UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./AuthPages.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await registerUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      if (res.status === 201 || res.status === 200) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(res.data.detail || res.data.error || "Error al registrar");
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
          <UserPlus size={28} className="auth-header-icon" />
          <h1 className="auth-title">Crear cuenta</h1>
          <p className="auth-subtitle">Únete a <em>TimeBank</em> — tu tiempo vale</p>
        </div>

        {success ? (
          <div className="auth-success">
            <p>¡Cuenta creada! Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-row">
              <label className="auth-label">
                Nombre
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Carlos"
                  required
                  className="auth-input"
                />
              </label>
              <label className="auth-label">
                Apellido
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ruiz"
                  required
                  className="auth-input"
                />
              </label>
            </div>

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
              Contraseña
              <div className="auth-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  required
                  minLength={6}
                  className="auth-input"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
