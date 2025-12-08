import React, { useEffect, useState } from "react";
import type { AuthUser } from "./types";
import { clearToken, getToken, setApiBaseUrl } from "./api";
import AuthPanel from "./components/AuthPanel";
import CodesPanel from "./components/CodesPanel";

interface Props {
    apiBaseUrl: string;
}

const WidgetRoot: React.FC<Props> = ({ apiBaseUrl }) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        setApiBaseUrl(apiBaseUrl);
        // теоретически можно добавить запрос /me, чтобы восстановить user по токену —
        // пока просто считаем, что если токен есть, то user "есть"
        if (getToken()) {
            // можно сделать маленький "мок" user, но лучше оставить так:
            setUser({ id: 0, email: "user", role: "USER" });
        }
    }, [apiBaseUrl]);

    const handleLogout = () => {
        clearToken();
        setUser(null);
    };

    const handleAuthenticated = (u: AuthUser) => {
        setUser(u);
    };

    return (
        <div className="ag-widget">
            <div className="ag-widget-header">
                <div>
                    <div className="ag-brand">ArsGora</div>
                    <div className="ag-brand-sub">Личный кабинет подъёмника</div>
                </div>
                {user && (
                    <div className="ag-user">
                        <span className="ag-user-email">{user.email}</span>
                        <button
                            type="button"
                            className="ag-btn ag-btn--ghost ag-btn--sm"
                            onClick={handleLogout}
                        >
                            Выйти
                        </button>
                    </div>
                )}
            </div>

            {!user && <AuthPanel onAuthenticated={handleAuthenticated} />}

            {user && <CodesPanel />}

            <div className="ag-powered">
                Powered by{" "}
                <a href="https://e-rma.ru/" target="_blank" rel="noreferrer">
                    RMA
                </a>
            </div>
        </div>
    );
};

export default WidgetRoot;
