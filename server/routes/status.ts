import { Router } from "express";
import { Job } from "bullmq";
import { queue } from "../services/queue.js";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";

const router = Router();

/**
 * GET /status/:jobId
 * Retrieves the current status and progress of a background file-processing job.
 */
router.get("/:jobId", verifyAuth, asyncHandler(async (req, res) => {
  const jobId = Array.isArray(req.params.jobId)
    ? req.params.jobId[0]
    : req.params.jobId;

  const job = await Job.fromId(queue, jobId);
  if (!job) {
    throw Errors.notFound(`Job not found: ${jobId}`);
  }

  const jobData = JSON.parse(job.data as string);
  const userId = getUserId(req);
  if (jobData.userId !== userId) {
    throw Errors.forbidden("You do not own this job");
  }

  const state = await job.getState();
  const progress = Number(job.progress) || 0;

  let pageCount: number | null = null;
  let errorMessage: string | null = null;

  try {
    const doc = await db.document.findFirst({
      where: { jobId },
      select: { pageCount: true, errorMessage: true },
    });
    pageCount = doc?.pageCount ?? null;
    errorMessage = doc?.errorMessage ?? null;
  } catch {  }

  res.json({ state, progress, pageCount, errorMessage });
}));

export default router;
