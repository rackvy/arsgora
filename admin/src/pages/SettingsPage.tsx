import React, { useEffect, useMemo, useState } from "react";
import { adminGetCodePrice, adminSetCodePrice } from "../api";

const SettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [priceRub, setPriceRub] = useState<number>(500);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const isValid = useMemo(() => Number.isFinite(priceRub) && priceRub > 0 && priceRub <= 1_000_000, [priceRub]);

    useEffect(() => {
        let alive = true;

        (async () => {
            setError(null);
            setOkMsg(null);
            setLoading(true);
            try {
                const res = await adminGetCodePrice();
                if (!alive) return;
                setPriceRub(Number(res.priceRub) || 500);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message || "Не удалось загрузить настройки");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setOkMsg(null);

        if (!isValid) {
            setError("Введите корректную цену (число > 0)");
            return;
        }

        setSaving(true);
        try {
            await adminSetCodePrice(Math.round(priceRub));
            setOkMsg("Сохранено");
        } catch (e: any) {
            setError(e?.message || "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ag-admin-page">
            <div className="ag-admin-header">
                <h1 className="ag-admin-title">Настройки</h1>
                <div className="ag-admin-subtitle">Управление параметрами сервиса</div>
            </div>

            <div className="ag-card">
                <div className="ag-card-title">Стоимость</div>

                {loading ? (
                    <div className="ag-muted">Загрузка...</div>
                ) : (
                    <form onSubmit={onSave} className="ag-form">
                        <div className="ag-form-group">
                            <label className="ag-label">
                                Цена за 1 код (₽)
                                <input
                                    className="ag-input"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={Number.isFinite(priceRub) ? priceRub : 0}
                                    onChange={(e) => setPriceRub(Number(e.target.value))}
                                />
                            </label>
                            <div className="ag-hint">
                                Эта цена используется при создании платежей (ЮKassa).
                            </div>
                        </div>

                        {error && <div className="ag-error">{error}</div>}
                        {okMsg && <div className="ag-success">{okMsg}</div>}

                        <div className="ag-form-actions">
                            <button className="ag-btn ag-btn--primary" type="submit" disabled={saving}>
                                {saving ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="ag-powered">
                Powered by <a href="https://e-rma.ru/" target="_blank" rel="noreferrer">RMA</a>
            </div>
        </div>
    );
};

export default SettingsPage;
