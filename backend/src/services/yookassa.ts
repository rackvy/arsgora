import axios from "axios";

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

if (!SHOP_ID || !SECRET_KEY) {
    console.warn(
        "[YooKassa] SHOP_ID or SECRET_KEY is not set. Payments will not work."
    );
}

const api = axios.create({
    baseURL: "https://api.yookassa.ru/v3",
    auth: {
        username: SHOP_ID || "",
        password: SECRET_KEY || "",
    },
    headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": "", // будем задавать на каждый запрос
    },
});

export interface CreatePaymentParams {
    amount: number; // в рублях
    description: string;
    returnUrl: string;
    metadata?: Record<string, any>;
}

export async function createYooPayment(params: CreatePaymentParams) {
    if (!SHOP_ID || !SECRET_KEY) {
        throw new Error("YooKassa credentials are not configured");
    }

    const idempotenceKey = `${Date.now()}-${Math.random()}`;

    const response = await api.post(
        "/payments",
        {
            amount: {
                value: params.amount.toFixed(2),
                currency: "RUB",
            },
            confirmation: {
                type: "redirect",
                return_url: params.returnUrl,
            },
            capture: true,
            description: params.description,
            metadata: params.metadata || {},
        },
        {
            headers: {
                "Idempotence-Key": idempotenceKey,
            },
        }
    );

    return response.data;
}
