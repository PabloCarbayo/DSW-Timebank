import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

export default function FeedbackModal({ 
  isOpen, 
  title, 
  message, 
  type = "alert", // "alert" or "confirm"
  variant = "info", // "info", "error", "warning", "success"
  onConfirm, 
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel"
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "error": return <AlertCircle size={24} className="text-error" />;
      case "warning": return <AlertTriangle size={24} className="text-warning" />;
      case "success": return <CheckCircle size={24} className="text-success" />;
      default: return <Info size={24} className="text-info" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ maxWidth: "400px", textAlign: "center" }}>
        <button className="profile-editor-close" onClick={type === "confirm" ? onCancel : onConfirm} style={{ top: "15px", right: "15px" }}>
          <X size={18} />
        </button>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
          {getIcon()}
        </div>

        <h3 style={{ marginBottom: "10px", fontSize: "1.2rem" }}>{title}</h3>
        <p className="muted-text" style={{ marginBottom: "25px", fontSize: "0.95rem" }}>
          {message}
        </p>

        <div className="modal-actions" style={{ justifyContent: "center", gap: "10px" }}>
          {type === "confirm" && (
            <button className="btn btn-ghost" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button 
            className={`btn ${variant === "error" ? "btn-danger" : "btn-primary"}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
