export async function scanSecurityHeaders(domain) {
  const findings = [];
  const url = domain.startsWith("http") ? domain : `https://${domain}`;

  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (err) {
    findings.push({
      severity: "critical",
      title: "Site unreachable",
      detail: `Could not connect to ${url}: ${err.message}`,
    });
    return findings;
  }

  const headers = response.headers;

  if (!headers.get("content-security-policy")) {
    findings.push({
      severity: "medium",
      title: "Missing Content-Security-Policy header",
      detail: "No CSP header found. This increases risk of XSS attacks.",
    });
  }

  if (!headers.get("strict-transport-security")) {
    findings.push({
      severity: "medium",
      title: "Missing Strict-Transport-Security header",
      detail: "HSTS header not set. Site may be vulnerable to protocol downgrade attacks.",
    });
  }

  if (!headers.get("x-frame-options") && !headers.get("content-security-policy")?.includes("frame-ancestors")) {
    findings.push({
      severity: "low",
      title: "Missing X-Frame-Options header",
      detail: "Site may be vulnerable to clickjacking via iframe embedding.",
    });
  }

  if (!headers.get("x-content-type-options")) {
    findings.push({
      severity: "low",
      title: "Missing X-Content-Type-Options header",
      detail: "Browsers may MIME-sniff responses, which can lead to security issues.",
    });
  }

  if (!url.startsWith("https://")) {
    findings.push({
      severity: "high",
      title: "Site not served over HTTPS",
      detail: "Traffic to this site is unencrypted.",
    });
  }

  const setCookie = headers.get("set-cookie");
  if (setCookie && !setCookie.toLowerCase().includes("httponly")) {
    findings.push({
      severity: "medium",
      title: "Cookie missing HttpOnly flag",
      detail: "Cookies without HttpOnly can be accessed via JavaScript, increasing XSS impact.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: "low",
      title: "No obvious header issues found",
      detail: "Basic security headers appear to be present. This is a shallow check — not a full audit.",
    });
  }

  return findings;
}