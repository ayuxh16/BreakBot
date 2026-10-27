export async function testIdor(baseUrl, authToken) {
  const base = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
  const findings = [];
  const seenUserIds = new Set();
  let accessibleCount = 0;

  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  for (const id of [1, 2, 3, 4, 5]) {
    const url = `${base.replace(/\/$/, "")}/rest/basket/${id}`;
    let response, json;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      json = await response.json();
      console.log(`IDOR check: id=${id} status=${response.status} UserId=${json?.data?.UserId}`);
    } catch (err) {
      console.log(`IDOR check: id=${id} FAILED: ${err.message}`);
      continue;
    }

    if (response.status === 200 && json?.data?.UserId !== undefined) {
      accessibleCount++;
      seenUserIds.add(json.data.UserId);
    }
  }

  if (accessibleCount >= 2 && seenUserIds.size >= 2) {
    findings.push({
      severity: "critical",
      title: "Insecure Direct Object Reference on /rest/basket/:id",
      detail: `Using one account's session, fetched baskets belonging to ${seenUserIds.size} different user IDs (${[...seenUserIds].join(", ")}), meaning baskets are not scoped to their owner. Any logged-in user can read any other user's basket by changing the ID in the URL.`,
      evidence: {
        request: { method: "GET", url: `${base}/rest/basket/1..5`, headers },
        curl: `curl -H 'Authorization: Bearer <token>' '${base}/rest/basket/2'`,
        note: `Accessed baskets for user IDs: ${[...seenUserIds].join(", ")} using a single session.`,
      },
    });
  }

  console.log("IDOR findings to return:", findings.length); return findings;
}
