import { getRepositories } from '@/lib/server/repositories';
import { requireTenantId } from '@/lib/tenant/tenantContext';

export function getTenantRepositories(tenantId: string) {
  requireTenantId(tenantId);
  const repos = getRepositories();
  return {
    ...repos,
    patients: {
      ...repos.patients,
      async listPatients() {
        return (await repos.patients.listPatients()).filter((p) => (p as unknown as { tenantId?: string }).tenantId === tenantId);
      },
    },
  };
}
