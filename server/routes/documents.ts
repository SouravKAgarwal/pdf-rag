import { Router } from "express";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { asyncHandler, Errors } from "../middlewares/error.js";
import { db } from "../lib/db.js";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const router = Router();

const INDEX_NAME = process.env.PINECONE_INDEX || "pdf-ai-docs";
if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY environment variable is not defined");
}

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
 * Deletes a document, its associated vectors from Pinecone, and related chat messages.
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

    // Remove vectors from Pinecone (best-effort)
    try {
      const pc = new Pinecone();
      const index = pc.Index(INDEX_NAME);
      
      await index.deleteMany({ filter: { documentId: id } } as any);
      
      console.log(`🗑️  Deleted Pinecone vectors for document ${id}`);
    } catch (err) {
      console.warn("Could not remove Pinecone vectors (non-fatal):", err);
    }

    // Delete DB row (ChatMessages cascade via FK)
    await db.document.delete({ where: { id } });

    res.json({ success: true });
  }),
);

export default router;
