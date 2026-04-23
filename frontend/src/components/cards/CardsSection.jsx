import { useState } from "react";
import {
    registerCard,
    verifyCard,
    getCardDetails,
} from "../../api/paymentsApi";
import { purchaseCredits } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import ResponsePanel, { FormField } from "../common/ResponsePanel";
import { CreditCard, ShieldCheck, Search, Wallet, AlertTriangle } from "lucide-react";

function BuyCreditsForm({ onBalanceChange }) {
    const { token } = useAuth();
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [amount, setAmount] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!token) {
            setResult({ status: 401, data: { detail: "Requires login" } });
            return;
        }

        setLoading(true);
        try {
            const res = await purchaseCredits(token, {
                card_number: number,
                expiration_date: expiry,
                cvc,
                amount: Number(amount),
            });
            setResult(res);
            if (res.status === 200 || res.status === 201) {
                setAmount("");
                onBalanceChange?.();
            }
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><Wallet size={18} /> Buy Time Credits</h3>
            {!token && <p className="info-text muted"><AlertTriangle size={14} /> Requires login</p>}
            <form onSubmit={handleSubmit}>
                <FormField label="Card Number" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Expiration (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <FormField label="Amount (TB)" type="number" value={amount} onChange={setAmount} placeholder="40" />
                <button type="submit" disabled={loading || !token} className="btn btn-success">
                    {loading ? "Purchasing..." : "Purchase Credits"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function CardRegisterForm() {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [balance, setBalance] = useState("0");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const res = await registerCard({
                cardholder_name: name,
                card_number: number,
                expiration_date: expiry,
                cvc,
                initial_balance: parseFloat(balance),
            });
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><CreditCard size={18} /> Register Card</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Cardholder" value={name} onChange={setName} placeholder="John Doe" />
                <FormField label="Card Number" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Expiration (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <FormField label="Initial Balance" type="number" value={balance} onChange={setBalance} placeholder="100" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Registering..." : "Register Card"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function CardVerifyForm() {
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const res = await verifyCard({
                card_number: number,
                expiration_date: expiry,
                cvc,
            });
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><ShieldCheck size={18} /> Verify Card</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Card Number" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Expiration (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Verifying..." : "Verify"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function CardLookupForm() {
    const [number, setNumber] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const res = await getCardDetails(number);
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><Search size={18} /> Card Lookup</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Card Number" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <button type="submit" disabled={loading} className="btn btn-ghost">
                    {loading ? "Searching..." : "Lookup Card"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

export default function CardsSection({ onBalanceChange }) {
    return (
        <div className="section">
            <h2 className="section-title"><CreditCard size={22} /> Payments & Wallet</h2>
            <p className="section-subtitle">Purchase credits and manage cards</p>
            <div className="cards-grid">
                <BuyCreditsForm onBalanceChange={onBalanceChange} />
                <CardRegisterForm />
                <CardVerifyForm />
                <CardLookupForm />
            </div>
        </div>
    );
}
