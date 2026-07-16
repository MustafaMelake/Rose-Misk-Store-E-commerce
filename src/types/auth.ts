import type { auth } from "@/lib/auth";

/**
 * Session shape inferred directly from the Better Auth server config
 * (`auth.$Infer`) — the officially supported pattern. Because `role` is
 * declared as a literal-array additional field, `SessionUser["role"]` is the
 * strict union "ADMIN" | "USER", not a loose `string`.
 *
 * This replaces the old `declare module "better-auth"` augmentation, which
 * silently failed to merge (Better Auth's `User` is an inferred type alias,
 * not an interface).
 */
export type Session = typeof auth.$Infer.Session;

/** The authenticated user carried by a session. */
export type SessionUser = Session["user"];
