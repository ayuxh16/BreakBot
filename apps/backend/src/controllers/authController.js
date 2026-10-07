import { pool } from "../db/pool.js";
import { generateOtpCode, getExpiryTime } from "../services/otpService.js";

export async function requestOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const code = generateOtpCode();
  const expiresAt = getExpiryTime(10);

  try {
    await pool.query(
      `INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)`,
      [email, code, expiresAt]
    );

    // No real email sending yet (LOG IT TO TEST THE FLOW).
    console.log(`OTP for ${email}: ${code} (expires in 10 min)`);

    res.json({ message: "OTP sent. Check your email." });
  } catch (err) {
    console.error("REQUEST OTP FAILED:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

export async function verifyOtp(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "email and code are required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [rows[0].id]);

    // Create the user if they don't exist yet
    const userResult = await pool.query(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = $1
       RETURNING id, email`,
      [email]
    );

    const user = userResult.rows[0];

    // Simple session token for now — not a real JWT, just enough to identify
    // the user on later requests. We'll upgrade this if it needs to be more secure.
    const sessionToken = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64");

    res.json({ user, sessionToken });
  } catch (err) {
    console.error("VERIFY OTP FAILED:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
}