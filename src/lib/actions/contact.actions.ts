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
        error: "برجاء التأكد من صحة الاسم والبريد والرسالة.",
      };
    }
    const { name, email, message } = parsed.data;

    if (!resend) {
      return {
        success: false,
        error:
          "خدمة إرسال الرسائل غير متاحة حالياً. برجاء التواصل معنا عبر واتساب أو البريد الإلكتروني مباشرة.",
      };
    }

    await resend.emails.send({
      from: EMAIL_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `رسالة تواصل جديدة من ${name}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.8; direction: rtl; text-align: right;">
          <h2>رسالة جديدة من نموذج التواصل</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${email}</p>
          <p><strong>الرسالة:</strong></p>
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
        "تعذّر إرسال رسالتك الآن. برجاء المحاولة لاحقاً."
      ),
    };
  }
}
