import { useEffect, useState } from "react";
import { getMyServices, createService, updateService, deleteService } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { Plus, Edit2, Trash2, X, Check, Clock } from "lucide-react";
import "./MyServicesSection.css";

const CATEGORIES = [
  "Programación",
  "Diseño",
  "Marketing",
  "Escritura",
  "Video",
  "IA",
  "Música",
  "Negocios",
  "Fotografía",
  "Educación",
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
                setServices(res.data.items || []);
            } else {
                setError(res.data.detail || "Error al cargar tus servicios");
            }
        } catch (err) {
            setError("Error de conexión al servidor");
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
                    alert(res.data.detail || "Error al crear servicio");
                }
            } else {
                const res = await updateService(token, currentServiceId, { ...formData, price: parseFloat(formData.price) });
                if (res.status === 200) {
                    fetchMyServices();
                    setIsModalOpen(false);
                } else {
                    alert(res.data.detail || "Error al actualizar servicio");
                }
            }
        } catch (err) {
            alert("Error de conexión al servidor");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este servicio?")) return;
        try {
            const res = await deleteService(token, id);
            if (res.status === 204 || res.status === 200) {
                fetchMyServices();
            } else {
                alert("Error al eliminar servicio");
            }
        } catch (err) {
            alert("Error de conexión al servidor");
        }
    };

    if (loading) return <div className="loading-state">Cargando tus servicios...</div>;

    return (
        <div className="myservices-container fade-in">
            <header className="myservices-header">
                <div>
                    <h2 className="hero-title">Mis <span>Servicios</span></h2>
                    <p className="hero-subtitle">Gestiona las ofertas que brindas a la comunidad</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal("create")} style={{ maxWidth: '200px' }}>
                    <Plus size={20} /> Nuevo Servicio
                </button>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="services-grid">
                {services.length === 0 ? (
                    <div className="empty-state glass-card">
                        <Clock size={48} />
                        <h3>Aún no ofreces servicios</h3>
                        <p>Comparte tus habilidades con la comunidad ganando horas.</p>
                        <button className="btn btn-primary" onClick={() => handleOpenModal("create")} style={{ marginTop: '1rem', maxWidth: '250px' }}>
                            <Plus size={18} /> Crear un servicio
                        </button>
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="service-card">
                            <div className="card-header">
                                <span className="cat-badge">{service.category}</span>
                                <div className="card-actions">
                                    <button className="icon-btn edit-btn" onClick={() => handleOpenModal("edit", service)} title="Editar">
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
                                    {service.is_active ? 'Activo' : 'Oculto'}
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
                                {modalMode === "create" ? "Nuevo Servicio" : "Editar Servicio"}
                            </h3>
                            <p className="elegant-modal-subtitle">
                                {modalMode === "create" 
                                    ? "Detalla qué habilidad ofreces a la comunidad" 
                                    : "Actualiza los detalles de tu oferta de servicio"}
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
                                    placeholder="Ej. Clases particulares de piano"
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
                                    Precio (TB/hr)
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
                                Description Detallada
                                <textarea
                                    className="elegant-input"
                                    required
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="¿Qué incluye?, ¿Cuánto dura?, ¿Dónde se imparte?..."
                                />
                            </label>

                            <label className="elegant-checkbox-wrap">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <span className="elegant-checkbox-text">
                                    Publicar en el marketplace <em>(visible para otros)</em>
                                </span>
                            </label>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn-elegant-secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-elegant-primary">
                                    <Check size={18} /> {modalMode === "create" ? "Publicar" : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
