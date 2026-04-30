import nodemailer from 'nodemailer';

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

const hasSmtpConfig = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE || 'gmail';
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    service,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendEmail = async ({ to, subject, text }: EmailMessage) => {
  if (!hasSmtpConfig()) {
    console.warn('Email was not sent because EMAIL_USER or EMAIL_PASSWORD is missing.');
    console.log('--- FitLingo email preview ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('--------------------------------');
    return { sent: false, previewOnly: true };
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });

  return { sent: true, previewOnly: false };
};
