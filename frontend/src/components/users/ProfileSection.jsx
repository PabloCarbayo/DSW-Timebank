import { useState } from "react";
import { getProfile, updateProfile } from "../../api/timebankApi";
import { useAuth } from "../../context/AuthContext";
import ResponsePanel, { FormField } from "../common/ResponsePanel";
import { User, Pencil, AlertTriangle } from "lucide-react";

function GetProfileForm() {
    const { token } = useAuth();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!token) {
            setResult({ status: 401, data: { detail: "You need to login first" } });
            return;
        }
        setLoading(true);
        try {
            const res = await getProfile(token);
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><User size={18} /> View My Profile</h3>
            {!token && <p className="info-text muted"><AlertTriangle size={14} /> Requires login</p>}
            <button onClick={handleSubmit} disabled={loading || !token} className="btn">
                {loading ? "Loading..." : "Get Profile"}
            </button>
            <ResponsePanel result={result} />
        </div>
    );
}

function UpdateProfileForm() {
    const { token } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            setResult({ status: 401, data: { detail: "You need to login first" } });
            return;
        }
        setLoading(true);
        try {
            const body = {};
            if (firstName) body.first_name = firstName;
            if (lastName) body.last_name = lastName;
            if (password) body.password = password;

            const res = await updateProfile(token, body);
            setResult(res);
        } catch (err) {
            setResult({ status: 0, data: { error: err.message } });
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <h3><Pencil size={18} /> Update Profile</h3>
            {!token && <p className="info-text muted"><AlertTriangle size={14} /> Requires login</p>}
            <form onSubmit={handleSubmit}>
                <FormField label="New First Name" value={firstName} onChange={setFirstName} placeholder="(optional)" required={false} />
                <FormField label="New Last Name" value={lastName} onChange={setLastName} placeholder="(optional)" required={false} />
                <FormField label="New Password" type="password" value={password} onChange={setPassword} placeholder="(optional, min. 6)" required={false} />
                <button type="submit" disabled={loading || !token} className="btn">
                    {loading ? "Updating..." : "Update"}
                </button>
            </form>
            <ResponsePanel result={result} />
        </div>
    );
}

export default function ProfileSection() {
    return (
        <div className="section">
            <h2 className="section-title"><User size={22} /> User Profile</h2>
            <p className="section-subtitle">Backend TimeBank — <code>localhost:8000</code> — Requiere JWT</p>
            <div className="cards-grid">
                <GetProfileForm />
                <UpdateProfileForm />
            </div>
        </div>
    );
}
