import * as cheerio from "cheerio";

function normalizeUrl(rawUrl) {
  const u = new URL(rawUrl);
  u.hash = "";
  let href = u.href;
  if (href.endsWith("/") && u.pathname !== "/") {
    href = href.slice(0, -1);
  }
  if (u.pathname === "/" && !u.search) {
    href = href.replace(/\/$/, "");
  }
  return href;
}

export async function crawlSite(baseUrl, maxPages = 15) {
  const start = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const normalizedBase = normalizeUrl(start);
  const baseHost = new URL(normalizedBase).host;

  const visited = new Set();
  const queued = new Set([normalizedBase]);
  const queue = [normalizedBase];
  const results = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    let html;
    try {
      const res = await fetch(url, { redirect: "follow" });
      html = await res.text();
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
    $("form").each((_, formEl) => {
      const action = $(formEl).attr("action") || url;
      const method = ($(formEl).attr("method") || "GET").toUpperCase();
      const fields = [];
      $(formEl)
        .find("input, textarea, select")
        .each((_, fieldEl) => {
          const name = $(fieldEl).attr("name");
          const type = $(fieldEl).attr("type") || "text";
          if (name) fields.push({ name, type });
        });
      const signature = JSON.stringify({ action, method, fields });
      if (!seenForms.has(signature)) {
        seenForms.add(signature);
        forms.push({ action, method, fields });
      }
    });

    results.push({ url, links: [...new Set(links)], forms });
  }

  return results;
}