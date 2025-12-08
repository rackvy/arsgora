import React, { useEffect, useState } from "react";
import type { LiftCode } from "../types";
import { fetchMyCodes, markCodeUsed, purchaseCodes } from "../api";
import { QRCodeCanvas } from "qrcode.react";

type Filter = "all" | "unused";

const CodesPanel: React.FC = () => {
    const [codes, setCodes] = useState<LiftCode[]>([]);
    const [filter, setFilter] = useState<Filter>("unused");
    const [loading, setLoading] = useState(true);
    const [buyCount, setBuyCount] = useState(1);
    const [buyLoading, setBuyLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [qrModalCode, setQrModalCode] = useState<LiftCode | null>(null);
    const [qrMarkLoading, setQrMarkLoading] = useState(false);

    const loadCodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const status = filter === "unused" ? "unused" : "all";
            const data = await fetchMyCodes(status);
            setCodes(data);
        } catch (err: any) {
            setError(err.message || "Ошибка загрузки кодов");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleBuy = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const count = Number(buyCount);
        if (!count || count <= 0) {
            setError("Укажите количество кодов");
            return;
        }

        setBuyLoading(true);
        try {
            // имитация эквайринга — ждём 2 секунды
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const newCodes = await purchaseCodes(count);
            setCodes((prev) => [...newCodes, ...prev]);
        } catch (err: any) {
            setError(err.message || "Ошибка покупки кодов");
        } finally {
            setBuyLoading(false);
        }
    };

    const handleMarkUsed = async (code: LiftCode) => {
        setQrMarkLoading(true);
        setError(null);
        try {
            const updated = await markCodeUsed(code.id);
            setCodes((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
            setQrModalCode(null);
            // если сейчас фильтр "unused", обновим список
            if (filter === "unused") {
                await loadCodes();
            }
        } catch (err: any) {
            setError(err.message || "Ошибка обновления статуса кода");
        } finally {
            setQrMarkLoading(false);
        }
    };

    const visibleCodes = codes;

    return (
        <div className="ag-codes">
            <div className="ag-codes-top">
                <div>
                    <h3 className="ag-title">Мои коды</h3>
                    <p className="ag-subtitle">
                        Здесь отображаются все ваши покупки и действующие QR-коды.
                    </p>
                </div>
                <div className="ag-filter">
                    <button
                        type="button"
                        className={
                            "ag-filter-btn" + (filter === "unused" ? " ag-filter-btn--active" : "")
                        }
                        onClick={() => setFilter("unused")}
                    >
                        Только неиспользованные
                    </button>
                    <button
                        type="button"
                        className={
                            "ag-filter-btn" + (filter === "all" ? " ag-filter-btn--active" : "")
                        }
                        onClick={() => setFilter("all")}
                    >
                        Все
                    </button>
                </div>
            </div>

            <div className="ag-layout">
                <div className="ag-card">
                    <h4 className="ag-card-title">Покупка кодов</h4>
                    <p className="ag-subtitle">
                        Выберите количество кодов и нажмите &laquo;Оплатить&raquo;. Оплату
                        мы пока имитируем, сразу выдаём коды.
                    </p>
                    <form onSubmit={handleBuy} className="ag-buy-form">
                        <label className="ag-label">
                            Количество
                            <input
                                className="ag-input"
                                type="number"
                                min={1}
                                value={buyCount}
                                onChange={(e) => setBuyCount(Number(e.target.value))}
                            />
                        </label>
                        <button
                            type="submit"
                            className="ag-btn ag-btn--primary"
                            disabled={buyLoading}
                        >
                            {buyLoading ? "Обработка..." : "Оплатить"}
                        </button>
                    </form>
                </div>

                <div className="ag-card">
                    <h4 className="ag-card-title">
                        Список кодов ({visibleCodes.length})
                    </h4>
                    {loading && <div>Загрузка...</div>}
                    {error && <div className="ag-error">{error}</div>}
                    {!loading && visibleCodes.length === 0 && (
                        <div className="ag-empty">Кодов пока нет</div>
                    )}
                    {!loading && visibleCodes.length > 0 && (
                        <div className="ag-codes-list">
                            {visibleCodes.map((code) => (
                                <div
                                    key={code.id}
                                    className={
                                        "ag-code-item" +
                                        (code.status === "USED" ? " ag-code-item--used" : "")
                                    }
                                >
                                    <div className="ag-code-main">
                                        <div className="ag-code-label">Код #{code.id}</div>
                                        <div className="ag-code-value">{code.code}</div>
                                    </div>
                                    <div className="ag-code-meta">
                                        <div>
                      <span className="ag-badge">
                        {code.status === "SOLD"
                            ? "Не использован"
                            : code.status === "USED"
                                ? "Использован"
                                : code.status}
                      </span>
                                        </div>
                                        <div className="ag-code-dates">
                                            {code.purchasedAt && (
                                                <span>
                          Куплен:{" "}
                                                    {new Date(code.purchasedAt).toLocaleString()}
                        </span>
                                            )}
                                            {code.usedAt && (
                                                <span>
                          Использован:{" "}
                                                    {new Date(code.usedAt).toLocaleString()}
                        </span>
                                            )}
                                        </div>
                                        <div className="ag-code-actions">
                                            {code.status === "SOLD" && (
                                                <button
                                                    type="button"
                                                    className="ag-btn ag-btn--ghost"
                                                    onClick={() => setQrModalCode(code)}
                                                >
                                                    Показать QR
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {qrModalCode && (
                <div className="ag-modal-backdrop" onClick={() => setQrModalCode(null)}>
                    <div
                        className="ag-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="ag-card-title">QR-код</h4>
                        <p className="ag-subtitle">
                            Покажите этот код контролёру на подъёмнике. После прохода отметьте
                            его как использованный.
                        </p>
                        <div className="ag-qr">
                            <QRCodeCanvas value={qrModalCode.code} size={180} />
                            <div className="ag-qr-value">{qrModalCode.code}</div>
                        </div>
                        <div className="ag-form-actions">
                            <button
                                type="button"
                                className="ag-btn ag-btn--ghost"
                                onClick={() => setQrModalCode(null)}
                                disabled={qrMarkLoading}
                            >
                                Закрыть
                            </button>
                            <button
                                type="button"
                                className="ag-btn ag-btn--primary"
                                onClick={() => handleMarkUsed(qrModalCode)}
                                disabled={qrMarkLoading}
                            >
                                {qrMarkLoading ? "Сохранение..." : "Отметить как использованный"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodesPanel;
