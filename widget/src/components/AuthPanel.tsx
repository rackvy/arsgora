import React, { useMemo, useState } from "react";
import type { AuthUser } from "../types";
import {
    setToken,
    widgetLogin,
    widgetRegister,
    widgetVerify,
    widgetResendCode,
} from "../api";

interface Props {
    onAuthenticated: (user: AuthUser) => void;
}

const CODE_TTL_SECONDS = 10 * 60;

function formatSeconds(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // resend
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldownUntil, setResendCooldownUntil] = useState<number>(0);
    const [sentAt, setSentAt] = useState<number>(0); // для таймера "код действует 10 минут"

    const cooldownLeft = useMemo(() => {
        const now = Date.now();
        if (!resendCooldownUntil) return 0;
        const leftMs = resendCooldownUntil - now;
        return leftMs > 0 ? Math.ceil(leftMs / 1000) : 0;
    }, [resendCooldownUntil, loading, resendLoading, sentAt]);

    const codeTtlLeft = useMemo(() => {
        if (!sentAt) return CODE_TTL_SECONDS;
        const passed = Math.floor((Date.now() - sentAt) / 1000);
        const left = CODE_TTL_SECONDS - passed;
        return left > 0 ? left : 0;
    }, [sentAt, loading, resendLoading, resendCooldownUntil]);

    const normalizeEmail = (value: string) => value.trim().toLowerCase();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const email = normalizeEmail(loginEmail);
        const password = loginPassword;

        if (!email || !password) {
            setError("Введите email и пароль");
            return;
        }

        setLoading(true);
        try {
            const res = await widgetLogin(email, password);

            // Если email не подтвержден — бэк вернет needsVerification
            if (res.needsVerification) {
                setMode("register");
                setRegStep("code");
                setRegUserId(res.userId);
                setRegEmail(email);
                setSentAt(Date.now());
                setResendCooldownUntil(Date.now() + 30_000);
                setError("Email не подтверждён. Мы отправили новый код на почту.");
                return;
            }

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

        const email = normalizeEmail(regEmail);
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

            // запускаем таймер “код действует 10 минут”
            setSentAt(Date.now());

            // антиспам на ресенд (30 сек)
            setResendCooldownUntil(Date.now() + 30_000);
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

    const handleResend = async () => {
        setError(null);

        const email = normalizeEmail(regEmail);
        if (!email) {
            setError("Введите email");
            setRegStep("form");
            return;
        }

        if (cooldownLeft > 0) return;

        setResendLoading(true);
        try {
            await widgetResendCode(email);

            setSentAt(Date.now());
            setResendCooldownUntil(Date.now() + 30_000);
        } catch (err: any) {
            setError(err.message || "Не удалось отправить код");
        } finally {
            setResendLoading(false);
        }
    };

    const resetRegister = () => {
        setRegStep("form");
        setRegUserId(null);
        setRegCode("");
        setSentAt(0);
        setResendCooldownUntil(0);
        setError(null);
    };

    return (
        <div className="ag-card">
            <div className="ag-tabs">
                <button
                    type="button"
                    className={"ag-tab" + (mode === "login" ? " ag-tab--active" : "")}
                    onClick={() => {
                        setMode("login");
                        setError(null);
                    }}
                >
                    Вход
                </button>
                <button
                    type="button"
                    className={"ag-tab" + (mode === "register" ? " ag-tab--active" : "")}
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
                                autoComplete="email"
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
                                autoComplete="current-password"
                            />
                        </label>
                    </div>
                    {error && <div className="ag-error">{error}</div>}
                    <button className="ag-btn ag-btn--primary" type="submit" disabled={loading}>
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
                                        autoComplete="email"
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
                                        autoComplete="new-password"
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
                                        autoComplete="new-password"
                                    />
                                </label>
                            </div>
                            {error && <div className="ag-error">{error}</div>}
                            <button className="ag-btn ag-btn--primary" type="submit" disabled={loading}>
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
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                    />
                                </label>
                                <div className="ag-hint">
                                    Код действует: <strong>{formatSeconds(codeTtlLeft)}</strong>
                                </div>
                            </div>

                            <div className="ag-form-group">
                                <button
                                    type="button"
                                    className="ag-btn ag-btn--ghost"
                                    onClick={handleResend}
                                    disabled={resendLoading || cooldownLeft > 0 || loading}
                                >
                                    {resendLoading
                                        ? "Отправляем..."
                                        : cooldownLeft > 0
                                            ? `Отправить ещё раз через ${cooldownLeft}с`
                                            : "Отправить код ещё раз"}
                                </button>
                            </div>

                            {error && <div className="ag-error">{error}</div>}

                            <div className="ag-form-actions">
                                <button
                                    type="button"
                                    className="ag-btn ag-btn--ghost"
                                    onClick={resetRegister}
                                    disabled={loading || resendLoading}
                                >
                                    Назад
                                </button>
                                <button className="ag-btn ag-btn--primary" type="submit" disabled={loading}>
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
