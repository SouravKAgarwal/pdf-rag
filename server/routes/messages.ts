import { Router } from "express";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";

const router = Router();

// ── Get all chat messages for a document ─────────────────────────────────────

router.get("/:documentId", verifyAuth, asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const documentId = Array.isArray(req.params.documentId)
    ? req.params.documentId[0]
    : req.params.documentId;

  // Verify document ownership
  const doc = await db.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!doc) {
    throw Errors.notFound("Document not found");
  }

  const messages = await db.chatMessage.findMany({
    where: { documentId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  res.json(messages);
}));

export default router;
