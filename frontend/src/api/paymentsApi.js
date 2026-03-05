const BASE = "http://localhost:8001/api/v1";

export async function registerCard(data) {
    const res = await fetch(`${BASE}/cards/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function verifyCard(data) {
    const res = await fetch(`${BASE}/cards/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function processPayment(data) {
    const res = await fetch(`${BASE}/cards/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function topUpCard(data) {
    const res = await fetch(`${BASE}/cards/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return { status: res.status, data: await res.json() };
}

export async function getCardDetails(cardNumber) {
    const res = await fetch(`${BASE}/cards/${cardNumber}`);
    return { status: res.status, data: await res.json() };
}
