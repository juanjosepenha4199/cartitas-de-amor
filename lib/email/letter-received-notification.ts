import nodemailer from "nodemailer";

import { findUserEmailById } from "@/lib/db/users";

function publicBaseUrl(request: Request): string {
  const trimmed = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (trimmed) return trimmed;
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function gmailTransport(): nodemailer.Transporter | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function sendLetterReceivedEmail(args: {
  request: Request;
  recipientUserId: string;
  senderUserId: string | null;
  letterId: string;
  authorDisplayName: string;
}): Promise<void> {
  const { recipientUserId, senderUserId, letterId, authorDisplayName, request } =
    args;
  if (senderUserId && senderUserId === recipientUserId) return;

  const transport = gmailTransport();
  if (!transport) return;

  const dest = await findUserEmailById(recipientUserId);
  if (!dest?.email) return;

  const base = publicBaseUrl(request);
  const letterUrl = `${base}/carta/${encodeURIComponent(letterId)}`;
  const jardinUrl = `${base}/jardin`;

  const from = process.env.GMAIL_USER?.trim() ?? "";
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Cartitas de amor";
  const subject = "Te llegó una carta en Cartitas de amor";
  const text = [
    `Hola${dest.username ? ` @${dest.username}` : ""},`,
    "",
    `Te escribieron una carta firmada como «${authorDisplayName}».`,
    "",
    `Abrila acá: ${letterUrl}`,
    "",
    `También podés ver tus cartas recibidas en el jardín: ${jardinUrl}`,
    "",
    "— Cartitas de amor",
  ].join("\n");

  await transport.sendMail({
    from: `"${fromName}" <${from}>`,
    to: dest.email,
    subject,
    text,
  });
}

/**
 * Envía un correo al destinatario por Gmail (SMTP) si están definidas
 * `GMAIL_USER` y `GMAIL_APP_PASSWORD`. No bloquea ni propaga errores a la API.
 */
export function scheduleLetterReceivedEmail(args: {
  request: Request;
  recipientUserId: string;
  senderUserId: string | null;
  letterId: string;
  authorDisplayName: string;
}): void {
  void sendLetterReceivedEmail(args).catch((e) => {
    console.error("[email] notificación de carta recibida", e);
  });
}
