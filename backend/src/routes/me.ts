import { Router } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

/**
 * Профиль текущего пользователя
 */
router.get("/", authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({
            id: user.id,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Список кодов пользователя с фильтрами:
 * ?status=all | unused | used (по умолчанию all)
 */
router.get("/codes", authMiddleware, async (req: AuthRequest, res, next) => {
    try {
        const { status } = req.query;

        const where: any = {
            ownerId: req.userId,
        };

        if (status === "unused") {
            where.status = "SOLD";
        } else if (status === "used") {
            where.status = "USED";
        }

        const codes = await prisma.liftCode.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return res.json(
            codes.map((c) => ({
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
});

/**
 * Отметить код как использованный (нажимает сам пользователь)
 */
router.post(
    "/codes/:id/use",
    authMiddleware,
    async (req: AuthRequest, res, next) => {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "Invalid code id" });
            }

            const code = await prisma.liftCode.findUnique({
                where: { id },
            });

            if (!code || code.ownerId !== req.userId) {
                return res.status(404).json({ error: "Code not found" });
            }

            if (code.status === "USED") {
                return res.status(400).json({ error: "Code already used" });
            }

            if (code.status !== "SOLD") {
                return res
                    .status(400)
                    .json({ error: "Code is not in a usable state" });
            }

            const updated = await prisma.liftCode.update({
                where: { id: code.id },
                data: {
                    status: "USED",
                    usedAt: new Date(),
                },
            });

            return res.json({
                id: updated.id,
                code: updated.code,
                status: updated.status,
                purchasedAt: updated.purchasedAt,
                usedAt: updated.usedAt,
            });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
