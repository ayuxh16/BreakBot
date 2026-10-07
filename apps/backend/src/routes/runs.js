import { Router } from "express";
import { startRun, getRun, listRuns } from "../controllers/runController.js";

const router = Router();

router.post("/", startRun);
router.get("/", listRuns);
router.get("/:id", getRun);

export default router;