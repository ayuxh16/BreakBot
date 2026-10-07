import { Router } from "express";
import { startVerification, checkVerification, listDomains } from "../controllers/verifyController.js";

const router = Router();

router.post("/start", startVerification);
router.post("/check", checkVerification);

export default router;