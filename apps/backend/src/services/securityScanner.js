// Scans one page's response headers and cookies. Every finding carries the
// evidence needed to reproduce it: request, response headers, curl command.
export async function scanPage(pageUrl) {
  let response;
  try {
    response = await fetch(pageUrl, { redirect: "follow" });
  } catch {
    return [];
  }

  const headers = response.headers;
  const isHttps = response.url.startsWith("https://");

  const evidence = {
    request: { method: "GET", url: pageUrl },
    response: {
      status: response.status,
      finalUrl: response.url,
      headers: Object.fromEntries(headers.entries()),
    },
    curl: `curl -i -L '${pageUrl}'`,
  };

  const findings = [];
  const add = (severity, title, detail) =>
    findings.push({ severity, title, detail, evidence });

  const csp = headers.get("content-security-policy");

  if (!csp) {
    add(
      "medium",
      "Missing Content-Security-Policy header",
      "No CSP header found. This increases the impact of XSS attacks."
    );
  }

  if (isHttps && !headers.get("strict-transport-security")) {
    add(
      "medium",
      "Missing Strict-Transport-Security header",
      "HSTS is not set, so browsers can be tricked into using plain HTTP."
    );
  }

  if (!headers.get("x-frame-options") && !(csp && csp.includes("frame-ancestors"))) {
    add(
      "low",
      "Missing clickjacking protection",
      "Neither X-Frame-Options nor a CSP frame-ancestors rule is set, so the page can be embedded in a malicious iframe."
    );
  }

  if (!headers.get("x-content-type-options")) {
    add(
      "low",
      "Missing X-Content-Type-Options header",
      "Browsers may MIME-sniff responses, which can turn uploads or errors into executable content."
    );
  }

  if (!isHttps) {
    add("high", "Page served over plain HTTP", "Traffic to this page is unencrypted.");
  }

  for (const cookie of headers.getSetCookie()) {
    const name = cookie.split("=")[0].trim();
    const lower = cookie.toLowerCase();
    if (!lower.includes("httponly")) {
      add(
        "medium",
        `Cookie "${name}" missing HttpOnly flag`,
        "JavaScript can read this cookie, which raises the impact of any XSS."
      );
    }
    if (isHttps && !lower.includes("secure")) {
      add(
        "medium",
        `Cookie "${name}" missing Secure flag`,
        "This cookie can be sent over unencrypted connections."
      );
    }
  }

  return findings;
}