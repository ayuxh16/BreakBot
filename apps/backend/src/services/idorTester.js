export async function testIdor(baseUrl) {
  const base = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
  const findings = [];
  const seenBodies = new Set();
  let accessibleCount = 0;

  for (const id of [1, 2, 3, 4, 5]) {
    const url = `${base.replace(/\/$/, "")}/rest/basket/${id}`;
    let response, bodyText;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      bodyText = await response.text();
    } catch {
      continue;
    }

    if (response.status === 200 && bodyText.length > 20) {
      accessibleCount++;
      seenBodies.add(bodyText.slice(0, 100));
    }
  }

  if (accessibleCount >= 2 && seenBodies.size >= 2) {
    findings.push({
      severity: "high",
      title: "Insecure Direct Object Reference on /rest/basket/:id",
      detail: `Fetched ${accessibleCount} different basket IDs with no authentication and got back distinct data each time, meaning baskets are not protected by ownership checks.`,
      evidence: {
        request: { method: "GET", url: `${base}/rest/basket/1..5` },
        curl: `curl '${base}/rest/basket/1'`,
        note: `${accessibleCount} of 5 tested IDs returned real, distinct data without auth.`,
      },
    });
  }

  return findings;
}
