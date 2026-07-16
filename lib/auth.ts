// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        // Prevent clients from assigning themselves a role during sign-up.
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    // Users cannot sign in until they confirm ownership of their email.
    // This closes the "register a password account on a victim's email"
    // account-linking takeover vector.
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Requires RESEND_API_KEY (and EMAIL_FROM) to be configured.
      // Without it, verification emails are skipped and users cannot verify —
      // set these before enabling in production.
      if (!resend) {
        console.warn(
          `[auth] RESEND_API_KEY not set — skipping verification email for ${user.email}`
        );
        return;
      }

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Rose Misk <onboarding@resend.dev>",
        to: user.email,
        subject: "Verify your email — Rose Misk",
        html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Welcome to Rose Misk</h2>
            <p>Please confirm your email address to activate your account.</p>
            <p>
              <a href="${url}"
                 style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:8px;">
                Verify Email
              </a>
            </p>
            <p style="color:#666;font-size:12px;">If you didn't create this account, you can ignore this email.</p>
          </div>
        `,
      });
    },
  },
  account: {
    // Only auto-link a new social login to an existing account when the
    // provider is trusted to have verified the email (Google/Facebook do).
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook"],
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
  },
  // Throttle auth endpoints (sign-in / sign-up / etc.) against brute force.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
});
