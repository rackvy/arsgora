import type {AuthResponse, LiftCodeAdminView, User} from "./types";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export function getAuthToken(): string | null {
    return localStorage.getItem("arsgora_admin_token");
}

export function setAuthToken(token: string): void {
    localStorage.setItem("arsgora_admin_token", token);
}

export function clearAuthToken(): void {
    localStorage.removeItem("arsgora_admin_token");
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
        const token = getAuthToken();
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
            if (data && typeof data.error === "string") {
                message = data.error;
            }
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    return (await response.json()) as T;
}

export function login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({ email, password }),
        },
        false
    );
}

export function fetchUsers(): Promise<User[]> {
    return request<User[]>("/admin/users");
}

export function fetchCodes(): Promise<LiftCodeAdminView[]> {
    return request<LiftCodeAdminView[]>("/admin/codes");
}

export async function uploadExcel(
    batchName: string,
    file: File
): Promise<{
    id: number;
    name: string;
    uploadedAt: string;
    codesCount: number;
}> {
    const token = getAuthToken();
    if (!token) {
        throw new Error("Not authenticated");
    }

    const formData = new FormData();
    formData.append("batchName", batchName);
    formData.append("file", file);

    const url = `${API_BASE_URL}/admin/code-batches/upload-excel`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        let message = `Upload failed with status ${response.status}`;
        try {
            const data = await response.json();
            if (data && typeof data.error === "string") {
                message = data.error;
            }
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    return (await response.json()) as {
        id: number;
        name: string;
        uploadedAt: string;
        codesCount: number;
    };
}
