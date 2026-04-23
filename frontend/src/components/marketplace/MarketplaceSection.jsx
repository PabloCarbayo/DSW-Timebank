import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createRequest, getServiceById, getServices } from "../../api/timebankApi";
import {
    Search,
    Star,
    Clock,
    Code,
    Palette,
    TrendingUp,
    PenTool,
    Video,
    Bot,
    Music,
    Briefcase,
    Camera,
    GraduationCap,
    ArrowRight,
    Eye,
    X,
} from "lucide-react";
import "./MarketplaceSection.css";

const CATEGORIES = [
  { icon: Code, label: "Programming" },
  { icon: Palette, label: "Design" },
  { icon: TrendingUp, label: "Marketing" },
  { icon: PenTool, label: "Writing" },
  { icon: Video, label: "Video" },
  { icon: Bot, label: "AI" },
  { icon: Music, label: "Music" },
  { icon: Briefcase, label: "Business" },
  { icon: Camera, label: "Photography" },
  { icon: GraduationCap, label: "Education" },
];

export default function MarketplaceSection() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(9);
    const [total, setTotal] = useState(0);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestFeedback, setRequestFeedback] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1);
        }, 280);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchAllServices = async () => {
            setLoading(true);
            try {
                const res = await getServices({
                    category: selectedCategory || undefined,
                    keyword: debouncedSearch || undefined,
                    page,
                    page_size: pageSize,
                });
                if (res.status === 200) {
                    setServices(res.data.items || []);
                    setTotal(res.data.total || 0);
                } else {
                    setServices([]);
                    setTotal(0);
                }
            } catch (err) {
                console.error("Error fetching services:", err);
                setServices([]);
                setTotal(0);
            }
            setLoading(false);
        };
        fetchAllServices();
    }, [selectedCategory, debouncedSearch, page, pageSize]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(total / pageSize));
    }, [total, pageSize]);

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    const handleOpenDetail = async (service) => {
        setRequestFeedback("");
        setDetailOpen(true);
        setDetailLoading(true);
        setSelectedService(service);

        try {
            const res = await getServiceById(service.id);
            if (res.status === 200) {
                setSelectedService(res.data);
            }
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRequestService = async () => {
        if (!selectedService) return;
        if (!token) {
            navigate("/login");
            return;
        }

        setRequestLoading(true);
        setRequestFeedback("");
        try {
            const res = await createRequest(token, { service_id: selectedService.id });
            if (res.status === 200 || res.status === 201) {
                setRequestFeedback("Request sent successfully.");
            } else {
                setRequestFeedback(res.data?.detail || "Could not send request.");
            }
        } catch {
            setRequestFeedback("Connection error while sending request.");
        } finally {
            setRequestLoading(false);
        }
    };

    return (
        <div className="marketplace-container">
            {/* HERO SEARCH SECTION */}
            <div className="marketplace-hero">
                <div className="hero-background"></div>
                <h1 className="hero-title">Find your <em>ideal service</em></h1>
                <p className="hero-subtitle">Explore the services offered by our community on TimeBank.</p>
                
                <div className="main-search-bar">
                    <Search className="search-icon-large" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* CATEGORIES CAROUSEL */}
            <div className="categories-carousel-wrapper">
                <div className="categories-carousel">
                    <button 
                        className={`cat-pill ${selectedCategory === "" ? "active" : ""}`}
                        onClick={() => handleCategoryClick("")}
                    >
                        <Star size={16} className="cat-icon" />
                        <span>All</span>
                    </button>
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.label} 
                            className={`cat-pill ${selectedCategory === cat.label ? "active" : ""}`}
                            onClick={() => handleCategoryClick(cat.label)}
                        >
                            <cat.icon size={16} className="cat-icon" />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* SERVICES GRID */}
            <div className="marketplace-content">
                <div className="section-header-row">
                    <h2 className="section-title">
                        {selectedCategory ? `Services in ${selectedCategory}` : "Featured Services"}
                    </h2>
                    <span className="results-count">{total} results</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading services...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} className="empty-icon" />
                        <h3>No services found</h3>
                        <p>Try other search terms or categories.</p>
                    </div>
                ) : (
                    <div className="service-grid">
                        {services.map(service => (
                            <div key={service.id} className="service-card-ui">
                                <div className="service-card-image">
                                    {/* Placeholder image representation */}
                                    <div className="placeholder-img">
                                        <Briefcase size={40} className="placeholder-icon" />
                                    </div>
                                    <div className="category-badge">{service.category}</div>
                                </div>
                                <div className="service-card-body">
                                    <div className="provider-info">
                                        <div className="provider-avatar">
                                            {(service.provider?.first_name || "U").charAt(0)}
                                        </div>
                                        <span className="provider-name">
                                            {service.provider
                                                ? `${service.provider.first_name} ${service.provider.last_name}`
                                                : `Provider #${service.provider_id}`}
                                        </span>
                                    </div>
                                    <h3 className="service-title">{service.title || "Untitled"}</h3>
                                    <p className="service-description">
                                        {(service.description && service.description.length > 80) 
                                            ? service.description.substring(0, 80) + "..." 
                                            : service.description || "No description"}
                                    </p>
                                    
                                    <div className="service-card-footer">
                                        <div className="price-tag">
                                            <Clock size={16} className="price-icon" />
                                            <span><strong>{service.price}</strong> TB</span>
                                        </div>
                                        <button className="btn-solicitar" onClick={() => handleOpenDetail(service)}>
                                            View <Eye size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pagination-wrap">
                    <button
                        className="btn btn-ghost pagination-btn"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page <= 1 || loading}
                    >
                        Previous
                    </button>
                    <span className="pagination-label">Page {page} of {totalPages}</span>
                    <button
                        className="btn btn-ghost pagination-btn"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages || loading}
                    >
                        Next
                    </button>
                </div>
            </div>

            {detailOpen && (
                <div className="marketplace-modal-overlay" onClick={() => setDetailOpen(false)}>
                    <div className="marketplace-modal-card" onClick={(event) => event.stopPropagation()}>
                        <button className="marketplace-modal-close" onClick={() => setDetailOpen(false)}>
                            <X size={18} />
                        </button>

                        {detailLoading ? (
                            <p className="marketplace-modal-loading">Loading service details...</p>
                        ) : selectedService ? (
                            <>
                                <h3>{selectedService.title}</h3>
                                <p className="marketplace-modal-meta">
                                    {selectedService.category} · {selectedService.price} TB / hr
                                </p>
                                <p className="marketplace-modal-description">
                                    {selectedService.description || "No description provided."}
                                </p>
                                {selectedService.provider && (
                                    <p className="marketplace-modal-provider">
                                        Provider: {selectedService.provider.first_name} {selectedService.provider.last_name} ({selectedService.provider.email})
                                    </p>
                                )}

                                {requestFeedback && <p className="marketplace-request-feedback">{requestFeedback}</p>}

                                <button
                                    className="btn btn-success marketplace-request-btn"
                                    onClick={handleRequestService}
                                    disabled={requestLoading}
                                >
                                    {requestLoading ? "Sending request..." : "Request Service"} <ArrowRight size={14} />
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}