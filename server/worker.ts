import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import fs from "fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { loadDocument } from "./services/pdfParser.js";
import { db } from "./lib/db.js";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "./services/pinecone.js";

dotenv.config({ quiet: true });

const PAGE_LIMIT = 500;

interface FileJobData {
  filename: string;
  path: string;
  mimetype: string;
  userId: string;
  documentId: string;
}

/**
 * Worker that handles background processing of uploaded files.
 * It loads the document, splits it into chunks, generates embeddings,
 * and stores them in Pinecone.
 */
const worker = new Worker(
  "file-upload-queue",
  async (job: Job) => {
    const data: FileJobData = JSON.parse(job.data as string);
    const { filename, path: filePath, mimetype, userId, documentId } = data;

    console.log(`\n📂 [${job.id}] Processing: ${filename} (user: ${userId})`);

    // 1. Load document pages
    const docs = await loadDocument(filePath, mimetype);
    console.log(`   📄 Loaded ${docs.length} page(s)`);

    // 2. Enforce 100-page limit
    if (docs.length > PAGE_LIMIT) {
      throw new Error(
        `Document "${filename}" has ${docs.length} pages. The maximum allowed is ${PAGE_LIMIT} pages.`,
      );
    }

    await job.updateProgress(5);

    // 3. Attach metadata (userId, filename, documentId, totalPages) to every page
    //    and filter out empty pages
    const totalPages = docs.length;
    let docsWithMeta: Document[] = docs
      .filter((doc) => doc.pageContent.trim().length > 0)
      .map(
        (doc) =>
          new Document({
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              userId,
              filename,
              documentId,
              totalPages,
              processedAt: new Date().toISOString(),
            },
          }),
      );

    // Split text into more uniform chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    docsWithMeta = await textSplitter.splitDocuments(docsWithMeta);

    await job.updateProgress(15);

    // 4. Embed chunks and store in Pinecone

    const vectorStore = await getVectorStore();

    console.log(
      `Embedding and upserting ${docsWithMeta.length} chunks to Pinecone...`,
    );
    try {
      const batchSize = 100;
      for (let i = 0; i < docsWithMeta.length; i += batchSize) {
        const batch = docsWithMeta.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
        const progress = Math.min(
          95,
          15 + Math.round(((i + batch.length) / docsWithMeta.length) * 80),
        );
        await job.updateProgress(progress);
      }
    } catch (err: any) {
      throw err;
    }

    // 5. Update DB: mark document as ready with page count
    await db.document.update({
      where: { id: documentId },
      data: { status: "ready", pageCount: totalPages },
    });

    // 6. Clean up file from disk
    try {
      await fs.unlink(filePath);
      console.log(`Deleted file from disk: ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete file from disk: ${filePath}`, err);
    }

    await job.updateProgress(100);
    console.log(`${filename} fully indexed (${totalPages} pages)\n`);
  },
  {
    concurrency: 5,
    connection: (process.env.REDIS_URL
      ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
      : {
          host: process.env.REDIS_HOST ?? "localhost",
          port: Number(process.env.REDIS_PORT ?? 6379),
        }) as any,
  },
);

// Set up worker event listeners

worker.on("completed", (job: Job) => {
  const data: FileJobData = JSON.parse(job.data as string);
  console.log(`✅ Job ${job.id} completed: ${data.filename}`);
});

worker.on("failed", async (job: Job | undefined, err: Error) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);

  // Persist error status to DB so the client can display it
  if (job) {
    try {
      const data: FileJobData = JSON.parse(job.data as string);

      // Clean up file from disk on failure too
      try {
        await fs.unlink(data.path);
        console.log(
          `   🗑️  Deleted file from disk (after failure): ${data.path}`,
        );
      } catch (err) {
        console.error(
          `   ⚠️  Failed to delete file from disk: ${data.path}`,
          err,
        );
      }

      if (data.documentId) {
        await db.document.update({
          where: { id: data.documentId },
          data: {
            status: "error",
            errorMessage: err.message,
          },
        });
      }
    } catch (dbErr) {
      console.error("Failed to update document error status:", dbErr);
    }
  }
});

worker.on("error", (err: Error) => {
  console.error("Worker error:", err.message);
});

console.log("👷 Worker started – listening for file processing jobs...");
