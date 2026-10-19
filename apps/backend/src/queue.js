import { Queue } from "bullmq";

export const scanQueue = new Queue("scans", {
  connection: { host: "localhost", port: 6379 },
});
