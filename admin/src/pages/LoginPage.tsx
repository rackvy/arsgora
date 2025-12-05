import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("password123");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate("/users", { replace: true });
        } catch (err: any) {
            setError(err.message || "Ошибка входа");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <div className="login-card__logo">
                    <div className="sidebar__logo-mark">
                        <span>AG</span>
                    </div>
                    <div>
                        <div className="login-card__title">ArsGora Admin</div>
                        <div className="login-card__subtitle">
                            Вход в панель управления кодами подъёмника
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Email
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Пароль
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>

                {error && <div className="form-error">{error}</div>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: 4 }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Вход..." : "Войти"}
                </button>

                <div
                    style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: "#9ca3af",
                        textAlign: "center",
                    }}
                >
                    Powered by{" "}
                    <a
                        href="https://e-rma.ru/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563eb", textDecoration: "none" }}
                    >
                        RMA
                    </a>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
