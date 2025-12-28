import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { sendVerificationCodeEmail } from "../services/mailer";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "arsgora_dev_secret";

function generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// ========== КЛАССИЧЕСКИЕ ЭНДПОЙНТЫ (админка) ==========

router.post("/register", async (req, res, next) => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return res.status(400).json({
                error: "Email и пароль обязательны",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            return res.status(400).json({
                error: "Пользователь с таким email уже существует",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
            },
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return res.status(400).json({
                error: "Email и пароль обязательны",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(401).json({
                error: "Неверный email или пароль",
            });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({
                error: "Неверный email или пароль",
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ========== РЕГИСТРАЦИЯ С ПОДТВЕРЖДЕНИЕМ EMAIL (для ВИДЖЕТА) ==========

router.post("/widget/register", async (req, res, next) => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return res.status(400).json({
                error: "Email и пароль обязательны",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing) {
            return res.status(400).json({
                error: "Пользователь с таким email уже существует",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                emailLoginCode: code,
                emailLoginCodeExpiresAt: expiresAt,
            },
        });

        try {
            await sendVerificationCodeEmail(user.email, code);
        } catch (e) {
            console.error(e);
            return res.status(503).json({
                error: "Почтовый сервер недоступен. Попробуйте позже.",
            });
        }

        return res.json({
            ok: true,
            userId: user.id,
            email: user.email,
            expiresAt,
        });
    } catch (err) {
        next(err);
    }
});

router.post("/widget/verify", async (req, res, next) => {
    try {
        const { userId, code } = req.body as {
            userId?: number;
            code?: string;
        };

        if (!userId || !code) {
            return res.status(400).json({
                error: "Необходимо указать userId и код подтверждения",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.emailLoginCode || !user.emailLoginCodeExpiresAt) {
            return res.status(400).json({
                error: "Код подтверждения не был запрошен",
            });
        }

        if (user.emailLoginCode !== code.trim()) {
            return res.status(400).json({
                error: "Неверный код подтверждения",
            });
        }

        if (user.emailLoginCodeExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                error: "Срок действия кода истёк",
            });
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
                emailLoginCode: null,
                emailLoginCodeExpiresAt: null,
            },
        });

        const token = jwt.sign(
            { userId: updated.id, role: updated.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: updated.id,
                email: updated.email,
                role: updated.role,
            },
        });
    } catch (err) {
        next(err);
    }
});

router.post("/widget/resend-code", async (req, res, next) => {
    try {
        const { email } = req.body as { email?: string };

        if (!email) {
            return res.status(400).json({
                error: "Email обязателен",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user || user.emailVerifiedAt) {
            return res.json({ ok: true });
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailLoginCode: code,
                emailLoginCodeExpiresAt: expiresAt,
            },
        });

        await sendVerificationCodeEmail(user.email, code);

        return res.json({ ok: true, expiresAt });
    } catch (err) {
        next(err);
    }
});

router.post("/widget/login", async (req, res, next) => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            return res.status(400).json({
                error: "Email и пароль обязательны",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(401).json({
                error: "Неверный email или пароль",
            });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({
                error: "Неверный email или пароль",
            });
        }

        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                error: "Email не подтверждён",
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
