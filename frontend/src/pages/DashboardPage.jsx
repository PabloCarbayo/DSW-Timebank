import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getBalance, getProfile, updateProfile } from "../api/timebankApi";
import CardsSection from "../components/cards/CardsSection";
import AdminSection from "../components/admin/AdminSection";
import MarketplaceSection from "../components/marketplace/MarketplaceSection";
import { MyServicesSection } from "../components/services/MyServicesSection";
import RequestsSection from "../components/requests/RequestsSection";
import ProfileSection from "../components/users/ProfileSection";
import {
  Briefcase,
  ChevronDown,
  CreditCard,
  Hourglass,
  Inbox,
  LogOut,
  Pencil,
  Search,
  User,
  Users,
  X,
} from "lucide-react";

const TABS = [
  { id: "marketplace", label: "Explore", icon: Search },
  { id: "myservices", label: "My Services", icon: Briefcase },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "cards", label: "Payments & Wallet", icon: CreditCard },
  { id: "profile", label: "Profile", icon: User },
  { id: "admin", label: "Administration", icon: Users },
];

export default function DashboardPage() {
  const { token, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("marketplace");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [initialProfile, setInitialProfile] = useState({ first_name: "", last_name: "", email: "" });
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", email: "", password: "" });

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!token) {
      setBalance(0);
      return;
    }

    setBalanceLoading(true);
    try {
      const res = await getBalance(token);
      if (res.status === 200) {
        setBalance(res.data.balance || 0);
      }
    } finally {
      setBalanceLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance, activeTab]);

  const fillProfileForm = (profile) => {
    const next = {
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || userEmail || "",
      password: "",
    };

    setInitialProfile({ first_name: next.first_name, last_name: next.last_name, email: next.email });
    setProfileForm(next);
  };

  const openProfileEditor = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setMenuOpen(false);
    setProfileOpen(true);
    setShowPasswordField(false);
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const res = await getProfile(token);
      if (res.status === 200) {
        fillProfileForm(res.data || {});
      } else {
        setProfileError(res.data?.detail || "Unable to load profile data.");
        fillProfileForm({ email: userEmail || "" });
      }
    } catch (err) {
      setProfileError("Connection error while loading profile.");
      fillProfileForm({ email: userEmail || "" });
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileEditor = () => {
    setProfileOpen(false);
    setShowPasswordField(false);
    setProfileError("");
    setProfileSuccess("");
  };

  const handleProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!token) {
      setProfileError("You need to log in first.");
      return;
    }

    const payload = {};
    const nextFirst = profileForm.first_name.trim();
    const nextLast = profileForm.last_name.trim();

    if (nextFirst !== initialProfile.first_name) payload.first_name = nextFirst;
    if (nextLast !== initialProfile.last_name) payload.last_name = nextLast;
    if (showPasswordField && profileForm.password.trim()) {
      if (profileForm.password.trim().length < 6) {
        setProfileError("Password must have at least 6 characters.");
        return;
      }
      payload.password = profileForm.password.trim();
    }

    if (Object.keys(payload).length === 0) {
      setProfileError("");
      setProfileSuccess("No changes to save.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");

    try {
      const res = await updateProfile(token, payload);
      if (res.status === 200) {
        setInitialProfile((prev) => ({ ...prev, first_name: nextFirst, last_name: nextLast }));
        setProfileForm((prev) => ({ ...prev, first_name: nextFirst, last_name: nextLast, password: "" }));
        setShowPasswordField(false);
        setProfileSuccess("Profile updated successfully.");
      } else {
        setProfileError(res.data?.detail || "Error updating profile.");
      }
    } catch (err) {
      setProfileError("Connection error while updating profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileOpen(false);
    navigate("/");
  };

  return (
    <div className="app dashboard-shell fade-in">
      <header className="floating-header">
        <div className="liquid-header">
          <button className="brand-mark" onClick={() => setActiveTab("marketplace")}> 
            <Hourglass size={18} className="hourglass-icon" />
            <span className="brand-copy">
              <strong>TimeBank</strong>
              <small>Services Community</small>
            </span>
          </button>

          <nav className="header-nav" aria-label="Main navigation">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`header-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="header-user-wrap" ref={menuRef}>
            {token ? (
              <>
                <button className="user-trigger" onClick={() => setMenuOpen((prev) => !prev)}>
                  <div className="status-dot" />
                  <span className="user-balance">{balanceLoading ? "..." : `${Number(balance).toFixed(2)} TB`}</span>
                  <span className="user-trigger-email">{userEmail}</span>
                  <ChevronDown size={14} className={menuOpen ? "open" : ""} />
                </button>

                {menuOpen && (
                  <div className="user-dropdown">
                    <button className="user-menu-item" onClick={openProfileEditor}>
                      <Pencil size={14} /> Edit Profile
                    </button>
                    <button className="user-menu-item danger" onClick={handleLogout}>
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button className="header-login-btn" onClick={() => navigate("/login")}>Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content floating-main">
        {activeTab === "marketplace" && <MarketplaceSection />}
        {activeTab === "myservices" && <MyServicesSection />}
        {activeTab === "requests" && <RequestsSection onBalanceChange={refreshBalance} />}
        {activeTab === "cards" && <CardsSection onBalanceChange={refreshBalance} />}
        {activeTab === "profile" && <ProfileSection onBalanceChange={refreshBalance} />}
        {activeTab === "admin" && <AdminSection />}
      </main>

      {profileOpen && (
        <div className="profile-editor-overlay" onClick={closeProfileEditor}>
          <div className="profile-editor-card" onClick={(event) => event.stopPropagation()}>
            <button className="profile-editor-close" onClick={closeProfileEditor}>
              <X size={18} />
            </button>

            <div className="profile-editor-avatar">
              <User size={22} />
            </div>

            <h3 className="profile-editor-title">Edit Profile</h3>
            <p className="profile-editor-subtitle">Adjust your account details without leaving the dashboard.</p>

            {profileError && <div className="profile-feedback error">{profileError}</div>}
            {profileSuccess && <div className="profile-feedback success">{profileSuccess}</div>}

            <form className="profile-editor-form" onSubmit={handleProfileSave}>
              <label>
                First name
                <input
                  type="text"
                  value={profileForm.first_name}
                  disabled={profileLoading || profileSaving}
                  onChange={(event) => handleProfileField("first_name", event.target.value)}
                  placeholder="First name"
                />
              </label>

              <label>
                Last name
                <input
                  type="text"
                  value={profileForm.last_name}
                  disabled={profileLoading || profileSaving}
                  onChange={(event) => handleProfileField("last_name", event.target.value)}
                  placeholder="Last name"
                />
              </label>

              <label>
                Email
                <input type="email" value={profileForm.email} readOnly className="profile-readonly-input" />
              </label>

              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowPasswordField((prev) => !prev)}
                disabled={profileLoading || profileSaving}
              >
                {showPasswordField ? "Hide password field" : "Change password"}
              </button>

              {showPasswordField && (
                <label>
                  New password
                  <input
                    type="password"
                    minLength={6}
                    value={profileForm.password}
                    disabled={profileLoading || profileSaving}
                    onChange={(event) => handleProfileField("password", event.target.value)}
                    placeholder="At least 6 characters"
                  />
                </label>
              )}

              <div className="profile-editor-actions">
                <button type="button" className="btn btn-ghost" onClick={closeProfileEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={profileLoading || profileSaving}>
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
