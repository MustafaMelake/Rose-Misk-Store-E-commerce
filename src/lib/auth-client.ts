import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  // Mirrors the server's `additionalFields` onto the client's inferred types,
  // so `authClient` sessions also see `user.role` as "ADMIN" | "USER".
  // `import type` keeps the server auth module out of the client bundle.
  plugins: [inferAdditionalFields<typeof auth>()],
});
