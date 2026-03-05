import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [userEmail, setUserEmail] = useState(null);

    const login = (jwt, email) => {
        setToken(jwt);
        setUserEmail(email);
    };

    const logout = () => {
        setToken(null);
        setUserEmail(null);
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
