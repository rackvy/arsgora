import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

/**
 * Купить N кодов (MVP без эквайринга).
 * body: { count?: number }
 */
router.post(
    "/purchase",
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const body = req.body as { count?: number };
            const requestedCount =
                typeof body.count === "number" && body.count > 0 ? body.count : 1;

            const availableCodes = await prisma.liftCode.findMany({
                where: { status: "AVAILABLE" },
                orderBy: { id: "asc" },
                take: requestedCount,
            });

            if (availableCodes.length < requestedCount) {
                return res.status(400).json({ error: "Not enough available codes" });
            }

            const updated = await Promise.all(
                availableCodes.map((code) =>
                    prisma.liftCode.update({
                        where: { id: code.id },
                        data: {
                            status: "SOLD",
                            ownerId: req.userId,
                            purchasedAt: new Date(),
                        },
                    })
                )
            );

            return res.json(
                updated.map((c) => ({
                    id: c.id,
                    code: c.code,
                    status: c.status,
                    purchasedAt: c.purchasedAt,
                    usedAt: c.usedAt,
                }))
            );
        } catch (err) {
            next(err);
        }
    }
);

export default router;
