import { useState, useEffect, useCallback } from "react";
import { getUsers, updateUserAdmin, deleteUserAdmin } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { Users, AlertTriangle, Search, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import "./AdminSection.css";

export default function AdminSection() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [editingUser, setEditingUser] = useState(null);
    const [editRolee, setEditRolee] = useState("user");
    const [editIsActive, setEditIsActive] = useState(true);

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getUsers(token);
            if (res.status === 200) {
                setUsers(res.data);
            } else {
                setError(res.data.detail || "Error loading users. Do you have Admin permissions?");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
            const res = await updateUserAdmin(token, editingUser.id, payload);
            if (res.status === 200) {
                setEditingUser(null);
                fetchUsers();
            } else {
                alert(res.data.detail || "Error updating.");
            }
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    const handleDeleteClick = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        setLoading(true);
        try {
            const res = await deleteUserAdmin(token, userId);
            if (res.status === 200 || res.status === 204) {
                fetchUsers();
            } else {
                alert(res.data.detail || "Error deleting user.");
            }
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
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

    return (
        <div className="section admin-section">
            <h2 className="section-title"><Users size={22} /> User Management</h2>
            <p className="section-subtitle">Administrator control panel</p>

            {error && (
                <div className="response-panel error" style={{ marginBottom: "20px" }}>
                    <div className="response-header">
                        <span className="status-badge">ERROR</span>
                        <span className="status-text">{error}</span>
                    </div>
                </div>
            )}

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

            {/* Modal de edición simulado in-page */}
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
        </div>
    );
}