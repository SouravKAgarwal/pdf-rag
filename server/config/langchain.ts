import { Embeddings } from "@langchain/core/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import dotenv from "dotenv";
import { openrouter } from "../services/openrouter";

dotenv.config({ quiet: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class SafeOpenRouterEmbeddings extends Embeddings {
  model = "nvidia/llama-nemotron-embed-vl-1b-v2:free";

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
          const res = await openrouter.embeddings.generate({
            requestBody: {
              model: this.model,
              input: batchTexts,
              encodingFormat: "float",
            },
          });
          if (typeof res !== "string") {
            for (const e of res.data || []) {
              allEmbeddings.push((e.embedding as number[]) || []);
            }
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
    const res = await openrouter.embeddings.generate({
      requestBody: {
        model: this.model,
        input: [text],
        encodingFormat: "float",
      },
    });
    if (typeof res === "string") return [];
    return (res.data?.[0]?.embedding as number[]) ?? [];
  }
}

/**
 * Used when indexing documents (at ingest time)
 */
export const indexingEmbeddings = new SafeOpenRouterEmbeddings({});

/** Used when embedding a user query (at query time) */
export const queryEmbeddings = new SafeOpenRouterEmbeddings({});

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
