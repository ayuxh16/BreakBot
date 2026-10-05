import { generateChallengeToken, checkTxtRecord } from "../services/dnsVerification.js";

// TEMPORARY in-memory store — replace with Postgres once DB is wired up.
// Maps domain -> expected challenge token
const pendingChallenges = new Map();

export function startVerification(req, res) {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "domain is required" });
  }

  const token = generateChallengeToken();
  pendingChallenges.set(domain, token);

  res.json({
    domain,
    instructions: `Add this as a TXT record on ${domain}: ${token}`,
    token,
  });
}

export async function checkVerification(req, res) {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "domain is required" });
  }

  const expectedToken = pendingChallenges.get(domain);
  if (!expectedToken) {
    return res.status(404).json({
      error: "No pending verification for this domain. Call /verify/start first.",
    });
  }

  const result = await checkTxtRecord(domain, expectedToken);

  if (result.verified) {
    pendingChallenges.delete(domain);
  }

  res.json({
    domain,
    verified: result.verified,
    foundRecords: result.records,
  });
}