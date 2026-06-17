import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY is not defined in the environment variables.",
  );
}

export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
