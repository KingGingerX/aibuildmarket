import { auth } from "./auth";

// Returns the session if the caller is an authenticated admin, otherwise null.
// Callers must treat a null return as "deny" — do not fall back to defaults.
export async function requireAdmin() {
  const session = await auth();
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);
  if (!session?.user || !isAdmin) return null;
  return session;
}
