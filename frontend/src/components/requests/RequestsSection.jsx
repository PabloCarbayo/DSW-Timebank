import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getIncomingRequests,
    getOutgoingRequests,
    getServiceById,
    updateRequestStatus,
} from "../../api/timebankApi";
import {
    Inbox,
    Send,
    CheckCircle2,
    XCircle,
    CircleSlash2,
    ClipboardCheck,
    RefreshCw,
    Clock3,
} from "lucide-react";
import "./RequestsSection.css";

const STATUS_META = {
    pending: { label: "PENDING", className: "pending", icon: Clock3 },
    accepted: { label: "ACCEPTED", className: "accepted", icon: CheckCircle2 },
    completed: { label: "COMPLETED", className: "completed", icon: ClipboardCheck },
    rejected: { label: "REJECTED", className: "rejected", icon: XCircle },
    cancelled: { label: "CANCELLED", className: "cancelled", icon: CircleSlash2 },
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || {
        label: String(status || "UNKNOWN").toUpperCase(),
        className: "pending",
        icon: Clock3,
    };
    const Icon = meta.icon;

    return (
        <span className={`request-status ${meta.className}`}>
            <Icon size={13} /> {meta.label}
        </span>
    );
}

export default function RequestsSection({ onBalanceChange }) {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState("incoming");
    const [requests, setRequests] = useState([]);
    const [servicesById, setServicesById] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const loadRequests = useCallback(async (tab) => {
        if (!token) return;

        setLoading(true);
        setError("");
        try {
            const res = tab === "incoming" ? await getIncomingRequests(token) : await getOutgoingRequests(token);
            if (res.status !== 200) {
                setError(res.data?.detail || "Error loading requests.");
                setRequests([]);
                setServicesById({});
                return;
            }

            const list = Array.isArray(res.data) ? res.data : [];
            setRequests(list);

            const uniqueServiceIds = [...new Set(list.map((r) => r.service_id))];
            const detailsEntries = await Promise.all(
                uniqueServiceIds.map(async (serviceId) => {
                    try {
                        const detailRes = await getServiceById(serviceId);
                        return [serviceId, detailRes.status === 200 ? detailRes.data : null];
                    } catch {
                        return [serviceId, null];
                    }
                })
            );
            setServicesById(Object.fromEntries(detailsEntries));
        } catch {
            setError("Connection error while loading requests.");
            setRequests([]);
            setServicesById({});
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadRequests(activeTab);
    }, [loadRequests, activeTab]);

    const handleAction = async (requestId, action) => {
        if (!token) return;
        setActionLoadingId(requestId);
        setError("");

        try {
            const res = await updateRequestStatus(token, requestId, action);
            if (res.status !== 200) {
                setError(res.data?.detail || "Could not update request status.");
            } else {
                if (action === "complete") {
                    onBalanceChange?.();
                }
                await loadRequests(activeTab);
            }
        } catch {
            setError("Connection error while updating request.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const tabSummary = useMemo(() => {
        return activeTab === "incoming"
            ? "Requests you received as provider"
            : "Requests you sent as requester";
    }, [activeTab]);

    if (!token) {
        return (
            <div className="section">
                <h2 className="section-title"><Inbox size={22} /> Service Requests</h2>
                <p className="section-subtitle">Please login to view your inbox and outbox.</p>
            </div>
        );
    }

    return (
        <div className="section requests-section">
            <div className="requests-header">
                <div>
                    <h2 className="section-title"><Inbox size={22} /> Service Requests</h2>
                    <p className="section-subtitle">{tabSummary}</p>
                </div>
                <button className="btn btn-refresh requests-refresh-btn" onClick={() => loadRequests(activeTab)} disabled={loading}>
                    <RefreshCw size={14} /> {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <div className="requests-tabs">
                <button
                    className={`requests-tab ${activeTab === "incoming" ? "active" : ""}`}
                    onClick={() => setActiveTab("incoming")}
                >
                    <Inbox size={14} /> Inbox
                </button>
                <button
                    className={`requests-tab ${activeTab === "outgoing" ? "active" : ""}`}
                    onClick={() => setActiveTab("outgoing")}
                >
                    <Send size={14} /> Outbox
                </button>
            </div>

            {error && <div className="requests-error">{error}</div>}

            <div className="requests-grid">
                {loading ? (
                    <div className="requests-empty">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="requests-empty">No requests found for this tab.</div>
                ) : (
                    requests.map((request) => {
                        const service = servicesById[request.service_id];
                        const isIncoming = activeTab === "incoming";

                        return (
                            <article className="request-card" key={request.id}>
                                <div className="request-card-head">
                                    <h3>{service?.title || `Service #${request.service_id}`}</h3>
                                    <StatusBadge status={request.status} />
                                </div>

                                <div className="request-meta">
                                    <span><strong>Request ID:</strong> #{request.id}</span>
                                    <span><strong>Service ID:</strong> #{request.service_id}</span>
                                    <span><strong>Requester:</strong> #{request.requester_id}</span>
                                    <span><strong>Provider:</strong> #{request.provider_id}</span>
                                    <span><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</span>
                                    {service?.category && <span><strong>Category:</strong> {service.category}</span>}
                                    {service?.price != null && <span><strong>Price:</strong> {service.price} TB</span>}
                                </div>

                                <div className="request-actions">
                                    {isIncoming && request.status === "pending" && (
                                        <>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAction(request.id, "accept")}
                                                disabled={actionLoadingId === request.id}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleAction(request.id, "reject")}
                                                disabled={actionLoadingId === request.id}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {isIncoming && request.status === "accepted" && (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleAction(request.id, "complete")}
                                            disabled={actionLoadingId === request.id}
                                        >
                                            Complete
                                        </button>
                                    )}

                                    {!isIncoming && (request.status === "pending" || request.status === "accepted") && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleAction(request.id, "cancel")}
                                            disabled={actionLoadingId === request.id}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>
        </div>
    );
}
