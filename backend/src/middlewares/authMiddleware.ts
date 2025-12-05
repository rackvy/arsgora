import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "arsgora_dev_secret";

export interface AuthRequest extends Request {
    userId?: number;
    role?: "USER" | "ADMIN";
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "No authorization header" });
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Invalid authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            userId: number;
            role: "USER" | "ADMIN";
        };

        req.userId = payload.userId;
        req.role = payload.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const adminOnly = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
};
