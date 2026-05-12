import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "../api/timebankApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            if (token) {
                try {
                    const res = await getProfile(token);
                    if (res.status === 200) {
                        setUser(res.data);
                        setUserEmail(res.data.email);
                    } else {
                        logout();
                    }
                } catch (e) {
                    console.error("Error fetching user profile", e);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        }
        fetchUser();
    }, [token]);

    const login = (jwt, email) => {
        setToken(jwt);
        setUserEmail(email);
        localStorage.setItem("token", jwt);
        localStorage.setItem("userEmail", email);
    };

    const logout = () => {
        setToken(null);
        setUserEmail(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
    };

    return (
        <AuthContext.Provider value={{ token, userEmail, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
}
