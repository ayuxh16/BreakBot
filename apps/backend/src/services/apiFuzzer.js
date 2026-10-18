export async function testLoginSqlInjection(baseUrl) {
  const normalized = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
  const url = `${normalized.replace(/\/$/, "")}/rest/user/login`;

  const payload = {
    email: "' OR 1=1--",
    password: "irrelevant",
  };

  const requestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  let response, bodyText;
  try {
    response = await fetch(url, requestInit);
    bodyText = await response.text();
    console.log("SQLi test response status:", response.status, "body:", bodyText.slice(0, 200));
  } catch (err) {
    console.error("SQL server not reached the target",err.message);
    return []; // target not reached !!
  }

  const evidence = {
    request: { method: "POST", url, body: payload },
    response: {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      bodyPreview: bodyText.slice(0, 500),
    },
    curl: `curl -X POST '${url}' -H 'Content-Type: application/json' -d '${JSON.stringify(
      payload
    )}'`,
  };

  // A successful bypass returns 200 with an auth token in the response body and a properly defended endpoint should reject this with 401.
  const looksAuthenticated =
    response.status === 200 && /token/i.test(bodyText);

  if (looksAuthenticated) {
    return [
      {
        severity: "critical",
        title: "Login bypass via SQL injection",
        detail:
          "The login endpoint accepted a classic SQL injection payload (' OR 1=1--) as the email field and returned a valid auth token, meaning authentication was bypassed without a real password.",
        evidence,
      },
    ];
  }

  return [];
}