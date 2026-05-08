import { useCallback, useEffect, useMemo, useState } from "react";
import { getBalance, getProfile, getTransactions, transferCredits, getIncomingRequests } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import { User, Wallet, ArrowLeftRight, RefreshCw, Star, MessageSquare } from "lucide-react";
import "./ProfileSection.css";

export default function ProfileSection({ onBalanceChange }) {
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferFeedback, setTransferFeedback] = useState("");
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [reviews, setReviews] = useState([]);

    const loadProfileData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");

        try {
            const [profileRes, balanceRes, txRes, reqsRes] = await Promise.all([
                getProfile(token),
                getBalance(token),
                getTransactions(token),
                getIncomingRequests(token),
            ]);

            if (profileRes.status === 200) setProfile(profileRes.data);
            if (balanceRes.status === 200) setBalance(balanceRes.data.balance || 0);
            if (txRes.status === 200) setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
            
            if (reqsRes.status === 200) {
                const completedReviews = (reqsRes.data || []).filter(r => r.status === "completed" && r.rating != null);
                setReviews(completedReviews);
            }

            if (profileRes.status !== 200 || balanceRes.status !== 200 || txRes.status !== 200) {
                setError("Could not load all wallet/profile data.");
            }
        } catch {
            setError("Connection error while loading profile data.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const handleTransfer = async (event) => {
        event.preventDefault();
        if (!token) return;

        const rawRecipient = recipient.trim();
        const parsedAmount = Number(amount);

        if (!rawRecipient || !parsedAmount || parsedAmount <= 0) {
            setTransferFeedback("Recipient and amount are required.");
            return;
        }

        const payload = { amount: parsedAmount };
        if (/^\d+$/.test(rawRecipient)) {
            payload.receiver_id = Number(rawRecipient);
        } else {
            payload.receiver_email = rawRecipient;
        }

        setTransferLoading(true);
        setTransferFeedback("");
        try {
            const res = await transferCredits(token, payload);
            if (res.status === 200 || res.status === 201) {
                setTransferFeedback("Transfer completed successfully.");
                setRecipient("");
                setAmount("");
                await loadProfileData();
                onBalanceChange?.();
            } else {
                setTransferFeedback(res.data?.detail || "Transfer failed.");
            }
        } catch {
            setTransferFeedback("Connection error while transferring credits.");
        } finally {
            setTransferLoading(false);
        }
    };

    const rows = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((tx) => {
            const direction = tx.sender_id === profile?.id ? "Sent" : "Received";
            return {
                ...tx,
                direction,
                type: String(tx.transaction_type || "-").toUpperCase(),
            };
            });
    }, [transactions, profile?.id]);

    if (!token) {
        return (
            <div className="section">
                <h2 className="section-title"><User size={22} /> Profile & Wallet</h2>
                <p className="section-subtitle">Please login to view your profile and transactions.</p>
            </div>
        );
    }

    return (
        <div className="section profile-wallet-section">
            <div className="profile-wallet-header">
                <div>
                    <h2 className="section-title"><User size={22} /> Profile & Wallet</h2>
                    <p className="section-subtitle">Balance, transfers, and transaction history</p>
                </div>
                <button className="btn btn-refresh profile-refresh-btn" onClick={loadProfileData} disabled={loading}>
                    <RefreshCw size={14} /> {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && <div className="profile-wallet-error">{error}</div>}

            <div className="profile-wallet-grid">
                <article className="card">
                    <h3><User size={18} /> Account Overview</h3>
                    <div className="profile-summary-list">
                        <p><strong>Name:</strong> {profile?.first_name} {profile?.last_name}</p>
                        <p><strong>Email:</strong> {profile?.email}</p>
                        <p><strong>Role:</strong> {String(profile?.role || "user").toUpperCase()}</p>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <strong>Reputation:</strong>
                            {profile?.review_count > 0 ? (
                                <>
                                    <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                                    <span>{profile.average_rating} ({profile.review_count} reviews)</span>
                                </>
                            ) : (
                                <span className="muted-text">No reviews yet</span>
                            )}
                        </p>
                    </div>
                    <div className="profile-balance-chip">
                        <Wallet size={16} /> Current Balance: <strong>{Number(balance).toFixed(2)} TB</strong>
                    </div>
                </article>

                <article className="card">
                    <h3><ArrowLeftRight size={18} /> Transfer Credits</h3>
                    <form onSubmit={handleTransfer} className="transfer-form">
                        <label>
                            Recipient ID or Email
                            <input
                                type="text"
                                value={recipient}
                                onChange={(event) => setRecipient(event.target.value)}
                                placeholder="e.g. 5 or user@timebank.com"
                                required
                            />
                        </label>
                        <label>
                            Amount (TB)
                            <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                                placeholder="10"
                                required
                            />
                        </label>

                        {transferFeedback && <p className="transfer-feedback">{transferFeedback}</p>}

                        <button type="submit" className="btn btn-success" disabled={transferLoading}>
                            {transferLoading ? "Transferring..." : "Transfer Credits"}
                        </button>
                    </form>
                </article>
            </div>

            <article className="card profile-transactions-card">
                <h3><Wallet size={18} /> Transaction History</h3>
                <div className="tx-table-wrap">
                    <table className="tx-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Direction</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="tx-empty">No transactions yet.</td>
                                </tr>
                            ) : (
                                rows.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}</td>
                                        <td>{tx.type}</td>
                                        <td>{tx.direction}</td>
                                        <td>{tx.sender_name ?? tx.sender_id ?? "SYSTEM"}</td>
                                        <td>{tx.receiver_name ?? tx.receiver_id}</td>
                                        <td>{tx.amount}</td>
                                        <td>{tx.description || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </article>

            <article className="card profile-transactions-card" style={{ marginTop: "20px" }}>
                <h3><MessageSquare size={18} /> My Received Reviews</h3>
                <div className="reviews-list" style={{ marginTop: "15px" }}>
                    {reviews.length === 0 ? (
                        <p className="muted-text text-center">You haven't received any reviews yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {reviews.map(r => (
                                <div key={r.id} style={{ padding: '15px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Star size={16} fill="var(--warning-color)" color="var(--warning-color)" />
                                            <strong>{r.rating}.0</strong>
                                        </div>
                                        <span className="muted-text" style={{ fontSize: '0.85rem' }}>
                                            {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontStyle: r.review ? 'normal' : 'italic', color: r.review ? 'inherit' : 'var(--text-muted)' }}>
                                        {r.review || "No written review provided."}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
