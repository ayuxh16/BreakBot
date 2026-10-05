import express from "express";
import cors from "cors";
import "dotenv/config";
import verifyRouter from "./routes/verify.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/verify", verifyRouter);

app.listen(PORT, () => {
  console.log(`BreakBot backend running on http://localhost:${PORT}`);
});