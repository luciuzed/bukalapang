const express = require('express');
const { Resend } = require('resend');

const router = express.Router();

const CONTACT_EMAIL = process.env.CONTACT_TO || 'mainyukapp@gmail.com';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');

const createResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to send emails.');
  }

  return new Resend(apiKey);
};

const getFromEmail = () => {
  const fromEmail = process.env.RESEND_FROM;

  if (!fromEmail) {
    throw new Error('RESEND_FROM is required to send emails.');
  }

  return fromEmail;
};

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  if (!emailPattern.test(String(email).trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const resend = createResendClient();
    const fromEmail = getFromEmail();
    const safeName = escapeHtml(String(name).trim());
    const safeEmail = escapeHtml(String(email).trim());
    const safeSubject = 'Pesan dari halaman Contact MainYuk';
    const safeMessage = escapeHtml(String(message).trim());

    const { error } = await resend.emails.send({
      from: `MainYuk Contact <${fromEmail}>`,
      to: [CONTACT_EMAIL],
      replyTo: String(email).trim(),
      subject: `[Contact] ${safeSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin: 0 0 16px;">New Contact Message</h2>
          <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message || 'Failed to send contact email');
    }

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact email send failed:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
