import { useState, useEffect, useCallback } from "react";
import { 
    getUsers, updateUserAdmin, deleteUserAdmin,
    getAllServicesAdmin, updateServiceAdmin, deleteServiceAdmin,
    getAllTransactionsAdmin 
} from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { Users, AlertTriangle, Search, Edit2, Trash2, CheckCircle2, XCircle, Briefcase, Activity } from "lucide-react";
import FeedbackModal from "../common/FeedbackModal";
import "./AdminSection.css";

export default function AdminSection() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("users");
    
    // Users state
    const [users, setUsers] = useState([]);
    
    // Services state
    const [services, setServices] = useState([]);
    
    // Transactions state
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state for Users
    const [editingUser, setEditingUser] = useState(null);
    const [editRolee, setEditRolee] = useState("user");
    const [editIsActive, setEditIsActive] = useState(true);

    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false });

    const showFeedback = (title, message, variant = "info") => {
        setFeedbackModal({
            isOpen: true,
            title,
            message,
            type: "alert",
            variant,
            onConfirm: () => setFeedbackModal({ isOpen: false })
        });
    };

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await getUsers();
            if (res.status === 200) setUsers(res.data);
            else setError(res.data.detail || "Error loading users.");
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [token]);

    const fetchServices = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await getAllServicesAdmin();
            if (res.status === 200) setServices(res.data.items || []);
            else setError(res.data.detail || "Error loading services.");
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [token]);

    const fetchTransactions = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await getAllTransactionsAdmin();
            if (res.status === 200) setTransactions(res.data);
            else setError(res.data.detail || "Error loading transactions.");
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        if (activeTab === "users") fetchUsers();
        else if (activeTab === "services") fetchServices();
        else if (activeTab === "transactions") fetchTransactions();
    }, [activeTab, fetchUsers, fetchServices, fetchTransactions]);

    const handleEditClick = (u) => {
        setEditingUser(u);
        setEditRolee(u.role || "user");
        setEditIsActive(u.is_active !== false); // Default active if undefined
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                role: editRolee,
                is_active: editIsActive,
            };
            const res = await updateUserAdmin(editingUser.id, payload);
            if (res.status === 200) {
                setEditingUser(null);
                fetchUsers();
            } else {
                showFeedback("Error", res.data.detail || "Error updating.", "error");
            }
        } catch (err) {
            showFeedback("Error", err.message, "error");
        }
        setLoading(false);
    };

    const executeDeleteUser = async (userId) => {
        try {
            const res = await deleteUserAdmin(userId);
            if (res.status === 200 || res.status === 204) {
                fetchUsers();
            } else {
                showFeedback("Error", res.data.detail || "Error deleting user.", "error");
            }
        } catch (err) {
            showFeedback("Error", err.message, "error");
        }
        setLoading(false);
    };

    const handleDeleteClick = (userId) => {
        setFeedbackModal({
            isOpen: true,
            title: "Delete User",
            message: "Are you sure you want to delete this user?",
            type: "confirm",
            variant: "warning",
            onConfirm: () => {
                setFeedbackModal({ isOpen: false });
                setLoading(true);
                executeDeleteUser(userId);
            },
            onCancel: () => setFeedbackModal({ isOpen: false })
        });
    };

    const handleToggleServiceVisibility = async (service) => {
        setLoading(true);
        try {
            const res = await updateServiceAdmin(service.id, { is_active: !service.is_active });
            if (res.status === 200) fetchServices();
            else showFeedback("Error", res.data.detail || "Error updating service.", "error");
        } catch (err) {
            showFeedback("Error", err.message, "error");
        }
        setLoading(false);
    };

    const executeDeleteService = async (serviceId) => {
        try {
            const res = await deleteServiceAdmin(serviceId);
            if (res.status === 200 || res.status === 204) fetchServices();
            else showFeedback("Error", res.data.detail || "Error deleting service.", "error");
        } catch (err) {
            showFeedback("Error", err.message, "error");
        }
        setLoading(false);
    };

    const handleDeleteService = (serviceId) => {
        setFeedbackModal({
            isOpen: true,
            title: "Delete Service",
            message: "Are you sure you want to delete this service?",
            type: "confirm",
            variant: "warning",
            onConfirm: () => {
                setFeedbackModal({ isOpen: false });
                setLoading(true);
                executeDeleteService(serviceId);
            },
            onCancel: () => setFeedbackModal({ isOpen: false })
        });
    };

    const filteredUsers = users.filter((u) => {
        const query = searchTerm.toLowerCase();
        return (
            (u.email || "").toLowerCase().includes(query) ||
            (u.first_name || "").toLowerCase().includes(query) ||
            (u.last_name || "").toLowerCase().includes(query)
        );
    });

    if (!token) {
        return (
            <div className="section">
                <h2 className="section-title"><Users size={22} /> Administration</h2>
                <div className="card" style={{ marginTop: "20px" }}>
                    <p className="info-text muted"><AlertTriangle size={14} /> Restricted access. Please log in as an administrator.</p>
                </div>
            </div>
        );
    }

    const renderUsers = () => (
        <>
            <div className="admin-toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-refresh" onClick={fetchUsers} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            <div className="card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Balance (+/-)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center muted-text" style={{ padding: "20px" }}>
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td className="muted-text">#{u.id}</td>
                                        <td>{u.first_name} {u.last_name}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                                                {u.role === "admin" ? "Admin" : "User"}
                                            </span>
                                        </td>
                                        <td>
                                            {u.is_active ? (
                                                <span className="status-active"><CheckCircle2 size={14} /> Active</span>
                                            ) : (
                                                <span className="status-inactive"><XCircle size={14} /> Inactive</span>
                                            )}
                                        </td>
                                        <td className={u.balance > 0 ? "balance-positive" : "balance-neutral"}>
                                            {u.balance != null ? u.balance.toFixed(2) : "0.00"} TB
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="icon-btn edit" onClick={() => handleEditClick(u)} title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn delete" onClick={() => handleDeleteClick(u.id)} title="Delete" disabled={u.role === "admin"}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content card">
                        <h3><Edit2 size={18} /> Edit User: {editingUser.email}</h3>
                        <form onSubmit={handleSaveEdit}>
                            <div className="form-field">
                                <label>Role del User</label>
                                <select 
                                    value={editRolee} 
                                    onChange={(e) => setEditRolee(e.target.value)}
                                    className="select-field"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-field checkbox-field">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={editIsActive} 
                                        onChange={(e) => setEditIsActive(e.target.checked)} 
                                    />
                                    Active Account
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success" disabled={loading}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    const renderServices = () => (
        <>
            <div className="admin-toolbar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-refresh" onClick={fetchServices} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>
            <div className="card table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Provider</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.filter(s => (s.title || "").toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (
                                <tr key={s.id}>
                                    <td className="muted-text">#{s.id}</td>
                                    <td>{s.title}</td>
                                    <td>{s.category}</td>
                                    <td>{s.provider?.first_name} {s.provider?.last_name}</td>
                                    <td>{s.price} TB</td>
                                    <td>
                                        {s.is_active ? (
                                            <span className="status-active"><CheckCircle2 size={14} /> Visible</span>
                                        ) : (
                                            <span className="status-inactive"><XCircle size={14} /> Hidden</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => handleToggleServiceVisibility(s)}>
                                                {s.is_active ? "Hide" : "Show"}
                                            </button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteService(s.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    const renderTransactions = () => {
        const totalTB = transactions.reduce((acc, t) => acc + (t.transaction_type === "credit_purchase" ? t.amount : 0), 0);
        return (
            <>
                <div className="admin-toolbar">
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div className="card" style={{ padding: '10px 20px', background: 'var(--card-bg)' }}>
                            <strong>Total System Purchases: </strong> <span className="balance-positive">{totalTB.toFixed(2)} TB</span>
                        </div>
                        <div className="card" style={{ padding: '10px 20px', background: 'var(--card-bg)' }}>
                            <strong>Total Transactions: </strong> <span>{transactions.length}</span>
                        </div>
                    </div>
                    <button className="btn btn-refresh" onClick={fetchTransactions} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
                <div className="card table-card">
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="muted-text">#{tx.id}</td>
                                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                                        <td>{tx.transaction_type}</td>
                                        <td>{tx.amount} TB</td>
                                        <td>{tx.sender_name ?? tx.sender_id ?? "SYSTEM"}</td>
                                        <td>{tx.receiver_name ?? tx.receiver_id}</td>
                                        <td>{tx.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="section admin-section">
            <FeedbackModal {...feedbackModal} />
            <h2 className="section-title"><Users size={22} /> Administration Panel</h2>
            <p className="section-subtitle">Manage users, services, and transactions</p>

            {error && (
                <div className="response-panel error" style={{ marginBottom: "20px" }}>
                    <div className="response-header">
                        <span className="status-badge">ERROR</span>
                        <span className="status-text">{typeof error === "string" ? error : JSON.stringify(error)}</span>
                    </div>
                </div>
            )}

            <div className="requests-tabs" style={{ marginBottom: "20px" }}>
                <button
                    className={`requests-tab ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={14} /> Users
                </button>
                <button
                    className={`requests-tab ${activeTab === "services" ? "active" : ""}`}
                    onClick={() => setActiveTab("services")}
                >
                    <Briefcase size={14} /> Services
                </button>
                <button
                    className={`requests-tab ${activeTab === "transactions" ? "active" : ""}`}
                    onClick={() => setActiveTab("transactions")}
                >
                    <Activity size={14} /> Transactions
                </button>
            </div>

            {activeTab === "users" && renderUsers()}
            {activeTab === "services" && renderServices()}
            {activeTab === "transactions" && renderTransactions()}
        </div>
    );
}