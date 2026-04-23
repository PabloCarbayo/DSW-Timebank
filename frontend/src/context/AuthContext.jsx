import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || null);

    const login = (jwt, email) => {
        setToken(jwt);
        setUserEmail(email);
        localStorage.setItem("token", jwt);
        localStorage.setItem("userEmail", email);
    };

    const logout = () => {
        setToken(null);
        setUserEmail(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
    };

    return (
        <AuthContext.Provider value={{ token, userEmail, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
}
