import 'server-only';
import { Resend } from 'resend';

let cached: Resend | null = null;

function getClient(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  cached = new Resend(key);
  return cached;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.MAIL_FROM;
  if (!from) {
    throw new Error('MAIL_FROM is not set');
  }

  const client = getClient();
  const { data, error } = await client.emails.send({
    from,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? 'unknown error'}`);
  }
  if (!data?.id) {
    throw new Error('Resend send returned no message id');
  }

  return { id: data.id };
}
