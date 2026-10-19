import { chromium } from "playwright";

// Fills a discovered form via a real browser, submits it, and captures the
// actual network request that fires — works even when the HTML action
// attribute is fake (Angular/React SPAs).
export async function fuzzForm(form, pageUrl) {
  const findings = [];
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 15000 });

    for (const field of form.fields) {
      if (field.type === "checkbox" || field.type === "hidden") continue;

      const payload =
        field.type === "email" ? "not-an-email" : "<script>alert(1)</script>";

      let capturedRequest = null;
      const onRequest = (req) => {
        if (req.method() === "POST" && !capturedRequest) capturedRequest = req;
      };
      page.on("request", onRequest);

      try {
        // Fill every field with harmless text, except the one under test
        for (const f of form.fields) {
          const selector = `[name="${f.name}"], [formcontrolname="${f.name}"], #${f.name}`;
          const value = f.name === field.name ? payload : "test";
          await page.locator(selector).first().fill(value, { timeout: 2000 }).catch(() => {});
        }

        await page
          .locator('button[type=submit], button:has-text("Submit"), button:has-text("Login")')
          .first()
          .click({ timeout: 2000 })
          .catch(() => {});

        await page.waitForTimeout(1000);
      } finally {
        page.off("request", onRequest);
      }

      if (capturedRequest) {
        findings.push({
          severity: "low",
          title: `Captured real endpoint for field "${field.name}"`,
          detail: `Form submission actually calls ${capturedRequest.url()} (${capturedRequest.method()}), not the HTML action attribute.`,
          formField: field.name,
          evidence: {
            request: { method: capturedRequest.method(), url: capturedRequest.url() },
            curl: `curl -X ${capturedRequest.method()} '${capturedRequest.url()}'`,
          },
        });
      }
    }
  } catch {
    // page load or interaction failed, skip
  } finally {
    await browser.close();
  }

  return findings;
}
