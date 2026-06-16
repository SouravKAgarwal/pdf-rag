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
import { rateLimit } from "express-rate-limit";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT ?? 8000;

// CORS setup
if (!process.env.ALLOWED_ORIGINS) {
  throw new Error("ALLOWED_ORIGINS environment variable is not defined");
}
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(",");

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-id", "authorization"],
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Clerk middleware
app.use(clerkMiddleware());

// Routes
app.get("/", (_req, res) => {
  res.json({ status: "ok", version: "3.0.0" });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use("/uploads", apiLimiter, uploadRouter);
app.use("/status", statusRouter);
app.use("/chat", apiLimiter, chatRouter);
app.use("/documents", documentsRouter);
app.use("/messages", messagesRouter);

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Uncaught safety nets
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
