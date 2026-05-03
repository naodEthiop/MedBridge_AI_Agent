export type TenantContext = {
  tenantId: string;
  region?: 'africa-east' | 'europe-west' | 'global-fallback';
};

export function resolveTenantContext(request: Request): TenantContext {
  const tenantId = request.headers.get('x-tenant-id')?.trim();
  if (!tenantId) {
    throw new Error('Missing tenant context (x-tenant-id)');
  }
  const regionHeader = request.headers.get('x-region')?.trim();
  const region = regionHeader === 'africa-east' || regionHeader === 'europe-west' ? regionHeader : 'global-fallback';
  return { tenantId, region };
}

export function requireTenantId(tenantId?: string | null): string {
  if (!tenantId) throw new Error('Tenant isolation guard: tenantId is required');
  return tenantId;
}
