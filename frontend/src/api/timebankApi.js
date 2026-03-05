const BASE = "http://localhost:8000/api/v1";

export async function registerUser(data) {
    const res = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function loginUser(data) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function logoutUser() {
    const res = await fetch(`${BASE}/auth/logout`, { method: "POST" });
    return { status: res.status, data: await res.json() };
}

export async function getProfile(token) {
    const res = await fetch(`${BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function updateProfile(token, data) {
    const res = await fetch(`${BASE}/users/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}
