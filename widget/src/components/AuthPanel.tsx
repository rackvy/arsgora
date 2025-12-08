import React, { useState } from "react";
import type { AuthUser } from "../types";
import { login, setToken, widgetRegister, widgetVerify } from "../api";

interface Props {
    onAuthenticated: (user: AuthUser) => void;
}

const AuthPanel: React.FC<Props> = ({ onAuthenticated }) => {
    const [mode, setMode] = useState<"login" | "register">("login");

    // login
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // register
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regPassword2, setRegPassword2] = useState("");
    const [regStep, setRegStep] = useState<"form" | "code">("form");
    const [regUserId, setRegUserId] = useState<number | null>(null);
    const [regCode, setRegCode] = useState("");
    const [devCode, setDevCode] = useState<string | null>(null); // для dev

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const email = loginEmail.trim().toLowerCase();
        const password = loginPassword;

        if (!email || !password) {
            setError("Введите email и пароль");
            return;
        }

        setLoading(true);
        try {
            const res = await login(email, password);
            setToken(res.token);
            onAuthenticated(res.user);
        } catch (err: any) {
            setError(err.message || "Ошибка входа");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setDevCode(null);

        const email = regEmail.trim().toLowerCase();
        const password = regPassword;

        if (!email || !password || !regPassword2) {
            setError("Заполните все поля");
            return;
        }
        if (password !== regPassword2) {
            setError("Пароли не совпадают");
            return;
        }

        setLoading(true);
        try {
            const res = await widgetRegister(email, password);
            setRegUserId(res.userId);
            setRegStep("code");
            if (res.devCode) {
                setDevCode(res.devCode); // для дев-режима, можно подсказать код
            }
        } catch (err: any) {
            setError(err.message || "Ошибка регистрации");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!regUserId) {
            setError("Ошибка шага регистрации, попробуйте ещё раз");
            setRegStep("form");
            return;
        }

        const code = regCode.trim();
        if (!code) {
            setError("Введите код подтверждения");
            return;
        }

        setLoading(true);
        try {
            const res = await widgetVerify(regUserId, code);
            setToken(res.token);
            onAuthenticated(res.user);
        } catch (err: any) {
            setError(err.message || "Ошибка подтверждения кода");
        } finally {
            setLoading(false);
        }
    };

    const resetRegister = () => {
        setRegStep("form");
        setRegUserId(null);
        setRegCode("");
        setDevCode(null);
        setError(null);
    };

    return (
        <div className="ag-card">
            <div className="ag-tabs">
                <button
                    type="button"
                    className={
                        "ag-tab" + (mode === "login" ? " ag-tab--active" : "")
                    }
                    onClick={() => {
                        setMode("login");
                        setError(null);
                    }}
                >
                    Вход
                </button>
                <button
                    type="button"
                    className={
                        "ag-tab" + (mode === "register" ? " ag-tab--active" : "")
                    }
                    onClick={() => {
                        setMode("register");
                        setError(null);
                    }}
                >
                    Регистрация
                </button>
            </div>

            {mode === "login" && (
                <form onSubmit={handleLogin} className="ag-form">
                    <div className="ag-form-group">
                        <label className="ag-label">
                            Email
                            <input
                                className="ag-input"
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />
                        </label>
                    </div>
                    <div className="ag-form-group">
                        <label className="ag-label">
                            Пароль
                            <input
                                className="ag-input"
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />
                        </label>
                    </div>
                    {error && <div className="ag-error">{error}</div>}
                    <button
                        className="ag-btn ag-btn--primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Вход..." : "Войти"}
                    </button>
                </form>
            )}

            {mode === "register" && (
                <>
                    {regStep === "form" && (
                        <form onSubmit={handleRegisterStep1} className="ag-form">
                            <div className="ag-form-group">
                                <label className="ag-label">
                                    Email
                                    <input
                                        className="ag-input"
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">
                                    Пароль
                                    <input
                                        className="ag-input"
                                        type="password"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">
                                    Повторите пароль
                                    <input
                                        className="ag-input"
                                        type="password"
                                        value={regPassword2}
                                        onChange={(e) => setRegPassword2(e.target.value)}
                                    />
                                </label>
                            </div>
                            {error && <div className="ag-error">{error}</div>}
                            <button
                                className="ag-btn ag-btn--primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Отправка кода..." : "Зарегистрироваться"}
                            </button>
                        </form>
                    )}

                    {regStep === "code" && (
                        <form onSubmit={handleRegisterStep2} className="ag-form">
                            <div className="ag-form-group">
                                <label className="ag-label">
                                    Код подтверждения
                                    <input
                                        className="ag-input"
                                        type="text"
                                        value={regCode}
                                        onChange={(e) => setRegCode(e.target.value)}
                                        placeholder="6 цифр из письма"
                                    />
                                </label>
                            </div>
                            {devCode && (
                                <div className="ag-dev-tip">
                                    Для теста: код <strong>{devCode}</strong>
                                </div>
                            )}
                            {error && <div className="ag-error">{error}</div>}
                            <div className="ag-form-actions">
                                <button
                                    type="button"
                                    className="ag-btn ag-btn--ghost"
                                    onClick={resetRegister}
                                    disabled={loading}
                                >
                                    Назад
                                </button>
                                <button
                                    className="ag-btn ag-btn--primary"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Проверка..." : "Подтвердить email"}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default AuthPanel;
