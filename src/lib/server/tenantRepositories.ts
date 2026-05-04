import { getRepositories } from '@/lib/server/repositories';
import { requireTenantId } from '@/lib/tenant/tenantContext';

/** Server-side tenant-scoped repos (e.g. admin jobs). Uses explicit tenantId with system audit user. */
export function getTenantRepositories(tenantId: string) {
  requireTenantId(tenantId);
  return getRepositories({ tenantId, userId: 'tenant-repository', role: 'admin' });
}
