import { Router } from "express";
import {
    adminOnly,
    authMiddleware,
} from "../middlewares/authMiddleware";
import { getCodePriceRub, setCodePriceRub } from "../services/settings";

const router = Router();

// GET /api/admin/settings/code-price
router.get("/code-price", authMiddleware, adminOnly, async (_req, res, next) => {
    try {
        const priceRub = await getCodePriceRub();
        return res.json({ priceRub });
    } catch (e) {
        next(e);
    }
});

// PUT /api/admin/settings/code-price
router.put("/code-price", authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { priceRub } = req.body as { priceRub?: number };
        await setCodePriceRub(Number(priceRub));
        return res.json({ ok: true });
    } catch (e: any) {
        return res.status(400).json({ error: e.message || "Invalid price" });
    }
});

export default router;
