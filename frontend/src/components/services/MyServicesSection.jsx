import { useEffect, useState } from "react";
import { getMyServices, createService, updateService, deleteService } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { Plus, Edit2, Trash2, X, Check, Clock } from "lucide-react";
import "./MyServicesSection.css";

const CATEGORIES = [
    "Programming",
    "Design",
  "Marketing",
    "Writing",
  "Video",
    "AI",
    "Music",
    "Business",
    "Photography",
    "Education",
];

export function MyServicesSection() {
    const { token } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
    const [currentServiceId, setCurrentServiceId] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: CATEGORIES[0],
        price: 1.0,
        is_active: true
    });

    useEffect(() => {
        fetchMyServices();
    }, []);

    const fetchMyServices = async () => {
        setLoading(true);
        try {
            const res = await getMyServices(token);
            if (res.status === 200) {
                setServices(Array.isArray(res.data) ? res.data : (res.data.items || []));
            } else {
                setError(res.data.detail || "Error loading your services");
            }
        } catch (err) {
            setError("Connection error to the server");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mode, service = null) => {
        setModalMode(mode);
        if (mode === "edit" && service) {
            setFormData({
                title: service.title,
                description: service.description,
                category: service.category,
                price: service.price,
                is_active: service.is_active
            });
            setCurrentServiceId(service.id);
        } else {
            setFormData({
                title: "",
                description: "",
                category: CATEGORIES[0],
                price: 1.0,
                is_active: true
            });
            setCurrentServiceId(null);
        }
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === "create") {
                const res = await createService(token, { ...formData, price: parseFloat(formData.price) });
                if (res.status === 201 || res.status === 200) {
                    fetchMyServices();
                    setIsModalOpen(false);
                } else {
                    alert(res.data.detail || "Error creating service");
                }
            } else {
                const res = await updateService(token, currentServiceId, { ...formData, price: parseFloat(formData.price) });
                if (res.status === 200) {
                    fetchMyServices();
                    setIsModalOpen(false);
                } else {
                    alert(res.data.detail || "Error updating service");
                }
            }
        } catch (err) {
            alert("Connection error to the server");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            const res = await deleteService(token, id);
            if (res.status === 204 || res.status === 200) {
                fetchMyServices();
            } else {
                alert("Error deleting service");
            }
        } catch (err) {
            alert("Connection error to the server");
        }
    };

    if (loading) return <div className="loading-state">Loading your services...</div>;

    return (
        <div className="myservices-container fade-in">
            <header className="myservices-header">
                <div>
                    <h2 className="hero-title">My <span>Services</span></h2>
                    <p className="hero-subtitle">Manage the offers you provide to the community</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal("create")} style={{ maxWidth: '200px' }}>
                    <Plus size={20} /> New Service
                </button>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="services-grid">
                {services.length === 0 ? (
                    <div className="empty-state glass-card">
                        <Clock size={48} />
                        <h3>You are not offering any services yet</h3>
                        <p>Share your skills with the community. Click "New Service" at the top right to start.</p>
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="service-card">
                            <div className="card-header">
                                <span className="cat-badge">{service.category}</span>
                                <div className="card-actions">
                                    <button className="icon-btn edit-btn" onClick={() => handleOpenModal("edit", service)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(service.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="card-title">{service.title}</h3>
                            <p className="card-desc">
                                {(service.description || "").substring(0, 100)}...
                            </p>
                            <div className="card-footer">
                                <span className="price-tag">
                                    {service.price} TB
                                </span>
                                <span className={`status-tag ${service.is_active ? 'active' : 'inactive'}`}>
                                    {service.is_active ? 'Active' : 'Hidden'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="elegant-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                            <X size={24} />
                        </button>

                        <div className="elegant-modal-header">
                            <h3 className="elegant-modal-title">
                                {modalMode === "create" ? "New Service" : "Edit Service"}
                            </h3>
                            <p className="elegant-modal-subtitle">
                                {modalMode === "create" 
                                    ? "Detail what skill you offer to the community" 
                                    : "Update the details of your service offer"}
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="modal-form">
                            <label className="elegant-label">
                                Service Title
                                <input
                                    className="elegant-input"
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex. Private piano lessons"
                                />
                            </label>

                            <div className="form-group-row">
                                <label className="elegant-label">
                                    Category
                                    <select
                                        className="elegant-input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </label>
                                <label className="elegant-label">
                                    Price (TB/hr)
                                    <input
                                        className="elegant-input"
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="1.0"
                                    />
                                </label>
                            </div>

                            <label className="elegant-label">
                                Detailed Description
                                <textarea
                                    className="elegant-input"
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What is included? How long does it last? Where is it taught?..."
                                />
                            </label>

                            <label className="elegant-checkbox-wrap">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <span className="elegant-checkbox-text">
                                    Publish in the marketplace <em>(visible to others)</em>
                                </span>
                            </label>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <Check size={18} /> {modalMode === "create" ? "Publish" : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
