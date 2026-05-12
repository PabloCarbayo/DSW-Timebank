import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requireAdmin = false }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Cargando...</div>;

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user && user.role !== "admin") {
    // Redirect to dashboard if not admin
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
