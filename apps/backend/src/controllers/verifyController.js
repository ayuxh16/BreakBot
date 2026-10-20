
import {
  generateChallengeToken,
  checkTxtRecord,
  checkWellKnownFile,
} from "../services/dnsVerification.js";

import { pool } from "../db/pool.js";

export async function startVerification(req, res) {
  const { domain, sessionToken } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "domain is required" });
  }

  // Generate the challenge token before using it.
  const token = generateChallengeToken();

  // TODO: Resolve userId from sessionToken using your auth logic.
  let userId = null;

  try {
    if (sessionToken) {
      // If you have authentication/session logic,
      // validate sessionToken and assign the real userId here.
    }

    const { rows } = await pool.query(
      `INSERT INTO domains (url, challenge_token, verified, user_id)
       VALUES ($1, $2, FALSE, $3)
       ON CONFLICT (url)
       DO UPDATE SET
         challenge_token = EXCLUDED.challenge_token,
         verified = FALSE,
         verified_at = NULL,
         user_id = COALESCE(domains.user_id, EXCLUDED.user_id)
       RETURNING challenge_token, verified`,
      [domain, token, userId]
    );

    const { challenge_token, verified } = rows[0];

    return res.json({
      domain,
      token: challenge_token,
      verified,
      instructions: {
        dns: `Add a TXT record on ${domain} with value: ${challenge_token}`,
        file: `Create a file at /.well-known/breakbot-verify.txt on ${domain} containing exactly: ${challenge_token}`,
      },
    });
  } catch (err) {
    console.error("INSERT FAILED:", err);
    return res.status(500).json({
      error: "Failed to start verification",
    });
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
        error:
          "No pending verification for this domain. Call /verify/start first.",
      });
    }

    const expectedToken = rows[0].challenge_token;

    const dnsResult = await checkTxtRecord(domain, expectedToken);

    if (dnsResult.verified) {
      await pool.query(
        `UPDATE domains
         SET verified = TRUE,
             verified_at = NOW(),
             verification_method = 'dns'
         WHERE url = $1`,
        [domain]
      );

      return res.json({
        domain,
        verified: true,
        method: "dns",
      });
    }

    const fileResult = await checkWellKnownFile(
      domain,
      expectedToken
    );

    if (fileResult.verified) {
      await pool.query(
        `UPDATE domains
         SET verified = TRUE,
             verified_at = NOW(),
             verification_method = 'file'
         WHERE url = $1`,
        [domain]
      );

      return res.json({
        domain,
        verified: true,
        method: "file",
      });
    }

    return res.json({
      domain,
      verified: false,
      dnsChecked: true,
      fileChecked: true,
    });
  } catch (err) {
    console.error("CHECK FAILED:", err);
    return res.status(500).json({
      error: "Failed to check verification",
    });
  }
}

export async function listDomains(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, url, verified, verified_at,
              verification_method, created_at, user_id
       FROM domains
       ORDER BY created_at DESC`
    );

    return res.json(rows);
  } catch (err) {
    console.error("LIST FAILED:", err);
    return res.status(500).json({
      error: "Failed to list domains",
    });
  }
}
