const util = require('util');

// Lightweight notifications service with a 'mock' provider and optional real provider hooks.
// Environment variables:
// SMS_PROVIDER=mock|twilio
// EMAIL_PROVIDER=mock|smtp
// LINE_PROVIDER=mock

const sendSms = async ({ phoneNumber, message }) => {
  // If Twilio configured, try to send using Twilio (optional)
  if (process.env.SMS_PROVIDER === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const from = process.env.TWILIO_PHONE_NUMBER;
      const res = await twilio.messages.create({ body: message, from, to: phoneNumber });
      return { success: true, provider: 'twilio', providerResponse: res };
    } catch (err) {
      console.error('Twilio send error', err);
      return { success: false, error: err.message || err };
    }
  }

  // Mock provider: log and return success
  console.log('[notifications] mock SMS sent', { phoneNumber, message });
  return { success: true, provider: 'mock', providerResponse: { to: phoneNumber, message } };
};

const sendLine = async ({ lineId, message }) => {
  // real LINE integration would go here if LINE channel token present
  if (process.env.LINE_PROVIDER === 'line' && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    // Optional: implement using @line/bot-sdk
    try {
      const fetch = global.fetch || require('node-fetch');
      const url = 'https://api.line.me/v2/bot/message/push';
      const body = { to: lineId, messages: [{ type: 'text', text: message }] };
      const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      return { success: true, provider: 'line', providerResponse: json };
    } catch (err) {
      console.error('LINE send error', err);
      return { success: false, error: err.message || err };
    }
  }

  console.log('[notifications] mock LINE sent', { lineId, message });
  return { success: true, provider: 'mock', providerResponse: { to: lineId, message } };
};

const sendEmail = async ({ to, subject, message, attachments }) => {
  if (process.env.EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587'), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html: message, attachments });
      return { success: true, provider: 'smtp', providerResponse: info };
    } catch (err) {
      console.error('SMTP send error', err);
      return { success: false, error: err.message || err };
    }
  }

  console.log('[notifications] mock Email sent', { to, subject });
  return { success: true, provider: 'mock', providerResponse: { to, subject, message } };
};

module.exports = {
  sendSms,
  sendLine,
  sendEmail
};
