import { Resend } from "resend";

/**
 * Single shared Resend client + mail settings for the whole app (auth emails
 * and the contact form). Centralized so "is email configured?" is decided in
 * exactly one place. When `RESEND_API_KEY` is absent the client is `null` and
 * callers degrade gracefully instead of pretending a message was sent.
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const isEmailConfigured = Boolean(resend);

/** Verified sender identity for all outbound mail. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Rose Misk <onboarding@resend.dev>";

/** Inbox that contact-form submissions are delivered to. */
export const CONTACT_TO = process.env.CONTACT_TO ?? "rosemisk111@gmail.com";
