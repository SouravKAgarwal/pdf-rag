import { Router } from "express";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const router = Router();

const COLLECTION_NAME = "pdf-ai-docs";
if (!process.env.QDRANT_URL) {
  throw new Error("QDRANT_URL environment variable is not defined");
}
const QDRANT_URL = process.env.QDRANT_URL;

/**
 * GET /documents
 * Retrieves a list of all documents belonging to the authenticated user.
 */
router.get(
  "/",
  verifyAuth,
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);

    const documents = await db.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        size: true,
        mimeType: true,
        jobId: true,
        status: true,
        pageCount: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    res.json(documents);
  }),
);

/**
 * DELETE /documents/:id
 * Deletes a document, its associated vectors from Qdrant, and related chat messages.
 */
router.delete(
  "/:id",
  verifyAuth,
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const document = await db.document.findFirst({
      where: { id, userId },
    });

    if (!document) {
      throw Errors.notFound("Document not found");
    }

    // Remove vectors from Qdrant (best-effort)
    try {
      const client = new QdrantClient({ url: QDRANT_URL });
      await client.delete(COLLECTION_NAME, {
        filter: {
          must: [{ key: "metadata.documentId", match: { value: id } }],
        },
      });
      console.log(`🗑️  Deleted Qdrant vectors for document ${id}`);
    } catch (err) {
      console.warn("Could not remove Qdrant vectors (non-fatal):", err);
    }

    // Delete DB row (ChatMessages cascade via FK)
    await db.document.delete({ where: { id } });

    res.json({ success: true });
  }),
);

export default router;
