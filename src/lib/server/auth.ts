import { UnauthorizedError } from "@/lib/server/authErrors";
import { resolveSessionPrincipal } from "@/lib/server/sessionPrincipal";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  role: "patient" | "doctor";
  tenantId: string;
};

export { UnauthorizedError } from "@/lib/server/authErrors";

/**
 * Cookie- or Bearer-based auth (sealed MedBridge session or Supabase access token).
 * @throws UnauthorizedError when unauthenticated
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const principal = await resolveSessionPrincipal(request);
  if (!principal) {
    throw new UnauthorizedError();
  }
  return {
    id: principal.userId,
    email: principal.email,
    role: principal.role,
    tenantId: principal.tenantId,
  };
}
