import { pool } from "../db/pool.js";
import { crawlSite } from "../services/crawlerService.js";

export async function startCrawl(req, res) {
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
        error: "Domain not found or not verified. Only verified domains can be crawled.",
      });
    }

    const domain = domainResult.rows[0];
    const pages = await crawlSite(domain.url);
    await pool.query("DELETE FROM crawled_pages WHERE domain_id = $1", [domainId]);

    for (const page of pages) {
      await pool.query(
        "INSERT INTO crawled_pages (domain_id, url, forms) VALUES ($1, $2, $3)",
        [domainId, page.url, JSON.stringify(page.forms || [])]
      );
    }

    res.json({
      domainId,
      pagesDiscovered: pages.length,
      totalForms: pages.reduce((sum, p) => sum + (p.forms?.length || 0), 0),
      pages,
    });
  } catch (err) {
    console.error("CRAWL FAILED:", err);
    res.status(500).json({ error: "Crawl failed" });
  }
}