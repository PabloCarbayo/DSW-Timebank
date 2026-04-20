import { useState, useEffect } from "react";
import { getServices } from "../../api/timebankApi";
import { Search, Star, Clock, Code, Palette, TrendingUp, PenTool, Video, Bot, Music, Briefcase, Camera, GraduationCap, ArrowRight } from "lucide-react";
import "./MarketplaceSection.css";

const CATEGORIES = [
  { icon: Code, label: "Programming" },
  { icon: Palette, label: "Design" },
  { icon: TrendingUp, label: "Marketing" },
  { icon: PenTool, label: "Escritura" },
  { icon: Video, label: "Video" },
  { icon: Bot, label: "IA" },
  { icon: Music, label: "Música" },
  { icon: Briefcase, label: "Negocios" },
  { icon: Camera, label: "Fotografía" },
  { icon: GraduationCap, label: "Educación" },
];

export default function MarketplaceSection() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    useEffect(() => {
        const fetchAllServices = async () => {
            setLoading(true);
            try {
                const res = await getServices();
                if (res.status === 200) {
                    // El backend devuelve { items: [], total: 0, page: 1, page_size: 20 }
                    setServices(res.data.items || []);
                }
            } catch (err) {
                console.error("Error fetching services:", err);
            }
            setLoading(false);
        };
        fetchAllServices();
    }, []);

    const filteredServices = services.filter(s => {
        const safeTitle = s.title || "";
        const safeDesc = s.description || "";
        const query = (searchTerm || "").toLowerCase();
        
        const matchesSearch = safeTitle.toLowerCase().includes(query) || 
                              safeDesc.toLowerCase().includes(query);
        const matchesCategory = selectedCategory ? s.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="marketplace-container">
            {/* HERO SEARCH SECTION */}
            <div className="marketplace-hero">
                <div className="hero-background"></div>
                <h1 className="hero-title">Encuentra tu <em>servicio ideal</em></h1>
                <p className="hero-subtitle">Explora los servicios ofrecidos por nuestra comunidad en TimeBank.</p>
                
                <div className="main-search-bar">
                    <Search className="search-icon-large" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por título o descripción..."
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
                        onClick={() => setSelectedCategory("")}
                    >
                        <Star size={16} className="cat-icon" />
                        <span>All</span>
                    </button>
                    {CATEGORIES.map(cat => (
                        <button 
                            key={cat.label} 
                            className={`cat-pill ${selectedCategory === cat.label ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat.label)}
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
                        {selectedCategory ? `Servicios de ${selectedCategory}` : "Servicios Destacados"}
                    </h2>
                    <span className="results-count">{filteredServices.length} resultados</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading servicios...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} className="empty-icon" />
                        <h3>No se encontraron servicios</h3>
                        <p>Intenta con otros términos de búsqueda o categorías.</p>
                    </div>
                ) : (
                    <div className="service-grid">
                        {filteredServices.map(service => (
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
                                            {service.provider_id}
                                        </div>
                                        <span className="provider-name">Proveedor #{service.provider_id}</span>
                                    </div>
                                    <h3 className="service-title">{service.title || "Sin título"}</h3>
                                    <p className="service-description">
                                        {(service.description && service.description.length > 80) 
                                            ? service.description.substring(0, 80) + "..." 
                                            : service.description || "Sin descripción"}
                                    </p>
                                    
                                    <div className="service-card-footer">
                                        <div className="price-tag">
                                            <Clock size={16} className="price-icon" />
                                            <span><strong>{service.price}</strong> TB</span>
                                        </div>
                                        <button className="btn-solicitar">
                                            Request <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}