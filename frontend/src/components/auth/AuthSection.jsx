import { useState } from "react";
import { registerUser, loginUser, logoutUser } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import ResponsePanel, { FormField } from "../common/ResponsePanel";
import { UserPlus, KeyRound, LogOut, Lock } from "lucide-react";

function RegisterForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await registerUser({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
            });
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><UserPlus size={18} /> Registrar Usuario</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="user@example.com" />
                <FormField label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mín. 6 caracteres" />
                <FormField label="Nombre" value={firstName} onChange={setFirstName} placeholder="John" />
                <FormField label="Apellido" value={lastName} onChange={setLastName} placeholder="Doe" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Registrando..." : "Registrar"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function LoginForm() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginUser({ email, password });
            setResult(res);
            if (res.status === 200 && res.data.access_token) {
                login(res.data.access_token, email);
            }
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><KeyRound size={18} /> Iniciar Sesión</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="user@example.com" />
                <FormField label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Tu contraseña" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Entrando..." : "Login"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function LogoutButton() {
    const { token, userEmail, logout: ctxLogout } = useAuth();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            const res = await logoutUser();
            setResult(res);
            ctxLogout();
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><LogOut size={18} /> Cerrar Sesión</h3>
            {token ? (
                <>
                    <p className="info-text">
                        Sesión activa como <strong>{userEmail}</strong>
                    </p>
                    <button onClick={handleLogout} disabled={loading} className="btn btn-danger">
                        {loading ? "Saliendo..." : "Logout"}
                    </button>
                </>
            ) : (
                <p className="info-text muted">No hay sesión activa</p>
            )}
            <ResponsePanel result={result} />
        </div>
    );
}

export default function AuthSection() {
    return (
        <div className="section">
            <h2 className="section-title"><Lock size={22} /> Autenticación</h2>
            <p className="section-subtitle">Backend TimeBank — <code>localhost:8000</code></p>
            <div className="cards-grid">
                <RegisterForm />
                <LoginForm />
                <LogoutButton />
            </div>
        </div>
    );
}
