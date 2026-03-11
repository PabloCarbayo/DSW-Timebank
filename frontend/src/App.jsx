import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthSection from "./components/auth/AuthSection";
import ProfileSection from "./components/users/ProfileSection";
import CardsSection from "./components/cards/CardsSection";
import { Lock, User, CreditCard, Hourglass } from "lucide-react";
import "./App.css";

const TABS = [
  { id: "auth", label: "Autenticación", icon: Lock },
  { id: "profile", label: "Perfil", icon: User },
  { id: "cards", label: "Pagos", icon: CreditCard },
];

function AuthStatus() {
  const { token, userEmail } = useAuth();
  return (
    <div className={`auth-status ${token ? "logged-in" : ""}`}>
      <div className="status-dot" />
      <span>{token ? userEmail : "No autenticado"}</span>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState("auth");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="logo"><Hourglass size={22} /> TimeBank</h1>
          <p className="logo-subtitle">API Testing Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon"><tab.icon size={18} /></span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <AuthStatus />
        </div>
      </aside>
      <main className="main-content">
        {activeTab === "auth" && <AuthSection />}
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "cards" && <CardsSection />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
