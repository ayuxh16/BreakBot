import * as cheerio from "cheerio";
import { chromium } from "playwright";

function normalizeUrl(rawUrl) {
  const u = new URL(rawUrl);
  // Keep hash-based routes (e.g. #/login) since SPAs like Angular use them
  // as real pages. Only strip plain anchors.
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
        await page.waitForTimeout(500); // let Angular finish rendering
        html = await page.content();
      } catch (err) {
        results.push({ url, error: err.message, links: [], forms: [] });
        continue;
      }

      const $ = cheerio.load(html);

      const links = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        try {
          const absolute = new URL(href, url);
          if (!["http:", "https:"].includes(absolute.protocol)) return;
          if (absolute.host !== baseHost) return;
          const normalized = normalizeUrl(absolute.href);
          links.push(normalized);
          if (!visited.has(normalized) && !queued.has(normalized)) {
            queued.add(normalized);
            queue.push(normalized);
          }
        } catch {
          // invalid href, skip
        }
      });

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
