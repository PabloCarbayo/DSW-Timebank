import { useState } from "react";

export default function ResponsePanel({ result }) {
    if (!result) return null;

    const isError = result.status >= 400;

    return (
        <div className={`response-panel ${isError ? "error" : "success"}`}>
            <div className="response-header">
                <span className="status-badge">{result.status}</span>
                <span className="status-text">{isError ? "Error" : "OK"}</span>
            </div>
            <pre className="response-body">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
    );
}

export function FormField({ label, type = "text", value, onChange, placeholder, required = true }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}
