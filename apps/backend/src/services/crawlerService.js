import * as cheerio from "cheerio";

// up to maxPages. Returns an array of { url, links, forms }.
export async function crawlSite(baseUrl, maxPages = 15) {
  const normalizedBase = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const baseHost = new URL(normalizedBase).host;

  const visited = new Set();
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

    // Discover links, keep only same-domain ones
    const links = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      try {
        const absolute = new URL(href, url).href;
        if (new URL(absolute).host === baseHost) {
          links.push(absolute);
          if (!visited.has(absolute) && queue.length + visited.size < maxPages) {
            queue.push(absolute);
          }
        }
      } catch {
        // invalid href (e.g. "javascript:void(0)"), skip
      }
    });

    // Discover forms and their input fields
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
      forms.push({ action, method, fields });
    });

    results.push({ url, links, forms });
  }

  return results;
}