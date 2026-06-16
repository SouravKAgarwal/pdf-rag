import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { queue } from "../services/queue.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";
import crypto from "crypto";

const router = Router();

/**
 * POST /uploads
 * Handles file uploads, stores metadata in the database, and queues a job for processing.
 */
router.post(
  "/",
  verifyAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      throw Errors.badRequest("No file provided");
    }

    const userId = getUserId(req);

    // Create a placeholder Document row first (id is needed for job payload)
    const document = await db.document.create({
      data: {
        userId,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        jobId: `pending-${crypto.randomUUID()}`, // updated below once we have the real job id
        status: "processing",
      },
    });

    const job = await queue.add(
      "file-ready",
      JSON.stringify({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        userId,
        documentId: document.id,
      }),
      { jobId: crypto.randomUUID() }
    );

    // Patch document with real job id
    await db.document.update({
      where: { id: document.id },
      data: { jobId: job.id! },
    });

    res.json({
      message: "File uploaded. Processing started.",
      jobId: job.id,
      documentId: document.id,
      filename: file.originalname,
    });
  }),
);

export default router;
