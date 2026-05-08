import { useState } from "react";
import { purchaseCredits } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { CreditCard, Wallet, AlertTriangle, ExternalLink, Coins } from "lucide-react";

const CREDIT_PACKAGES = [
    { amount: 5, label: "5 TB", description: "Starter pack" },
    { amount: 10, label: "10 TB", description: "Most popular" },
    { amount: 25, label: "25 TB", description: "Best value" },
    { amount: 50, label: "50 TB", description: "Power user" },
];

function BuyCreditsForm({ onBalanceChange }) {
    const { token } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [customAmount, setCustomAmount] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const getFinalAmount = () => {
        if (useCustom) return Number(customAmount);
        if (selectedPackage !== null) return CREDIT_PACKAGES[selectedPackage].amount;
        return 0;
    };

    const handlePurchase = async (event) => {
        event.preventDefault();
        const amount = getFinalAmount();

        if (!token) {
            setError("You must be logged in to purchase credits.");
            return;
        }

        if (!amount || amount <= 0) {
            setError("Please select a package or enter a valid amount.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await purchaseCredits(token, { amount });

            if (response.status === 200 || response.status === 201) {
                const checkoutUrl = response.data.checkout_url;
                window.location.href = checkoutUrl;
            } else {
                setError(response.data?.detail || "Could not initiate payment. Please try again.");
            }
        } catch {
            setError("Connection error. Please check your internet and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card stripe-purchase-card">
            <h3><Wallet size={18} /> Buy Time Credits</h3>
            <p className="stripe-subtitle">
                Purchase credits securely via Stripe. You will be redirected to complete payment.
            </p>

            {!token && (
                <p className="info-text muted">
                    <AlertTriangle size={14} /> You need to log in first
                </p>
            )}

            <form onSubmit={handlePurchase}>
                <div className="credit-packages-grid">
                    {CREDIT_PACKAGES.map((pkg, index) => (
                        <button
                            key={pkg.amount}
                            type="button"
                            className={`credit-package ${!useCustom && selectedPackage === index ? "selected" : ""}`}
                            onClick={() => {
                                setSelectedPackage(index);
                                setUseCustom(false);
                                setError("");
                            }}
                            disabled={loading || !token}
                        >
                            <Coins size={20} className="package-icon" />
                            <span className="package-amount">{pkg.label}</span>
                            <span className="package-price">{pkg.amount}.00 €</span>
                            <span className="package-desc">{pkg.description}</span>
                        </button>
                    ))}
                </div>

                <div className="custom-amount-section">
                    <label className="custom-toggle">
                        <input
                            type="checkbox"
                            checked={useCustom}
                            onChange={(event) => {
                                setUseCustom(event.target.checked);
                                if (event.target.checked) setSelectedPackage(null);
                                setError("");
                            }}
                            disabled={loading || !token}
                        />
                        Custom amount
                    </label>

                    {useCustom && (
                        <div className="custom-amount-input">
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={customAmount}
                                onChange={(event) => setCustomAmount(event.target.value)}
                                placeholder="Enter amount in TB"
                                disabled={loading || !token}
                                required={useCustom}
                            />
                            <span className="input-suffix">TB = € {customAmount || "0"}</span>
                        </div>
                    )}
                </div>

                {error && <p className="stripe-error">{error}</p>}

                <button
                    type="submit"
                    className="btn btn-success stripe-checkout-btn"
                    disabled={loading || !token || (!useCustom && selectedPackage === null) || (useCustom && !customAmount)}
                >
                    {loading ? (
                        "Redirecting to Stripe..."
                    ) : (
                        <>
                            <ExternalLink size={16} />
                            Pay {getFinalAmount() > 0 ? `${getFinalAmount().toFixed(2)} €` : ""} with Stripe
                        </>
                    )}
                </button>

                <p className="stripe-badge">
                    <CreditCard size={14} />
                    Powered by Stripe — Secure payment
                </p>
            </form>
        </div>
    );
}

export default function CardsSection({ onBalanceChange }) {
    return (
        <div className="section">
            <h2 className="section-title"><CreditCard size={22} /> Payments & Wallet</h2>
            <p className="section-subtitle">Purchase time credits securely with Stripe</p>
            <div className="cards-grid stripe-grid">
                <BuyCreditsForm onBalanceChange={onBalanceChange} />
            </div>
        </div>
    );
}
