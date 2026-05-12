import { createContext, useContext, useState, useEffect } from "react";
import { getProfile, logoutUser } from "../api/timebankApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await getProfile();
                if (res.status === 200) {
                    setUser(res.data);
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error("Error fetching user profile", e);
                setUser(null);
            }
            setLoading(false);
        }
        fetchUser();
    }, []);

    const login = async () => {
        try {
            const res = await getProfile();
            if (res.status === 200) {
                setUser(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch profile after login", e);
        }
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token: !!user, userEmail: user?.email, user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be inside AuthProvider");
    return ctx;
}
