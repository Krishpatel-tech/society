const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const toResendAttachments = (attachments = []) =>
  attachments.map((file) => ({
    filename: file.filename,
    content: Buffer.isBuffer(file.content)
      ? file.content.toString('base64')
      : Buffer.from(String(file.content || ''), 'utf8').toString('base64'),
    type: file.contentType || undefined,
  }));

const sendViaResend = async (options) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is missing.');
  }

  if (!fromEmail) {
    throw new Error('EMAIL_FROM is missing.');
  }

  const payload = {
    from: fromEmail,
    to: [options.email],
    subject: options.subject,
    html: options.message,
    attachments: toResendAttachments(options.attachments || []),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
};

const sendViaSmtp = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    html: options.message,
    attachments: options.attachments || [],
  });
};

const sendEmail = async (options) => {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(options);
    return;
  }

  await sendViaSmtp(options);
};

module.exports = sendEmail;