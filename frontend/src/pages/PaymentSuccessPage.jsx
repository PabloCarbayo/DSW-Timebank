import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowLeft, Hourglass } from "lucide-react";
import "../App.css";

export default function PaymentSuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(5);
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((previous) => {
                if (previous <= 1) {
                    clearInterval(timer);
                    navigate("/dashboard");
                    return 0;
                }
                return previous - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="payment-result-page fade-in">
            <div className="payment-result-card success">
                <div className="payment-result-icon success-icon">
                    <CheckCircle size={48} />
                </div>
                <h1>Payment Successful!</h1>
                <p className="payment-result-message">
                    Your time credits have been added to your account.
                    The balance will be updated shortly.
                </p>
                {sessionId && (
                    <p className="payment-session-id">
                        Session: <code>{sessionId.slice(0, 20)}...</code>
                    </p>
                )}
                <p className="payment-redirect-notice">
                    <Hourglass size={14} />
                    Redirecting to dashboard in {countdown}s...
                </p>
                <button className="btn btn-success" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={16} /> Go to Dashboard Now
                </button>
            </div>
        </div>
    );
}
