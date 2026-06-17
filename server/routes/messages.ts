import { Router } from "express";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";

const router = Router();

/**
 * GET /messages/:documentId
 * Retrieves all chat messages associated with a specific document for the authenticated user.
 */
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

  const messagesWithSources = messages.map((msg) => {
    if (msg.role === "assistant") {
      return {
        ...msg,
        sources: [{ filename: doc.filename, source: doc.filename }],
      };
    }
    return msg;
  });

  res.json(messagesWithSources);
}));

export default router;
