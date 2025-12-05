import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "../prisma";
import {
    adminOnly,
    authMiddleware,
    AuthRequest,
} from "../middlewares/authMiddleware";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
});

/**
 * Список пользователей (только для админа)
 */
router.get(
    "/users",
    authMiddleware,
    adminOnly,
    async (req: AuthRequest, res, next) => {
        try {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: "desc" },
            });

            return res.json(
                users.map((u) => ({
                    id: u.id,
                    email: u.email,
                    role: u.role,
                    createdAt: u.createdAt,
                }))
            );
        } catch (err) {
            next(err);
        }
    }
);

/**
 * Список кодов (только админ).
 * ?status=AVAILABLE|SOLD|USED|BLOCKED
 * ?ownerId=123
 */
router.get(
    "/codes",
    authMiddleware,
    adminOnly,
    async (req: AuthRequest, res, next) => {
        try {
            const { status, ownerId } = req.query;

            const where: Record<string, unknown> = {};

            if (
                status === "AVAILABLE" ||
                status === "SOLD" ||
                status === "USED" ||
                status === "BLOCKED"
            ) {
                where.status = status;
            }

            if (ownerId) {
                const numericOwnerId = Number(ownerId);
                if (!Number.isNaN(numericOwnerId)) {
                    where.ownerId = numericOwnerId;
                }
            }

            const codes = await prisma.liftCode.findMany({
                where,
                orderBy: { id: "asc" },
                include: {
                    owner: true,
                    batch: true,
                },
            });

            return res.json(
                codes.map((c) => ({
                    id: c.id,
                    code: c.code,
                    status: c.status,
                    ownerId: c.ownerId,
                    ownerEmail: c.owner ? c.owner.email : null,
                    batchId: c.batchId,
                    price: c.price,
                    purchasedAt: c.purchasedAt,
                    usedAt: c.usedAt,
                }))
            );
        } catch (err) {
            next(err);
        }
    }
);

/**
 * Импорт кодов через JSON (MVP, можно оставить как тех.эндпоинт)
 * body: { batchName: string; codes: string[] }
 */
router.post(
    "/code-batches/import-json",
    authMiddleware,
    adminOnly,
    async (req: AuthRequest, res, next) => {
        try {
            const body = req.body as {
                batchName?: string;
                codes?: string[];
            };

            if (!body.batchName || !Array.isArray(body.codes)) {
                return res
                    .status(400)
                    .json({ error: "batchName and codes[] are required" });
            }

            if (body.codes.length === 0) {
                return res.status(400).json({ error: "codes[] must not be empty" });
            }

            const batch = await prisma.codeBatch.create({
                data: {
                    name: body.batchName,
                    uploadedById: req.userId,
                    codes: {
                        create: body.codes.map((code) => ({
                            code,
                            status: "AVAILABLE",
                        })),
                    },
                },
                include: {
                    codes: true,
                },
            });

            return res.json({
                id: batch.id,
                name: batch.name,
                uploadedAt: batch.uploadedAt,
                codesCount: batch.codes.length,
            });
        } catch (err: any) {
            if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
                return res
                    .status(400)
                    .json({ error: "Some codes already exist (unique constraint)" });
            }
            next(err);
        }
    }
);

/**
 * Импорт кодов из Excel-файла.
 * Формат: первый столбец каждого ряда — код.
 * Запрос: multipart/form-data с полями:
 *   - file: файл Excel (.xlsx, .xls)
 *   - batchName: строка
 */
router.post(
    "/code-batches/upload-excel",
    authMiddleware,
    adminOnly,
    upload.single("file"),
    async (req: AuthRequest, res, next) => {
        try {
            const batchName = req.body.batchName as string | undefined;
            const file = req.file;

            if (!batchName) {
                return res.status(400).json({ error: "batchName is required" });
            }

            if (!file) {
                return res.status(400).json({ error: "Excel file is required" });
            }

            const workbook = XLSX.read(file.buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
                header: 1,
                raw: false,
            });

            const codes: string[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const cell = row[0];
                if (!cell) continue;

                const value = String(cell).trim();
                if (!value) continue;

                // если первая строка = "code" или "код" — считаем заголовком и пропускаем
                if (i === 0 && ["code", "код"].includes(value.toLowerCase())) {
                    continue;
                }

                codes.push(value);
            }

            if (codes.length === 0) {
                return res
                    .status(400)
                    .json({ error: "No codes found in the first column of Excel" });
            }

            const batch = await prisma.codeBatch.create({
                data: {
                    name: batchName,
                    uploadedById: req.userId,
                    codes: {
                        create: codes.map((code) => ({
                            code,
                            status: "AVAILABLE",
                        })),
                    },
                },
                include: {
                    codes: true,
                },
            });

            return res.json({
                id: batch.id,
                name: batch.name,
                uploadedAt: batch.uploadedAt,
                codesCount: batch.codes.length,
            });
        } catch (err: any) {
            if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
                return res
                    .status(400)
                    .json({ error: "Some codes already exist (unique constraint)" });
            }
            next(err);
        }
    }
);

export default router;
