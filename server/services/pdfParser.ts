import path from "path";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { Document } from "@langchain/core/documents";

/**
 * Loads a PDF file and extracts its text into an array of Langchain Document objects,
 * one Document per page.
 *
 * @param {string} filePath - The absolute or relative path to the PDF file.
 * @returns {Promise<Document[]>} A promise that resolves to an array of Documents.
 */
async function loadPdfPages(filePath: string): Promise<Document[]> {
  const parser = new PDFParse({
    data: new Uint8Array(await fs.readFile(filePath)),
  });

  try {
    const { pages } = await parser.getText();
    return pages.map(
      (page: any) =>
        new Document({
          pageContent: page.text,
          metadata: { source: filePath, page: page.num - 1 },
        }),
    );
  } finally {
    await parser.destroy();
  }
}

/**
 * Validates the file extension and MIME type, then loads the document.
 * Currently, only PDF files are supported.
 *
 * @param {string} filePath - The path to the document file.
 * @param {string} mimetype - The MIME type of the uploaded file.
 * @returns {Promise<Document[]>} A promise that resolves to the loaded documents.
 * @throws {Error} If the file type is not supported.
 */
export async function loadDocument(
  filePath: string,
  mimetype: string,
): Promise<Document[]> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf" || mimetype === "application/pdf") {
    return await loadPdfPages(filePath);
  }

  throw new Error(
    `Unsupported file type "${ext}". Only PDF files are supported.`,
  );
}
