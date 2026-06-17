// lib/db.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
var adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL
});
var db = new PrismaClient({ adapter });

// services/pinecone.ts
import { PineconeStore } from "@langchain/pinecone";

// config/langchain.ts
import { Embeddings } from "@langchain/core/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv2 from "dotenv";

// services/openrouter.ts
import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY is not defined in the environment variables."
  );
}
var openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

// config/langchain.ts
dotenv2.config({ quiet: true });
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var SafeOpenRouterEmbeddings = class extends Embeddings {
  model = "nvidia/llama-nemotron-embed-vl-1b-v2:free";
  /**
   * Embed a batch of texts with automatic chunking, rate-limit retry,
   * and inter-batch delays to stay within Gemini's RPM quota.
   */
  async embedDocuments(texts) {
    const BATCH_SIZE = 100;
    const DELAY_MS = 1500;
    const MAX_RETRIES = 5;
    const allEmbeddings = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      let attempt = 0;
      while (true) {
        try {
          const res = await openrouter.embeddings.generate({
            requestBody: {
              model: this.model,
              input: batchTexts,
              encodingFormat: "float"
            }
          });
          if (typeof res !== "string") {
            for (const e of res.data || []) {
              allEmbeddings.push(e.embedding || []);
            }
          }
          break;
        } catch (err) {
          const msg = String(err?.message ?? "");
          const status = err?.status ?? err?.code ?? err?.httpStatus;
          let nestedCode = null;
          try {
            const parsed = JSON.parse(msg);
            nestedCode = parsed?.error?.code ?? null;
          } catch {
          }
          const effectiveStatus = nestedCode ?? (typeof status === "number" ? status : parseInt(status, 10));
          const is429 = effectiveStatus === 429 || msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("quota");
          const is503 = effectiveStatus === 503 || msg.includes("503") || msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("overloaded");
          if ((is429 || is503) && attempt < MAX_RETRIES) {
            const baseMs = is503 ? 3e3 : 2e3;
            const wait = Math.min(baseMs * 2 ** attempt, 6e4);
            console.warn(
              `   \u23F3 Embedding ${is503 ? "503 unavailable" : "429 rate-limited"} \u2013 retrying in ${(wait / 1e3).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`
            );
            await sleep(wait);
            attempt++;
          } else {
            throw err;
          }
        }
      }
      if (i + BATCH_SIZE < texts.length) {
        await sleep(DELAY_MS);
      }
    }
    return allEmbeddings;
  }
  async embedQuery(text) {
    const res = await openrouter.embeddings.generate({
      requestBody: {
        model: this.model,
        input: [text],
        encodingFormat: "float"
      }
    });
    if (typeof res === "string") return [];
    return res.data?.[0]?.embedding ?? [];
  }
};
var indexingEmbeddings = new SafeOpenRouterEmbeddings({});
var queryEmbeddings = new SafeOpenRouterEmbeddings({});
var splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1e3,
  chunkOverlap: 200
});

// services/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";
async function getVectorStore() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY environment variable is not defined");
  }
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });
  const pineconeIndex = pc.Index("pdf-ai-docs");
  return new PineconeStore(indexingEmbeddings, {
    pineconeIndex,
    maxConcurrency: 5
  });
}
async function searchRelevantChunks(userId, documentId, query, k = 1e3) {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearch(query, k, {
    userId,
    documentId
  });
  return results;
}

export {
  db,
  openrouter,
  getVectorStore,
  searchRelevantChunks
};
