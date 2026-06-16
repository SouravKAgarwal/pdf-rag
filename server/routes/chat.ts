import { Router, type Request, type Response } from "express";
import { verifyAuth, getUserId } from "../middlewares/auth.js";
import { db } from "../lib/db.js";
import { searchRelevantChunks } from "../services/qdrant.js";
import { streamChatResponse } from "../services/chatService.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const router = Router();

/**
 * POST /chat
 * Handles chat queries against an uploaded document using RAG.
 */
router.post("/", verifyAuth, async (req: Request, res: Response) => {
  const {
    query,
    documentId,
    messages = [],
  }: {
    query?: string;
    documentId?: string;
    messages?: { role: string; content: string }[];
  } = req.body;

  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  if (!documentId) {
    res.status(400).json({ error: "documentId is required" });
    return;
  }

  const userId = getUserId(req);

  // Verify ownership and readiness BEFORE opening SSE stream
  const document = await db.document.findFirst({
    where: { id: documentId, userId },
  });

  // Open SSE stream
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  if (!document || document.status !== "ready") {
    sendEvent({
      type: "error",
      message:
        "Document is not ready yet. Please wait for indexing to complete.",
    });
    sendEvent({ type: "done" });
    res.end();
    return;
  }

  try {
    // 1. Retrieve the most relevant chunks from Qdrant via RAG
    const relevantDocs = await searchRelevantChunks(userId, documentId, query);

    if (relevantDocs.length === 0) {
      sendEvent({ type: "sources", sources: [] });
      sendEvent({
        type: "text",
        text: "No relevant content found for this query in the document.",
      });
      sendEvent({ type: "done" });
      res.end();
      return;
    }

    // 2. Sort relevant pages by page number for consistency
    const sortedDocs = [...relevantDocs].sort((a, b) => {
      const pageA = (a.metadata.page as number) ?? 0;
      const pageB = (b.metadata.page as number) ?? 0;
      return pageA - pageB;
    });

    // 3. Send sources event
    sendEvent({
      type: "sources",
      sources: [{ filename: document.filename, source: document.filename }],
    });

    // 4. Delegate to chat service to stream Gemini response
    await streamChatResponse(
      query,
      documentId,
      document.filename,
      sortedDocs,
      messages,
      sendEvent,
      () => res.end()
    );
  } catch (error) {
    console.error("Chat error:", error);
    sendEvent({
      type: "error",
      message: "An error occurred while processing your request.",
    });
    res.end();
  }
});

export default router;
