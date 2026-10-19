import { Worker } from "bullmq";
import "dotenv/config";
import { pool } from "./db/pool.js";
import { executeScan } from "./scanExecutor.js";

const worker = new Worker(
  "scans",
  async (job) => {
    const { runId, domainId } = job.data;
    const { rows } = await pool.query("SELECT * FROM domains WHERE id = $1", [domainId]);
    const domain = rows[0];
    if (!domain) throw new Error("Domain not found");

    console.log(`Worker: starting scan for run ${runId}`);
    const result = await executeScan(runId, domain);
    console.log(`Worker: finished run ${runId}`, result);
    return result;
  },
  { connection: { host: "localhost", port: 6379 } }
);

worker.on("failed", async (job, err) => {
  console.error(`Worker: run ${job.data.runId} failed:`, err.message);
  await pool.query("UPDATE runs SET status = 'failed', completed_at = NOW() WHERE id = $1", [
    job.data.runId,
  ]);
});

console.log("BreakBot worker started, waiting for jobs...");
