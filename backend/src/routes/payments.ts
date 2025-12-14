import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createYooPayment } from "../services/yookassa";

const router = Router();

// TO-DO: Цена одного кода (пока захардкодим, потом можно вынести в настройки)
const CODE_PRICE_RUB = 500; // например, 500 ₽ за код

// POST /api/payments/yookassa/create
router.post("/yookassa/create", authMiddleware, async (req: any, res, next) => {
    try {
        const userId = req.userId as number;
        const { count } = req.body as { count?: number };

        const codesCount = Number(count) || 1;
        if (codesCount <= 0) {
            return res.status(400).json({ error: "Invalid codes count" });
        }

        const amountRub = CODE_PRICE_RUB * codesCount;

        // создаём запись платежа в нашей БД
        const payment = await prisma.payment.create({
            data: {
                userId,
                provider: "yookassa",
                providerId: "", // заполним после ответа
                amount: amountRub * 100, // в копейках
                currency: "RUB",
                status: "pending",
                codesCount,
            },
        });

        const returnUrl =
            process.env.WIDGET_RETURN_URL ||
            "https://primorye-tour-widget.e-rma.ru/#/payment-return";

        const yoo = await createYooPayment({
            amount: amountRub,
            description: `Покупка ${codesCount} код(ов) ArsGora`,
            returnUrl,
            metadata: {
                ourPaymentId: payment.id,
                userId,
            },
        });

        // обновляем providerId
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                providerId: yoo.id,
            },
        });

        return res.json({
            paymentId: payment.id,
            providerPaymentId: yoo.id,
            confirmationUrl: yoo.confirmation?.confirmation_url,
            status: yoo.status,
        });
    } catch (err) {
        next(err);
    }
});

// Webhook от YooKassa
// POST /api/payments/yookassa/webhook
router.post("/yookassa/webhook", async (req, res, next) => {
    try {
        const event = req.body;

        if (!event || !event.object || !event.object.id) {
            return res.status(400).json({ error: "Invalid webhook payload" });
        }

        const paymentObject = event.object;
        const providerId = paymentObject.id;
        const status = paymentObject.status;

        // находим наш платеж
        const payment = await prisma.payment.findFirst({
            where: {
                provider: "yookassa",
                providerId,
            },
        });

        if (!payment) {
            console.warn("[YooKassa] Payment not found for providerId", providerId);
            return res.status(200).json({ ok: true });
        }

        // обновляем статус
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status },
        });

        // если платёж успешен, выдаём коды
        if (status === "succeeded") {
            const userId = payment.userId;

            // находим свободные коды
            const availableCodes = await prisma.liftCode.findMany({
                where: {
                    status: "AVAILABLE",
                    ownerId: null,
                },
                take: payment.codesCount,
            });

            if (availableCodes.length < payment.codesCount) {
                console.warn(
                    "[YooKassa] Not enough AVAILABLE codes for payment",
                    payment.id
                );
            }

            await Promise.all(
                availableCodes.map((code) =>
                    prisma.liftCode.update({
                        where: { id: code.id },
                        data: {
                            status: "SOLD",
                            ownerId: userId,
                            purchasedAt: new Date(),
                        },
                    })
                )
            );
        }

        // YooKassa ожидает 200
        return res.status(200).json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// (Опционально) Проверка статуса платежа нашим фронтом
// GET /api/payments/:id/status
router.get("/:id/status", authMiddleware, async (req: any, res, next) => {
    try {
        const id = Number(req.params.id);
        const userId = req.userId as number;

        const payment = await prisma.payment.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        return res.json({
            id: payment.id,
            status: payment.status,
            codesCount: payment.codesCount,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
