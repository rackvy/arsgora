import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
};
