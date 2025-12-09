import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import meRouter from "./routes/me";
import codesRouter from "./routes/codes";
import adminRouter from "./routes/admin";
import paymentsRoutes from "./routes/payments";
import { errorMiddleware } from "./middlewares/errorMiddleware";

export const createApp = () => {
    const app = express();

    app.use(
        cors({
            origin: true,
            credentials: true,
        })
    );
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(cookieParser());

    app.use("/api/auth", authRouter);
    app.use("/api/me", meRouter);
    app.use("/api/codes", codesRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/payments", paymentsRoutes);

    app.use(errorMiddleware);

    return app;
};
