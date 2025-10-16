import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { splitter, vectorStore } from "./config/langchain.js";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const data = JSON.parse(job.data);

    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    const splitTexts = await splitter.splitText(docs);

    console.log(`📄 Loaded ${splitTexts.length} pages from PDF`);

    const chunkSize = 20;
    const total = splitTexts.length;
    let processed = 0;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = splitTexts.slice(i, i + chunkSize);
      await vectorStore.addDocuments(chunk);

      processed += chunk.length;
      const progress = Math.min((processed / total) * 100, 100).toFixed(2);

      await job.updateProgress(progress);

      console.log(`⚙️ Progress: ${progress}% (${processed}/${total})`);
    }

    console.log("✅ All documents added to vector store");
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);
