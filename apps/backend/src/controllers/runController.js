import { pool } from "../db/pool.js";
import { crawlSite } from "../services/crawlerService.js";
import { scanPage } from "../services/securityScanner.js";

export async function startRun(req, res) {
  const { domainId } = req.body;

  if (!domainId) {
    return res.status(400).json({ error: "domainId is required" });
  }

  let runId = null;

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
      "INSERT INTO runs (domain_id, status) VALUES ($1, 'running') RETURNING id",
      [domainId]
    );
    runId = runResult.rows[0].id;

    // 1. Crawl the site
    const pages = await crawlSite(domain.url);

    await pool.query("DELETE FROM crawled_pages WHERE domain_id = $1", [domainId]);
    for (const page of pages) {
      await pool.query(
        "INSERT INTO crawled_pages (domain_id, url, forms) VALUES ($1, $2, $3)",
        [domainId, page.url, JSON.stringify(page.forms || [])]
      );
    }

    // 2. Scan every page that was reachable
    let pagesScanned = 0;
    let findingsCount = 0;

    for (const page of pages) {
      if (page.error) continue;
      pagesScanned++;

      const findings = await scanPage(page.url);
      for (const f of findings) {
        await pool.query(
          `INSERT INTO findings (run_id, severity, title, detail, page_url, evidence)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [runId, f.severity, f.title, f.detail, page.url, JSON.stringify(f.evidence)]
        );
        findingsCount++;
      }
    }

    await pool.query(
      "UPDATE runs SET status = 'completed', completed_at = NOW(), pages_scanned = $2 WHERE id = $1",
      [runId, pagesScanned]
    );

    res.json({ runId, pagesScanned, findingsCount });
  } catch (err) {
    console.error("RUN FAILED:", err);
    if (runId) {
      await pool
        .query("UPDATE runs SET status = 'failed', completed_at = NOW() WHERE id = $1", [runId])
        .catch(() => {});
    }
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
      `SELECT * FROM findings WHERE run_id = $1
       ORDER BY CASE severity
         WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         created_at ASC`,
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
      `SELECT runs.id, runs.status, runs.started_at, runs.completed_at, runs.pages_scanned,
              domains.url,
              (SELECT COUNT(*) FROM findings WHERE findings.run_id = runs.id)::int AS findings_count
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