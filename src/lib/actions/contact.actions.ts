"use server";

import { contactInputSchema } from "@/lib/validations";
import { resend, EMAIL_FROM, CONTACT_TO } from "@/lib/email";
import { toPublicMessage } from "@/lib/auth-guards";

/**
 * Delivers a contact-form submission to the store inbox via Resend (G4).
 * Previously the form only `console.log`-ged and faked a success alert; this is
 * a real, validated server action. When no mailer is configured it returns an
 * honest error directing the visitor to WhatsApp/email rather than pretending
 * the message was sent.
 */
export async function sendContactMessage(input: unknown) {
  try {
    const parsed = contactInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please make sure your name, email, and message are valid.",
      };
    }
    const { name, email, message } = parsed.data;

    if (!resend) {
      return {
        success: false,
        error:
          "Messaging is currently unavailable. Please contact us directly via WhatsApp or email.",
      };
    }

    await resend.emails.send({
      from: EMAIL_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `New contact message from ${name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.8;">
          <h2>New message from the contact form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("sendContactMessage error:", error);
    return {
      success: false,
      error: toPublicMessage(
        error,
        "Could not send your message right now. Please try again later."
      ),
    };
  }
}
