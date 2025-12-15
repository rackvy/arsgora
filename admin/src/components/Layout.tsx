import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isUsers = location.pathname.startsWith("/users");
    const isCodes = location.pathname.startsWith("/codes");
    const isSettings = location.pathname.startsWith("/settings");

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-mark">
                        <span>AG</span>
                    </div>
                    <div className="sidebar__logo-text">
                        <span className="sidebar__logo-main">ArsGora</span>
                        <span className="sidebar__logo-sub">Панель администратора</span>
                    </div>
                </div>

                <div className="sidebar__nav">
                    <div className="sidebar__nav-section-title">Навигация</div>
                    <Link
                        to="/users"
                        className={
                            "sidebar__link" + (isUsers ? " sidebar__link--active" : "")
                        }
                    >
                        <span>Пользователи</span>
                        {/*<span className="sidebar__link-pill">Users</span>*/}
                    </Link>
                    <Link
                        to="/codes"
                        className={
                            "sidebar__link" + (isCodes ? " sidebar__link--active" : "")
                        }
                    >
                        <span>Коды подъёмника</span>
                        {/*<span className="sidebar__link-pill">Codes</span>*/}
                    </Link>
                    <Link
                        to="/settings"
                        className={
                            "sidebar__link" + (isSettings ? " sidebar__link--active" : "")
                        }
                    >
                        <span>Настройки</span>
                        {/*<span className="sidebar__link-pill">Codes</span>*/}
                    </Link>
                </div>

                <div className="sidebar__footer">
                    {user && (
                        <div className="sidebar__footer-row">
                            <div>
                                <div className="sidebar__user-role">
                                    {user.role === "ADMIN" ? "Главный администратор" : "Пользователь"}
                                </div>
                                <div className="sidebar__user-email">{user.email}</div>
                            </div>
                            <button
                                className="sidebar__logout-btn"
                                type="button"
                                onClick={logout}
                            >
                                Выйти
                            </button>
                        </div>
                    )}

                    <div className="sidebar__powered">
                        <span>Powered by RMA</span>
                        <a href="https://e-rma.ru/" target="_blank" rel="noreferrer">
                            e-rma.ru
                        </a>
                    </div>
                </div>
            </aside>

            <div className="main">
                <header className="main__header">
                    <div className="main__header-title">
                        <h1>ArsGora Admin</h1>
                        <span>Управление пользователями и кодами подъёмника</span>
                    </div>
                    <div className="main__header-meta">
                        {/*isCodes ? "Раздел: Коды" : "Раздел: Пользователи"*/}
                    </div>
                </header>
                <main className="main__content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
