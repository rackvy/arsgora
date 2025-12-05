import React, { useEffect, useState } from "react";
import { fetchCodes, uploadExcel } from "../api";
import type { LiftCodeAdminView } from "../types";

const CodesPage: React.FC = () => {
    const [codes, setCodes] = useState<LiftCodeAdminView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [batchName, setBatchName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploadInfo, setUploadInfo] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const loadCodes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCodes();
            setCodes(data);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки кодов");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCodes();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploadInfo(null);
        setError(null);

        if (!batchName.trim()) {
            setError("Укажите название партии");
            return;
        }
        if (!file) {
            setError("Выберите Excel-файл");
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadExcel(batchName.trim(), file);
            setUploadInfo(
                `Импортировано ${result.codesCount} кодов (партия #${result.id})`
            );
            setBatchName("");
            setFile(null);
            await loadCodes();
        } catch (err: any) {
            setError(err.message || "Ошибка импорта");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <h2 className="page-title">Коды подъёмника</h2>
            <p className="page-subtitle">
                Управление кодами, назначение их пользователям и импорт из Excel.
            </p>

            {error && <div className="form-error">{error}</div>}

            <div className="codes-layout">
                <section className="card">
                    <div className="card__header">
                        <div>
                            <div className="card__title">Импорт кодов из Excel</div>
                            <div className="card__subtitle">
                                Первый столбец файла — значение кода. Первая строка может быть
                                заголовком (code / код).
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpload}>
                        <div className="form-group">
                            <label className="form-label">
                                Название партии
                                <input
                                    className="input"
                                    type="text"
                                    value={batchName}
                                    onChange={(e) => setBatchName(e.target.value)}
                                    placeholder="Например: Январь 2026"
                                />
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Excel-файл (.xlsx, .xls)
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    style={{ marginTop: 4 }}
                                />
                            </label>
                        </div>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={isUploading}
                        >
                            {isUploading ? "Импорт..." : "Импортировать"}
                        </button>
                        {uploadInfo && (
                            <div
                                style={{
                                    marginTop: 10,
                                    fontSize: 13,
                                    color: "#047857",
                                    backgroundColor: "#d1fae5",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                }}
                            >
                                {uploadInfo}
                            </div>
                        )}
                    </form>
                </section>

                <section className="card">
                    <div className="card__header">
                        <div>
                            <div className="card__title">Все коды</div>
                            <div className="card__subtitle">
                                Всего: {codes.length.toString()}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={loadCodes}
                            disabled={isLoading}
                        >
                            Обновить
                        </button>
                    </div>

                    {isLoading ? (
                        <div>Загрузка кодов...</div>
                    ) : (
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Код</th>
                                <th>Статус</th>
                                <th>Владелец</th>
                                <th>Партия</th>
                                <th>Куплен</th>
                                <th>Использован</th>
                            </tr>
                            </thead>
                            <tbody>
                            {codes.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td style={{ fontFamily: "monospace" }}>{c.code}</td>
                                    <td>
                                        {c.status === "AVAILABLE" && (
                                            <span className="badge">AVAILABLE</span>
                                        )}
                                        {c.status === "SOLD" && (
                                            <span className="badge badge-success">SOLD</span>
                                        )}
                                        {c.status === "USED" && (
                                            <span className="badge badge-danger">USED</span>
                                        )}
                                        {c.status === "BLOCKED" && (
                                            <span className="badge badge-danger">BLOCKED</span>
                                        )}
                                    </td>
                                    <td>
                                        {c.ownerEmail ? `${c.ownerEmail} (id ${c.ownerId})` : "—"}
                                    </td>
                                    <td>{c.batchId ?? "—"}</td>
                                    <td>
                                        {c.purchasedAt
                                            ? new Date(c.purchasedAt).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td>
                                        {c.usedAt
                                            ? new Date(c.usedAt).toLocaleString()
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CodesPage;
