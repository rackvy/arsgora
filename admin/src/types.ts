export interface User {
    id: number;
    email: string;
    role: "USER" | "ADMIN";
    createdAt?: string;
}

export type CodeStatus = "AVAILABLE" | "SOLD" | "USED" | "BLOCKED";

export interface LiftCodeAdminView {
    id: number;
    code: string;
    status: CodeStatus;
    ownerId: number | null;
    ownerEmail: string | null;
    batchId: number | null;
    price: number | null;
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
