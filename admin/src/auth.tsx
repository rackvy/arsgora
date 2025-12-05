import React, { createContext, useContext, useEffect, useState } from "react";
import type {AuthUser} from "./types";
import { clearAuthToken, login as apiLogin, setAuthToken } from "./api";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "arsgora_admin_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                          children,
                                                                      }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser) as AuthUser;
                setUser(parsed);
            } catch {
                localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await apiLogin(email, password);
        setAuthToken(response.token);
        setUser(response.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    };

    const logout = () => {
        clearAuthToken();
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
