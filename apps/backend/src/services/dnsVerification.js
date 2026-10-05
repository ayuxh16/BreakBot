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