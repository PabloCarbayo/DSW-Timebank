import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileSection from "../components/users/ProfileSection";
import CardsSection from "../components/cards/CardsSection";
import AdminSection from "../components/admin/AdminSection";
import MarketplaceSection from "../components/marketplace/MarketplaceSection";
import { MyServicesSection } from "../components/services/MyServicesSection";
import { User, CreditCard, Hourglass, Users, Search, Briefcase, Navigation } from "lucide-react";

const TABS = [
  { id: "marketplace", label: "Explore", icon: Search },
  { id: "myservices", label: "My Services", icon: Briefcase },
  { id: "profile", label: "My Profile", icon: User },
  { id: "cards", label: "Payments Pagos y Billetera Wallet", icon: CreditCard },
  { id: "admin", label: "Administration", icon: Users },
];

function AuthStatus() {
  const { token, userEmail, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!token) {
    return (
      <div className="auth-status-container">
        <div className="auth-status" style={{justifyContent: 'center'}}>
          <span>Guest</span>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{width: '100%', marginTop: '10px'}}>
           Login
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="auth-status-container">
      <div className="auth-status logged-in">
        <div className="status-dot" />
        <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem'}}>{userEmail}</span>
      </div>
      <button className="auth-logout-btn" onClick={handleLogout} title="Logout">
         <Navigation size={14} style={{transform: "rotate(90deg)"}} /> Logout
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("marketplace");

  return (
    <div className="app fade-in">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => window.location.href = '/'}>
          <h1 className="logo"><Hourglass size={22} /> TimeBank</h1>
          <p className="logo-subtitle">Services Community</p>
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
        {activeTab === "marketplace" && <MarketplaceSection />}
        {activeTab === "myservices" && <MyServicesSection />}
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "cards" && <CardsSection />}
        {activeTab === "admin" && <AdminSection />}
      </main>
    </div>
  );
}
