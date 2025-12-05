import React, { useEffect, useState } from "react";
import { fetchUsers } from "../api";
import type { User } from "../types";

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchUsers();
                setUsers(data);
            } catch (err: any) {
                setError(err.message || "Ошибка загрузки пользователей");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div>
            <h2 className="page-title">Пользователи</h2>
            <p className="page-subtitle">
                Список всех аккаунтов, имеющих доступ к ArsGora.
            </p>

            {isLoading && <div>Загрузка...</div>}
            {error && <div className="form-error">{error}</div>}

            {!isLoading && !error && (
                <div className="card">
                    <div className="card__header">
                        <div>
                            <div className="card__title">Все пользователи</div>
                            <div className="card__subtitle">
                                Всего: {users.length.toString()}
                            </div>
                        </div>
                    </div>

                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Дата создания</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.email}</td>
                                <td>
                                    {u.role === "ADMIN" ? (
                                        <span className="badge badge-success">ADMIN</span>
                                    ) : (
                                        <span className="badge">USER</span>
                                    )}
                                </td>
                                <td>
                                    {u.createdAt
                                        ? new Date(u.createdAt).toLocaleString()
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
