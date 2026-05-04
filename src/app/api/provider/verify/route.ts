import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories, repositoryPrincipalFromAuthenticatedUser } from '@/lib/server/repositories';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    const body = (await request.json()) as {
      providerName?: string;
      licenseNumber?: string;
      clinic?: string;
    };

    const providerName = body.providerName?.trim();
    if (!providerName) {
      return NextResponse.json({ ok: false, error: 'providerName is required' }, { status: 400 });
    }

    const repos = getRepositories(repositoryPrincipalFromAuthenticatedUser(user));
    const doctors = await repos.doctors.listDoctors();
    const matched = doctors.find((d) => d.fullName.toLowerCase().includes(providerName.toLowerCase()));

    return NextResponse.json({
      ok: true,
      data: {
        providerName,
        verified: !!matched,
        status: matched ? 'verified' : 'not_found',
        details: matched
          ? {
              doctorId: matched.id,
              specialty: matched.specialization,
              clinic: matched.clinicName ?? body.clinic ?? null,
              note: 'Provider matched existing doctor records.',
            }
          : {
              note: 'No matching provider record found in current backend data.',
            },
        submitted: {
          licenseNumber: body.licenseNumber ?? null,
          clinic: body.clinic ?? null,
        },
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unable to verify provider';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

