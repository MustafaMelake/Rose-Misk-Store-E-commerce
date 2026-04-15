import "better-auth";

declare module "better-auth" {
  interface User {
    role: "ADMIN" | "USER"; // أو string لو مش عايز تقيدها
  }
  interface Session {
    user: User;
  }
}
