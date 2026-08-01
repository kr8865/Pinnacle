const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
  return transporter;
};

/**
 * Sends an email. Failures are logged but never thrown up to callers
 * that shouldn't fail their primary operation (e.g. approving a student)
 * just because SMTP is misconfigured in a dev environment.
 */
const sendMail = async ({ to, subject, html, text }) => {
  try {
    const from = process.env.SMTP_FROM || 'Pinnacle Tuition Classes <no-reply@pinnacletuition.com>';
    const info = await getTransporter().sendMail({ from, to, subject, html, text });
    return info;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[mailer] Failed to send email to ${to}: ${err.message}`);
    return null;
  }
};

module.exports = { getTransporter, sendMail };
