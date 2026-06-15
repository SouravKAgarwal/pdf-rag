import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import uploadRouter from "./routes/upload.js";
import statusRouter from "./routes/status.js";
import chatRouter from "./routes/chat.js";
import documentsRouter from "./routes/documents.js";
import messagesRouter from "./routes/messages.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.js";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT ?? 8000;

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-id", "authorization"],
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── Clerk middleware ──────────────────────────────────────────────────────────
app.use(clerkMiddleware());

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ status: "ok", version: "3.0.0" });
});

app.use("/uploads", uploadRouter);
app.use("/status", statusRouter);
app.use("/chat", chatRouter);
app.use("/documents", documentsRouter);
app.use("/messages", messagesRouter);

// ── Error handling ────────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Uncaught safety nets ──────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
