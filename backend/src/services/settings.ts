import { prisma } from "../prisma";

export async function getCodePriceRub(): Promise<number> {
    const s = await prisma.appSetting.findUnique({
        where: { key: "CODE_PRICE_RUB" },
    });

    const value = s?.value ? Number(s.value) : NaN;
    if (!Number.isFinite(value) || value <= 0) return 500;

    return Math.round(value);
}

export async function setCodePriceRub(price: number): Promise<void> {
    const v = Math.round(price);
    if (!Number.isFinite(v) || v <= 0) throw new Error("Invalid price");

    await prisma.appSetting.upsert({
        where: { key: "CODE_PRICE_RUB" },
        update: { value: String(v) },
        create: { key: "CODE_PRICE_RUB", value: String(v) },
    });
}
