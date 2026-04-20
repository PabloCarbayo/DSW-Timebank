import { useState } from "react";
import {
    registerCard,
    verifyCard,
    processPayment,
    topUpCard,
    getCardDetails,
} from "../../api/paymentsApi";
import ResponsePanel, { FormField } from "../common/ResponsePanel";
import { CreditCard, ShieldCheck, SendHorizonal, WalletMinimal, Search } from "lucide-react";

function CardRegisterForm() {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [balance, setBalance] = useState("0");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            <h3><CreditCard size={18} /> Registrar Tarjeta</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Cardholder" value={name} onChange={setName} placeholder="John Doe" />
                <FormField label="Number de tarjeta" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Caducidad (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <FormField label="Saldo inicial (€)" type="number" value={balance} onChange={setBalance} placeholder="100" />
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                <FormField label="Number de tarjeta" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Caducidad (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Verifying..." : "Verify"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function CardPayForm() {
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [amount, setAmount] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await processPayment({
                card_number: number,
                expiration_date: expiry,
                cvc,
                amount: parseFloat(amount),
            });
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><SendHorizonal size={18} /> Realizar Pago</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Number de tarjeta" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Caducidad (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <FormField label="Importe (€)" type="number" value={amount} onChange={setAmount} placeholder="40.00" />
                <button type="submit" disabled={loading} className="btn btn-danger">
                    {loading ? "Processing..." : "Pay"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

function CardTopUpForm() {
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [amount, setAmount] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await topUpCard({
                card_number: number,
                expiration_date: expiry,
                cvc,
                amount: parseFloat(amount),
            });
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><WalletMinimal size={18} /> Recargar Saldo</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Number de tarjeta" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <FormField label="Caducidad (MM/YY)" value={expiry} onChange={setExpiry} placeholder="12/28" />
                <FormField label="CVC" value={cvc} onChange={setCvc} placeholder="123" />
                <FormField label="Importe (€)" type="number" value={amount} onChange={setAmount} placeholder="50.00" />
                <button type="submit" disabled={loading} className="btn btn-success">
                    {loading ? "Recargando..." : "Recargar"}
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            <h3><Search size={18} /> Consultar Tarjeta</h3>
            <form onSubmit={handleSubmit}>
                <FormField label="Number de tarjeta" value={number} onChange={setNumber} placeholder="1234567812345678" />
                <button type="submit" disabled={loading} className="btn">
                    {loading ? "Buscando..." : "Consultar"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

export default function CardsSection() {
    return (
        <div className="section">
            <h2 className="section-title"><CreditCard size={22} /> Pasarela de Pagos</h2>
            <p className="section-subtitle">Backend Payments — <code>localhost:8001</code></p>
            <div className="cards-grid">
                <CardRegisterForm />
                <CardVerifyForm />
                <CardPayForm />
                <CardTopUpForm />
                <CardLookupForm />
            </div>
        </div>
    );
}
