import { PineconeStore } from "@langchain/pinecone";
import { indexingEmbeddings } from "../config/langchain.js";
import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Returns a PineconeStore connected to the shared pdf-ai-docs index.
 */
export async function getVectorStore(): Promise<PineconeStore> {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY environment variable is not defined");
  }

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const pineconeIndex = pc.Index("pdf-ai-docs");

  return new PineconeStore(indexingEmbeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
}

/**
 * Performs a vector similarity search for the given query against the specified document.
 * Retrieves only the most relevant chunks instead of the entire document.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} documentId - The ID of the document to search within.
 * @param {string} query - The search query.
 * @param {number} [k=1000] - The number of relevant chunks to retrieve.
 * @returns {Promise<Document[]>} A promise that resolves to the most relevant document chunks.
 */
export async function searchRelevantChunks(
  userId: string,
  documentId: string,
  query: string,
  k: number = 1000,
): Promise<Document[]> {
  const vectorStore = await getVectorStore();

  const results = await vectorStore.similaritySearch(query, k, {
    userId,
    documentId,
  });

  return results;
}
