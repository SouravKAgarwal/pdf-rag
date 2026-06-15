import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const queueConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const queue = new Queue("file-upload-queue", {
  connection: queueConnection,
});
export { queueConnection };
