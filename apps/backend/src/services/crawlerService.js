import * as cheerio from "cheerio";
import { chromium } from "playwright";

function normalizeUrl(rawUrl) {
  const u = new URL(rawUrl);
  if (!u.hash.startsWith("#/")) {
    u.hash = "";
  }
  let href = u.href;
  if (href.endsWith("/") && u.pathname !== "/" && !u.hash) {
    href = href.slice(0, -1);
  }
  return href;
}

export async function crawlSite(baseUrl, maxPages = 15) {
  const start = baseUrl.startsWith("http")
    ? baseUrl
    : baseUrl.includes("localhost")
    ? `http://${baseUrl}`
    : `https://${baseUrl}`;
  const normalizedBase = normalizeUrl(start);
  const baseHost = new URL(normalizedBase).host;

  const visited = new Set();
  const queued = new Set([normalizedBase]);
  const queue = [normalizedBase];
  const results = [];

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift();
      if (visited.has(url)) continue;
      visited.add(url);

      let html;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(500);
        html = await page.content();
      } catch (err) {
        results.push({ url, error: err.message, links: [], forms: [] });
        continue;
      }

      const $ = cheerio.load(html);

      const links = [];
      const addDiscovered = (absoluteUrl) => {
        try {
          const abs = new URL(absoluteUrl, url);
          if (!["http:", "https:"].includes(abs.protocol)) return;
          if (abs.host !== baseHost) return;
          const normalized = normalizeUrl(abs.href);
          links.push(normalized);
          if (!visited.has(normalized) && !queued.has(normalized) && visited.size + queue.length < maxPages) {
            queued.add(normalized);
            queue.push(normalized);
          }
        } catch {}
      };

      $("a[href]").each((_, el) => addDiscovered($(el).attr("href")));

      // Deep crawl: click interactive elements that have no real href
      // (common in SPA nav bars/buttons), capture where they navigate to.
      try {
        const clickable = await page.$$(
          'nav button, nav [role="button"], header button, [data-testid*="nav"] button, button:not([disabled])'
        );
        for (const el of clickable.slice(0, 8)) {
          try {
            await el.click({ timeout: 1500 });
            await page.waitForTimeout(400);
            const newUrl = page.url();
            if (newUrl !== url) addDiscovered(newUrl);
          } catch {
            // element not clickable or caused a crash, skip
          } finally {
            if (page.url() !== url) {
              await page.goto(url, { waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
            }
          }
        }
      } catch {
        // click-based discovery failed entirely, fall back to link-only results
      }

      const seenForms = new Set();
      const forms = [];
      $("form, [formcontrolname], input[type=email], input[type=password]")
        .closest("form")
        .each((_, formEl) => {
          const action = $(formEl).attr("action") || url;
          const method = ($(formEl).attr("method") || "GET").toUpperCase();
          const fields = [];
          $(formEl)
            .find("input, textarea, select")
            .each((_, fieldEl) => {
              const name =
                $(fieldEl).attr("name") ||
                $(fieldEl).attr("formcontrolname") ||
                $(fieldEl).attr("id");
              const type = $(fieldEl).attr("type") || "text";
              if (name) fields.push({ name, type });
            });
          const signature = JSON.stringify({ action, method, fields });
          if (!seenForms.has(signature) && fields.length > 0) {
            seenForms.add(signature);
            forms.push({ action, method, fields });
          }
        });

      results.push({ url, links: [...new Set(links)], forms });
    }
  } finally {
    await browser.close();
  }

  return results;
}