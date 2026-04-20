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

// --- Admin Management ---
export async function getUsers(token) {
    const res = await fetch(`${BASE}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function getUserById(token, id) {
    const res = await fetch(`${BASE}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function updateUserAdmin(token, id, data) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function deleteUserAdmin(token, id) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

// --- Services ---
export async function createService(token, data) {
    const res = await fetch(`${BASE}/services/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getServices() {
    const res = await fetch(`${BASE}/services/`);
    return { status: res.status, data: await res.json() };
}

export async function getMyServices(token) {
    const res = await fetch(`${BASE}/services/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function getServiceById(id) {
    const res = await fetch(`${BASE}/services/${id}`);
    return { status: res.status, data: await res.json() };
}

export async function updateService(token, id, data) {
    const res = await fetch(`${BASE}/services/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function deleteService(token, id) {
    const res = await fetch(`${BASE}/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

// --- Service Requests ---
export async function createRequest(token, data) {
    const res = await fetch(`${BASE}/requests/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getIncomingRequests(token) {
    const res = await fetch(`${BASE}/requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function getOutgoingRequests(token) {
    const res = await fetch(`${BASE}/requests/outgoing`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function updateRequestStatus(token, id, action) {
    const res = await fetch(`${BASE}/requests/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

// --- Transactions ---
export async function getTransactions(token) {
    const res = await fetch(`${BASE}/transactions/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function getBalance(token) {
    const res = await fetch(`${BASE}/transactions/balance`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return { status: res.status, data: await res.json() };
}

export async function purchaseCredits(token, data) {
    const res = await fetch(`${BASE}/transactions/purchase`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function transferCredits(token, data) {
    const res = await fetch(`${BASE}/transactions/transfer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

