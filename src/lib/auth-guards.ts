import { headers } from "next/headers";
import { auth } from "../../lib/auth";

/**
 * An error whose `message` is safe to surface directly to the client.
 * Anything that is NOT a PublicError should be treated as an internal
 * failure and reported to the user with a generic message.
 */
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

/** Thrown when the caller is not authenticated / not authorized. */
export class AuthError extends PublicError {
  constructor(message = "Unauthorized: you must be signed in.") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Returns the currently authenticated user, or `null` for guests.
 * Never trust a user id supplied by the client — always derive it here.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Requires an authenticated user. Throws {@link AuthError} otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

/** Requires an authenticated ADMIN user. Throws {@link AuthError} otherwise. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AuthError("Unauthorized: admin privileges are required.");
  }
  return user;
}

/**
 * Normalizes any thrown value into a safe, user-facing message.
 * Business/auth errors (PublicError) are passed through; everything else
 * (DB errors, bugs) is masked behind a generic fallback so we never leak
 * raw error strings or stack details to the client.
 */
export function toPublicMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  return error instanceof PublicError ? error.message : fallback;
}
