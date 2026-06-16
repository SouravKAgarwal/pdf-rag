import { getVectorStore } from "../config/langchain.js";
import { Document } from "@langchain/core/documents";

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
