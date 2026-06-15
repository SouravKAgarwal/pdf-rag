import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error(
    "GOOGLE_GEMINI_API_KEY is not defined in the environment variables.",
  );
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});
