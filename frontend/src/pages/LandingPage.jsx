import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import "./LandingPage.css";

const CATEGORIES = [
  { icon: Code, label: "Programming" },
  { icon: Palette, label: "Diseño" },
  { icon: TrendingUp, label: "Marketing" },
  { icon: PenTool, label: "Escritura" },
  { icon: Video, label: "Video" },
  { icon: Bot, label: "IA" },
  { icon: Music, label: "Música" },
  { icon: Briefcase, label: "Negocios" },
  { icon: Camera, label: "Fotografía" },
  { icon: GraduationCap, label: "Educación" },
];

export default function LandingPage() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  return (
    <div className="landing">
      <div className="landing-bg" />

      <h1 className="landing-brand"><em>TimeBank</em></h1>

      <h2 className="landing-title">
        Find the <em>service</em><br />
        adecuado de inmediato
      </h2>

      <p className="landing-slogan">
        En <span className="accent">TimeBank</span> you can exchange your time with others.
        Ofrece tus habilidades, encuentra las que necesitas y forma parte de
        una comunidad donde cada minuto cuenta.
      </p>

      <div className="carousel">
        <button className="carousel-btn" onClick={() => scroll("left")} aria-label="Previous">
          <ChevronLeft size={22} />
        </button>
        <div className="carousel-track" ref={scrollRef}>
          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="service-card">
              <div className="service-icon-ring">
                <cat.icon size={26} className="service-icon" />
              </div>
              <span className="service-label">{cat.label}</span>
            </div>
          ))}
        </div>
        <button className="carousel-btn" onClick={() => scroll("right")} aria-label="Next">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="landing-cta">
        <div className="cta-group">
          <p className="cta-text">Join us!</p>
          <Link to="/register" className="cta-btn cta-btn--primary">Sign Up</Link>
        </div>
        <div className="cta-group">
          <p className="cta-text">Already have an account?</p>
          <Link to="/login" className="cta-btn cta-btn--ghost">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
