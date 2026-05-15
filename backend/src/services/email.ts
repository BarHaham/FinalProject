import { Resend } from 'resend';

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export const sendEmail = async ({ to, subject, text }: EmailMessage) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Email not sent — RESEND_API_KEY is missing.');
    console.log('--- FitLingo email preview ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('--------------------------------');
    return { sent: false, previewOnly: true };
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || 'FitLingo <onboarding@resend.dev>';

  console.log(`[email] Attempting to send to ${to} via Resend...`);
  const result = await resend.emails.send({ from, to, subject, text });
  console.log(`[email] Resend response:`, JSON.stringify(result));

  return { sent: true, previewOnly: false };
};
