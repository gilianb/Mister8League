import "server-only";
import nodemailer from "nodemailer";
import { envBool, requireEnv } from "@/lib/env";

export type EmailAttachment = { filename: string; content: Buffer | string; contentType?: string };

export type SendEmailInput = {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function smtpSendEmail(input: SendEmailInput): Promise<{ messageId: string }> {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const secure = envBool("SMTP_SECURE", port === 465);

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  const info = await transporter.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
  });
  return { messageId: String(info.messageId ?? "") };
}
