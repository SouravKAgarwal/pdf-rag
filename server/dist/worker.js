import {
  db,
  getVectorStore
} from "./chunk-E7FJTDJI.js";

// worker.ts
import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import fs2 from "fs/promises";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// services/pdfParser.ts
import path from "path";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";
async function loadPdfPages(filePath) {
  const parser = new PDFParse({
    data: new Uint8Array(await fs.readFile(filePath))
  });
  try {
    const { pages } = await parser.getText();
    return pages.map(
      (page) => new Document({
        pageContent: page.text,
        metadata: { source: filePath, page: page.num - 1 }
      })
    );
  } finally {
    await parser.destroy();
  }
}
async function loadDocument(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf" || mimetype === "application/pdf") {
    return await loadPdfPages(filePath);
  }
  throw new Error(
    `Unsupported file type "${ext}". Only PDF files are supported.`
  );
}

// worker.ts
import { Document as Document2 } from "@langchain/core/documents";
dotenv.config({ quiet: true });
var PAGE_LIMIT = 500;
var worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const data = JSON.parse(job.data);
    const { filename, path: filePath, mimetype, userId, documentId } = data;
    console.log(`
\u{1F4C2} [${job.id}] Processing: ${filename} (user: ${userId})`);
    const docs = await loadDocument(filePath, mimetype);
    console.log(`   \u{1F4C4} Loaded ${docs.length} page(s)`);
    if (docs.length > PAGE_LIMIT) {
      throw new Error(
        `Document "${filename}" has ${docs.length} pages. The maximum allowed is ${PAGE_LIMIT} pages.`
      );
    }
    await job.updateProgress(5);
    const totalPages = docs.length;
    let docsWithMeta = docs.filter((doc) => doc.pageContent.trim().length > 0).map(
      (doc) => new Document2({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          userId,
          filename,
          documentId,
          totalPages,
          processedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      })
    );
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1e3,
      chunkOverlap: 200
    });
    docsWithMeta = await textSplitter.splitDocuments(docsWithMeta);
    await job.updateProgress(15);
    const vectorStore = await getVectorStore();
    console.log(`Embedding and upserting ${docsWithMeta.length} chunks to Pinecone...`);
    try {
      await vectorStore.addDocuments(docsWithMeta);
    } catch (err) {
      throw err;
    }
    await job.updateProgress(95);
    await db.document.update({
      where: { id: documentId },
      data: { status: "ready", pageCount: totalPages }
    });
    try {
      await fs2.unlink(filePath);
      console.log(`Deleted file from disk: ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete file from disk: ${filePath}`, err);
    }
    await job.updateProgress(100);
    console.log(`${filename} fully indexed (${totalPages} pages)
`);
  },
  {
    concurrency: 5,
    connection: process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : {
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6379)
    }
  }
);
worker.on("completed", (job) => {
  const data = JSON.parse(job.data);
  console.log(`\u2705 Job ${job.id} completed: ${data.filename}`);
});
worker.on("failed", async (job, err) => {
  console.error(`\u274C Job ${job?.id} failed:`, err.message);
  if (job) {
    try {
      const data = JSON.parse(job.data);
      try {
        await fs2.unlink(data.path);
        console.log(
          `   \u{1F5D1}\uFE0F  Deleted file from disk (after failure): ${data.path}`
        );
      } catch (err2) {
        console.error(
          `   \u26A0\uFE0F  Failed to delete file from disk: ${data.path}`,
          err2
        );
      }
      if (data.documentId) {
        await db.document.update({
          where: { id: data.documentId },
          data: {
            status: "error",
            errorMessage: err.message
          }
        });
      }
    } catch (dbErr) {
      console.error("Failed to update document error status:", dbErr);
    }
  }
});
worker.on("error", (err) => {
  console.error("Worker error:", err.message);
});
console.log("\u{1F477} Worker started \u2013 listening for file processing jobs...");
