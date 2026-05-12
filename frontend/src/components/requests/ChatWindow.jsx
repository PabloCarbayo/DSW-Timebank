import { useState, useEffect, useRef } from "react";
import { getRequestMessages, sendRequestMessage } from "../../api/timebankApi";
import { Send, X, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./ChatWindow.css";

export default function ChatWindow({ request, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const loadMessages = async () => {
        try {
            const res = await getRequestMessages(request.id);
            if (res.status === 200) {
                setMessages(res.data);
            }
        } catch (e) {
            console.error("Failed to load messages", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, [request.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            const res = await sendRequestMessage(request.id, { content: newMessage });
            if (res.status === 200) {
                setMessages((prev) => [...prev, res.data]);
                setNewMessage("");
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content chat-modal">
                <div className="chat-header">
                    <h3><MessageSquare size={18} /> Chat - Request #{request.id}</h3>
                    <button className="btn btn-ghost btn-close" onClick={onClose}><X size={18} /></button>
                </div>
                
                <div className="chat-messages">
                    {loading && messages.length === 0 ? (
                        <p className="muted-text text-center">Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p className="muted-text text-center">No messages yet. Start the conversation!</p>
                    ) : (
                        messages.map((msg) => {
                            const isMine = user && msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                                    <div className="chat-content">{msg.content}</div>
                                    <div className="chat-meta">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSend} className="chat-input-area">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="chat-input"
                    />
                    <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
