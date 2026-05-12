const BASE = "/api/v1";

export async function registerUser(data) {
    const res = await fetch(`${BASE}/auth/register`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function loginUser(data) {
    const res = await fetch(`${BASE}/auth/login`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function logoutUser() {
    const res = await fetch(`${BASE}/auth/logout`, {
        credentials: "include", method: "POST" });
    return { status: res.status, data: await res.json() };
}

export async function getProfile() {
    const res = await fetch(`${BASE}/users/me`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function updateProfile(data) {
    const res = await fetch(`${BASE}/users/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

// --- Admin Management ---
export async function getUsers() {
    const res = await fetch(`${BASE}/users/`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function getUserById(id) {
    const res = await fetch(`${BASE}/users/${id}`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function updateUserAdmin(id, data) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function deleteUserAdmin(id) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

// --- Services ---
export async function createService(data) {
    const res = await fetch(`${BASE}/services/`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getServices(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set("category", params.category);
    if (params.keyword) searchParams.set("keyword", params.keyword);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.page_size) searchParams.set("page_size", String(params.page_size));

    const query = searchParams.toString();
    const url = query ? `${BASE}/services/?${query}` : `${BASE}/services/`;
    const res = await fetch(url);
    return { status: res.status, data: await res.json() };
}

export async function getMyServices() {
    const res = await fetch(`${BASE}/services/me`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function getServiceById(id) {
    const res = await fetch(`${BASE}/services/${id}`);
    return { status: res.status, data: await res.json() };
}

export async function updateService(id, data) {
    const res = await fetch(`${BASE}/services/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function deleteService(id) {
    const res = await fetch(`${BASE}/services/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

// --- Service Requests ---
export async function createRequest(data) {
    const res = await fetch(`${BASE}/requests/`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getIncomingRequests() {
    const res = await fetch(`${BASE}/requests/incoming`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function getOutgoingRequests() {
    const res = await fetch(`${BASE}/requests/outgoing`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function updateRequestStatus(id, action) {
    const res = await fetch(`${BASE}/requests/${id}/${action}`, {
        method: "PATCH",
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

// --- Transactions ---
export async function getTransactions() {
    const res = await fetch(`${BASE}/transactions/`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function getBalance() {
    const res = await fetch(`${BASE}/transactions/balance`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function purchaseCredits(data) {
    const res = await fetch(`${BASE}/transactions/purchase`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function transferCredits(data) {
    const res = await fetch(`${BASE}/transactions/transfer`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function reviewRequest(id, data) {
    const res = await fetch(`${BASE}/requests/${id}/review`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getAllServicesAdmin(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set("category", params.category);
    if (params.keyword) searchParams.set("keyword", params.keyword);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.page_size) searchParams.set("page_size", String(params.page_size));

    const query = searchParams.toString();
    const url = query ? `${BASE}/services/all?${query}` : `${BASE}/services/all`;
    const res = await fetch(url, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function updateServiceAdmin(id, data) {
    const res = await fetch(`${BASE}/services/${id}/admin`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function deleteServiceAdmin(id) {
    const res = await fetch(`${BASE}/services/${id}/admin`, {
        method: "DELETE",
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function getAllTransactionsAdmin() {
    const res = await fetch(`${BASE}/transactions/all`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function forgotPassword(data) {
    const res = await fetch(`${BASE}/auth/forgot-password`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function resetPassword(data) {
    const res = await fetch(`${BASE}/auth/reset-password`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getRequestMessages(id) {
    const res = await fetch(`${BASE}/requests/${id}/messages`, {
        credentials: "include",
    });
    return { status: res.status, data: await res.json() };
}

export async function sendRequestMessage(id, data) {
    const res = await fetch(`${BASE}/requests/${id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}
