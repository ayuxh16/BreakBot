// Sends boundary/malformed values to each field of a discovered form and
// checks whether the server handles it gracefully (4xx) or breaks (5xx /
// unhandled error) — a 500 on bad input is itself a finding: it suggests
// missing validation and gives attackers information about internals.

const PAYLOADS_BY_TYPE = {
  text: ["", "a".repeat(5000), "<script>alert(1)</script>", "' OR 1=1--"],
  email: ["", "not-an-email", "a".repeat(2000) + "@test.com"],
  password: ["", "a".repeat(5000)],
  checkbox: [true],
  hidden: [""],
};

function payloadsFor(field) {
  return PAYLOADS_BY_TYPE[field.type] || PAYLOADS_BY_TYPE.text;
}

export async function fuzzForm(form, baseUrl) {
  const findings = [];
  const actionUrl = form.action.startsWith("http")
    ? form.action
    : new URL(form.action, baseUrl).href;

  for (const field of form.fields) {
    const payloads = payloadsFor(field);

    for (const value of payloads) {
      // Build a full payload: the field under test gets the fuzz value,
      // every other field gets a harmless placeholder so the request is
      // well-formed except for the one thing we're testing.
      const body = {};
      for (const f of form.fields) {
        body[f.name] = f.name === field.name ? value : "test";
      }

      const requestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };

      let response, bodyText;
      try {
        response = await fetch(actionUrl, requestInit);
        bodyText = await response.text();
      } catch {
        continue; // unreachable, skip this payload
      }

      const evidence = {
        request: { method: "POST", url: actionUrl, body },
        response: {
          status: response.status,
          bodyPreview: bodyText.slice(0, 300),
        },
        curl: `curl -X POST '${actionUrl}' -H 'Content-Type: application/json' -d '${JSON.stringify(
          body
        )}'`,
      };

      if (response.status >= 500) {
        findings.push({
          severity: "medium",
          title: `Server error on field "${field.name}" with malformed input`,
          detail: `Submitting a crafted value to "${field.name}" caused a ${response.status} server error instead of a graceful validation rejection. This can leak internals and suggests missing input validation.`,
          formField: field.name,
          evidence,
        });
        break; // one finding per field is enough, move to next field
      }
    }
  }

  return findings;
}
