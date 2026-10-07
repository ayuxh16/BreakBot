import { Router } from "express";
import { startCrawl } from "../controllers/crawlController.js";

const router = Router();

router.post("/", startCrawl);

export default router;