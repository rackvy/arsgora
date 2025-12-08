import type { AuthResponse, LiftCode } from "./types";

let API_BASE_URL = "http://localhost:4000/api";

export function setApiBaseUrl(url: string) {
    API_BASE_URL = url.replace(/\/+$/, "");
}

const TOKEN_KEY = "arsgora_widget_token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    auth: boolean = true
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const headers: HeadersInit = {
        ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
        // @ts-ignore
        headers["Content-Type"] = "application/json";
    }

    if (auth) {
        const token = getToken();
        if (token) {
            // @ts-ignore
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const data = await response.json();
            if (data && typeof (data as any).error === "string") {
                message = (data as any).error;
            }
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    return (await response.json()) as T;
}

// ====== auth для виджета ======

export function widgetRegister(email: string, password: string) {
    return request<{ ok: true; userId: number; email: string; devCode?: string; expiresAt: string }>(
        "/auth/widget/register",
        {
            method: "POST",
            body: JSON.stringify({ email, password }),
        },
        false
    );
}

export function widgetVerify(userId: number, code: string) {
    return request<AuthResponse>(
        "/auth/widget/verify",
        {
            method: "POST",
            body: JSON.stringify({ userId, code }),
        },
        false
    );
}

export function login(email: string, password: string) {
    return request<AuthResponse>(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({ email, password }),
        },
        false
    );
}

// ====== коды ======

export function fetchMyCodes(status: "all" | "unused" | "used" = "all") {
    const query = status === "all" ? "" : `?status=${status}`;
    return request<LiftCode[]>(`/me/codes${query}`);
}

export function markCodeUsed(id: number) {
    return request<LiftCode>(`/me/codes/${id}/use`, {
        method: "POST",
    });
}

export function purchaseCodes(count: number) {
    return request<LiftCode[]>(
        "/codes/purchase",
        {
            method: "POST",
            body: JSON.stringify({ count }),
        },
        true
    );
}
