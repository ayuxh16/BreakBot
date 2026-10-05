import { generateChallengeToken, checkTxtRecord } from "../services/dnsVerification.js";
import { pool } from "../db/pool.js";

export async function startVerification(req, res) {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "domain is required" });
  }

  const token = generateChallengeToken();

  try {
    const result = await pool.query(
      `INSERT INTO domains (url, challenge_token, verified)
       VALUES ($1, $2, FALSE)
       ON CONFLICT (url)
       DO UPDATE SET challenge_token = $2, verified = FALSE, verified_at = NULL
       RETURNING *`,
      [domain, token]
    );

    res.json({
      domain,
      instructions: `Add this as a TXT record on ${domain}: ${token}`,
      token,
    });
  } catch (err) {
    console.error("INSERT FAILED:", err);
    res.status(500).json({ error: "Failed to start verification" });
  }
}

export async function checkVerification(req, res) {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "domain is required" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT challenge_token FROM domains WHERE url = $1",
      [domain]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "No pending verification for this domain. Call /verify/start first.",
      });
    }

    const expectedToken = rows[0].challenge_token;
    const result = await checkTxtRecord(domain, expectedToken);

    if (result.verified) {
      await pool.query(
        "UPDATE domains SET verified = TRUE, verified_at = NOW() WHERE url = $1",
        [domain]
      );
    }

    res.json({
      domain,
      verified: result.verified,
      foundRecords: result.records,
    });
  } catch (err) {
    console.error("CHECK FAILED:", err);
    res.status(500).json({ error: "Failed to check verification" });
  }
}