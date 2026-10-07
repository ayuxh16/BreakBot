import express from "express";
import cors from "cors";
import "dotenv/config";
import verifyRouter from "./routes/verify.js";
import authRouter from "./routes/auth.js";
import runsRouter from "./routes/runs.js";
import crawlRouter from "./routes/crawl.js";
import { listDomains } from "./controllers/verifyController.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/verify", verifyRouter);
app.use("/auth", authRouter);
app.use("/runs", runsRouter);
app.use("/crawl", crawlRouter);
app.get("/domains", listDomains);

app.listen(PORT, () => {
  console.log(`BreakBot backend running on http://localhost:${PORT}`);
});