import { pool } from "../db/pool.js";
import { scanSecurityHeaders } from "../services/securityScanner.js";

export async function startRun(req, res) {
  const { domainId } = req.body;

  if (!domainId) {
    return res.status(400).json({ error: "domainId is required" });
  }

  try {
    const domainResult = await pool.query(
      "SELECT * FROM domains WHERE id = $1 AND verified = TRUE",
      [domainId]
    );

    if (domainResult.rows.length === 0) {
      return res.status(403).json({
        error: "Domain not found or not verified. Only verified domains can be scanned.",
      });
    }

    const domain = domainResult.rows[0];

    const runResult = await pool.query(
      "INSERT INTO runs (domain_id, status) VALUES ($1, 'running') RETURNING *",
      [domainId]
    );
    const run = runResult.rows[0];

    const findings = await scanSecurityHeaders(domain.url);

    for (const f of findings) {
      await pool.query(
        "INSERT INTO findings (run_id, severity, title, detail) VALUES ($1, $2, $3, $4)",
        [run.id, f.severity, f.title, f.detail]
      );
    }

    await pool.query(
      "UPDATE runs SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [run.id]
    );

    res.json({ runId: run.id, findingsCount: findings.length });
  } catch (err) {
    console.error("RUN FAILED:", err);
    res.status(500).json({ error: "Scan failed" });
  }
}

export async function getRun(req, res) {
  const { id } = req.params;

  try {
    const runResult = await pool.query(
      `SELECT runs.*, domains.url FROM runs
       JOIN domains ON runs.domain_id = domains.id
       WHERE runs.id = $1`,
      [id]
    );

    if (runResult.rows.length === 0) {
      return res.status(404).json({ error: "Run not found" });
    }

    const findingsResult = await pool.query(
      "SELECT * FROM findings WHERE run_id = $1 ORDER BY created_at ASC",
      [id]
    );

    res.json({ run: runResult.rows[0], findings: findingsResult.rows });
  } catch (err) {
    console.error("GET RUN FAILED:", err);
    res.status(500).json({ error: "Failed to fetch run" });
  }
}

export async function listRuns(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT runs.id, runs.status, runs.started_at, runs.completed_at, domains.url
       FROM runs
       JOIN domains ON runs.domain_id = domains.id
       ORDER BY runs.started_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("LIST RUNS FAILED:", err);
    res.status(500).json({ error: "Failed to list runs" });
  }
}