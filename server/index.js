import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import { Queue } from "bullmq";
import { vectorStore } from "./config/langchain.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const ALLOWED_ORIGINS = ["http://localhost:3000"];

app.use(cors(ALLOWED_ORIGINS.length ? { origin: ALLOWED_ORIGINS } : {}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix + "-" + file.originalname}`);
  },
});
const upload = multer({ storage: storage });
const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

app.post("/uploads", upload.single("pdf"), async (req, res) => {
  try {
    await queue.add(
      "file-ready",
      JSON.stringify({
        filename: req.file.originalname,
        source: req.file.destination,
        path: req.file.path,
      })
    );

    return res.json({ message: "uploaded" });
  } catch (error) {
    console.error(error);

    return res.status(401).json("Something went wrong", error);
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/chat", async (req, res) => {
  try {
    const query = req.query.query;

    const retriever = vectorStore.asRetriever({
      k: 2,
    });
    const retrievedDocs = await retriever.invoke(query);

    const formattedContext = retrievedDocs
      .map(
        (doc, index) =>
          `--- Document ${index + 1} (Source: ${doc.metadata?.source}) ---\n${
            doc.pageContent
          }`
      )
      .join("\n\n");

    const SYSTEM_PROMPT = `You are a highly intelligent and accurate Q&A assistant. Your task is to synthesize an answer to the user's query based ONLY on the provided context.

    Follow these instructions carefully:
    1.  Read the provided context thoroughly to understand the information it contains.
    2.  Formulate a comprehensive answer to the user's query using only the information from the context.
    3.  If the context does not contain the information needed to answer the query, you MUST state: "The provided PDF does not contain information about this topic."
    4.  Do not use any prior knowledge or external information. Your response must be grounded in the provided documents.
    5. Give directed response for what is asked.

    --- CONTEXT ---
    ${formattedContext}

    --- USER QUERY ---
    ${query}

    --- ANSWER ---`;

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    });

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
      ],
    });

    const answer = result.text;

    return res.json({
      answer: answer,
      sources: retrievedDocs.map((doc) => doc.metadata?.source || "N/A"),
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return res.status(500).json({
      error: "An error occurred while processing your request.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
