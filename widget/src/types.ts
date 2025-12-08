export type CodeStatus = "AVAILABLE" | "SOLD" | "USED" | "BLOCKED";

export interface LiftCode {
    id: number;
    code: string;
    status: CodeStatus;
    purchasedAt: string | null;
    usedAt: string | null;
}

export interface AuthUser {
    id: number;
    email: string;
    role: "USER" | "ADMIN";
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface WidgetConfig {
    apiBaseUrl: string;
    containerId?: string;
}
