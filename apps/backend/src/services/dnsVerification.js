import dns from "node:dns/promises";
import crypto from "node:crypto";

export function generateChallengeToken() {
  return "breakbot-verify=" + crypto.randomBytes(16).toString("hex");
}

export async function checkTxtRecord(domain, expectedToken) {
  try {
    const records = await dns.resolveTxt(domain);
    // records is an array of arrays JLK
    const flattened = records.map((r) => r.join(""));
    const found = flattened.some((r) => r.includes(expectedToken));
    return { verified: found, records: flattened };
  } catch (err) {
    // "not verified yet" case, not a crash :|
    return { verified: false, records: [], error: err.code };
  } 
}
export async function checkWellKnownFile(domain, expectedToken) {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const url = `${base.replace(/\/$/, "")}/.well-known/breakbot-verify.txt`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { verified: false, error: `HTTP ${res.status}` };
    const text = (await res.text()).trim();
    console.log("FILE CHECK: expected=", expectedToken, "| got=", text);
    return { verified: text === expectedToken, found: text };
  } catch (err) {
    return { verified: false, error: err.message };
  }
} 