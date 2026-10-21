import { chromium } from "playwright";

// Submits a unique, detectable XSS marker into a form field and checks
// whether it comes back unescaped in the resulting page — proof the
// payload would actually execute in a real browser, not just "we sent it".
export async function testXss(form, pageUrl) {
  const findings = [];
  const marker = `xsstest${Date.now()}`;
  const payload = `<script>/*${marker}*/</script>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 15000 });

    for (const field of form.fields) {
      if (field.type === "checkbox" || field.type === "hidden") continue;

      try {
        for (const f of form.fields) {
          const selector = `[name="${f.name}"], [formcontrolname="${f.name}"], #${f.name}`;
          const value = f.name === field.name ? payload : "test";
          await page.locator(selector).first().fill(value, { timeout: 1500 }).catch(() => {});
        }

        await page
          .locator('button[type=submit], button:has-text("Submit"), button:has-text("Login")')
          .first()
          .click({ timeout: 1500 })
          .catch(() => {});

        await page.waitForTimeout(1000);

        const html = await page.content();
        const reflectedUnescaped = html.includes(payload);
        console.log(`XSS TEST: field=${field.name} pageUrl=${pageUrl} htmlLength=${html.length}`);

        if (reflectedUnescaped) {
          findings.push({
            severity: "critical",
            title: `Reflected XSS in field "${field.name}"`,
            detail: `Submitting a script payload to "${field.name}" was reflected back into the page unescaped, meaning it would execute in a real browser.`,
            formField: field.name,
            evidence: {
              request: { method: "POST", field: field.name, payload },
              note: "Confirmed by observing the unescaped payload in the response HTML, not just sending it.",
            },
          });
        }

        await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
      } catch {
        // field not fillable or interaction failed, skip
      }
    }
  } catch {
    // page load failed entirely
  } finally {
    await browser.close();
  }

  return findings;
}
