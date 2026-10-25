import { pool } from "./db/pool.js";
import { crawlSite } from "./services/crawlerService.js";
import { scanPage } from "./services/securityScanner.js";
import { testLoginSqlInjection } from "./services/apiFuzzer.js";
import { fuzzForm } from "./services/formFuzzer.js";
import { testXss } from "./services/xssTester.js";
import { testIdor } from "./services/idorTester.js";

export async function executeScan(runId, domain) {
  let pagesScanned = 0;
  let findingsCount = 0;

  await pool.query("UPDATE runs SET status = 'running' WHERE id = $1", [runId]);

  const pages = await crawlSite(domain.url);

  await pool.query("DELETE FROM crawled_pages WHERE domain_id = $1", [domain.id]);
  for (const page of pages) {
    await pool.query(
      "INSERT INTO crawled_pages (domain_id, url, forms) VALUES ($1, $2, $3)",
      [domain.id, page.url, JSON.stringify(page.forms || [])]
    );
  }

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

  for (const page of pages) {
    for (const form of page.forms || []) {
      const formFindings = await fuzzForm(form, page.url);
      for (const f of formFindings) {
        await pool.query(
          `INSERT INTO findings (run_id, severity, title, detail, page_url, form_field, evidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [runId, f.severity, f.title, f.detail, page.url, f.formField, JSON.stringify(f.evidence)]
        );
        findingsCount++;
      }
    }
  }

  for (const page of pages) {
    for (const form of page.forms || []) {
      const xssFindings = await testXss(form, page.url);
      for (const f of xssFindings) {
        await pool.query(
          `INSERT INTO findings (run_id, severity, title, detail, page_url, form_field, evidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [runId, f.severity, f.title, f.detail, page.url, f.formField, JSON.stringify(f.evidence)]
        );
        findingsCount++;
      }
    }
  }

  const vulnFindings = await testLoginSqlInjection(domain.url);
  for (const f of vulnFindings) {
    await pool.query(
      `INSERT INTO findings (run_id, severity, title, detail, page_url, evidence)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [runId, f.severity, f.title, f.detail, `${domain.url}/rest/user/login`, JSON.stringify(f.evidence)]
    );
    findingsCount++;
  }

  const idorFindings = await testIdor(domain.url);
  for (const f of idorFindings) {
    await pool.query(
      `INSERT INTO findings (run_id, severity, title, detail, page_url, evidence)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [runId, f.severity, f.title, f.detail, `${domain.url}/rest/basket`, JSON.stringify(f.evidence)]
    );
    findingsCount++;
  }

  await pool.query(
    "UPDATE runs SET status = 'completed', completed_at = NOW(), pages_scanned = $2 WHERE id = $1",
    [runId, pagesScanned]
  );

  return { pagesScanned, findingsCount };
}
