import { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const COLLECTION_NAME = "pdf-ai-docs";
const VECTOR_SIZE = 3072;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// --- Embeddings ---

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class SafeGoogleEmbeddings extends Embeddings {
  model = "gemini-embedding-001";

  /**
   * Embed a batch of texts with automatic chunking, rate-limit retry,
   * and inter-batch delays to stay within Gemini's RPM quota.
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 100;
    const DELAY_MS = 1500; // pause between batches
    const MAX_RETRIES = 5;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);

      // Retry with exponential backoff on rate-limit (429) errors
      let attempt = 0;
      while (true) {
        try {
          const res = await ai.models.embedContent({
            model: this.model,
            contents: batchTexts,
          });
          for (const e of res.embeddings || []) {
            allEmbeddings.push(e.values || []);
          }
          break; // success
        } catch (err: any) {
          const msg = String(err?.message ?? "");
          const status = err?.status ?? err?.code ?? err?.httpStatus;

          // Parse nested JSON error body (Gemini wraps codes inside JSON strings)
          let nestedCode: number | null = null;
          try {
            const parsed = JSON.parse(msg);
            nestedCode = parsed?.error?.code ?? null;
          } catch {
            /* not JSON */
          }

          const effectiveStatus =
            nestedCode ??
            (typeof status === "number" ? status : parseInt(status, 10));

          const is429 =
            effectiveStatus === 429 ||
            msg.includes("429") ||
            msg.toLowerCase().includes("rate") ||
            msg.toLowerCase().includes("quota");

          const is503 =
            effectiveStatus === 503 ||
            msg.includes("503") ||
            msg.toLowerCase().includes("unavailable") ||
            msg.toLowerCase().includes("high demand") ||
            msg.toLowerCase().includes("overloaded");

          if ((is429 || is503) && attempt < MAX_RETRIES) {
            const baseMs = is503 ? 3000 : 2000;
            const wait = Math.min(baseMs * 2 ** attempt, 60_000);
            console.warn(
              `   ⏳ Embedding ${is503 ? "503 unavailable" : "429 rate-limited"} – retrying in ${(wait / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await sleep(wait);
            attempt++;
          } else {
            throw err;
          }
        }
      }

      // Pause between batches to avoid hitting RPM limits
      if (i + BATCH_SIZE < texts.length) {
        await sleep(DELAY_MS);
      }
    }
    return allEmbeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const res = await ai.models.embedContent({
      model: this.model,
      contents: text,
    });
    return res.embeddings && res.embeddings[0] && res.embeddings[0].values
      ? res.embeddings[0].values
      : [];
  }
}

/** Used when indexing documents (at ingest time) */
export const indexingEmbeddings = new SafeGoogleEmbeddings({});

/** Used when embedding a user query (at query time) */
export const queryEmbeddings = new SafeGoogleEmbeddings({});

// --- Text Splitter ---

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // was 100 – meaningful paragraph-level chunks
  chunkOverlap: 200, // overlap to preserve sentence continuity
});

// --- Qdrant Collection Auto-Bootstrap ---

async function ensureCollectionExists(): Promise<void> {
  const baseUrl = (process.env.QDRANT_URL ?? "http://localhost:6333").replace(
    /\/$/,
    "",
  );

  // Check if collection already exists
  const checkRes = await fetch(`${baseUrl}/collections/${COLLECTION_NAME}`);
  if (checkRes.ok) return; // already exists

  // Create collection with correct vector size
  const createRes = await fetch(`${baseUrl}/collections/${COLLECTION_NAME}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(
      `Failed to create Qdrant collection "${COLLECTION_NAME}": ${body}`,
    );
  }

  console.log(
    `✅ Qdrant collection "${COLLECTION_NAME}" created (dim=${VECTOR_SIZE})`,
  );
}

// --- Vector Store Factory ---

/**
 * Returns a QdrantVectorStore connected to the shared pdf-ai-docs collection.
 * Automatically creates the collection on first call if it doesn't exist yet.
 */
export async function getVectorStore(): Promise<QdrantVectorStore> {
  await ensureCollectionExists();

  return await QdrantVectorStore.fromExistingCollection(indexingEmbeddings, {
    url: process.env.QDRANT_URL!,
    collectionName: COLLECTION_NAME,
  });
}
