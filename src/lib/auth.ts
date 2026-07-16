// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Origins allowed to make authenticated requests (CSRF protection).
// Always trust local dev; add the app's configured base URL and any extra
// production domains supplied via TRUSTED_ORIGINS (comma-separated).
const trustedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3000",
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []),
    ]
      .map((origin) => origin?.trim())
      .filter((origin): origin is string => Boolean(origin))
  )
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  user: {
    additionalFields: {
      role: {
        // Literal-array type => Better Auth infers `role` as the strict union
        // "ADMIN" | "USER" (not a loose `string`) everywhere `$Infer` /
        // `inferAdditionalFields` is used.
        type: ["ADMIN", "USER"],
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
  // Handles Set-Cookie for auth flows triggered from Next.js Server Actions.
  // Must remain the LAST plugin in this array.
  plugins: [nextCookies()],
});
