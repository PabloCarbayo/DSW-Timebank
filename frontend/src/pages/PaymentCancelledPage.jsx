import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import "../App.css";

export default function PaymentCancelledPage() {
    const navigate = useNavigate();

    return (
        <div className="payment-result-page fade-in">
            <div className="payment-result-card cancelled">
                <div className="payment-result-icon cancelled-icon">
                    <XCircle size={48} />
                </div>
                <h1>Payment Cancelled</h1>
                <p className="payment-result-message">
                    The payment was not completed. No charges have been made to your account.
                    You can try again whenever you are ready.
                </p>
                <button className="btn btn-success" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>
        </div>
    );
}
