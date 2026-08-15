const nodemailer = require('nodemailer');

// True only when real SMTP credentials are configured in the environment.
const isConfigured = () =>
  Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);

// Build the transporter on each call so env changes (e.g. .env edits followed
// by a restart) always take effect.
const createTransporter = () => {
  const port = Number(process.env.MAIL_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

// Build a minimal HTML reset email containing the one-time token and a clickable
// link straight to the client's reset page.
const buildResetEmail = ({ to, token }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${token}`;
  return {
    subject: 'HomeChef — Password Reset Request',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;color:#3A233C;">
        <h2 style="color:#C45B7C;">Password Reset</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your HomeChef password. Use the code below, or click the button to set a new one.</p>
        <p style="background:#FDE7EF;border-radius:10px;padding:14px;font-family:monospace;font-size:20px;letter-spacing:2px;text-align:center;font-weight:bold;color:#4B254B;">${token}</p>
        <p style="text-align:center;margin:22px 0;">
          <a href="${resetLink}" style="background:#D96F91;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold;">Reset my password</a>
        </p>
        <p style="font-size:13px;color:#8a7a7a;">This code expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };
};

/**
 * Send a password reset email to `to`.
 * - If SMTP credentials exist, sends a real email.
 * - Otherwise falls back to logging the token/link to the server console so
 *   local development still works. The token is NEVER returned to the client
 *   through the API, regardless of environment.
 *
 * Returns { delivered: true } when a real email was sent, { delivered: false }
 * when it only went to the console.
 */
const sendPasswordResetEmail = async (to, token) => {
  const mail = buildResetEmail({ to, token });

  if (!isConfigured()) {
    console.log('\n[PasswordReset - DEV only, no SMTP configured]');
    console.log(`  To: ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Link: ${mail.html.match(/href="([^"]+)"/)[1]}\n`);
    return { delivered: false };
  }

  await createTransporter().sendMail({
    from: process.env.MAIL_FROM || `HomeChef <${process.env.MAIL_USER}>`,
    to,
    subject: mail.subject,
    html: mail.html
  });
  return { delivered: true };
};

module.exports = { sendPasswordResetEmail, isConfigured };
