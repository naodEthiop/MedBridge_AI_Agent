MedBridge is a Next.js (App Router) + Tailwind v4 project styled from a Stitch design system (Sahara-inspired palette).

## Getting Started

### Development

```bash
npm run dev
```

### Data sources

- The UI fetches data from Next.js route handlers under `src/app/api/*`.
- The server-side repository layer lives in `src/lib/server/repositories.ts`.
- If you set Supabase env vars, the API switches from mock data to Supabase automatically:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Routes (from Stitch screens)

- `/` Welcome to MedBridge AI
- `/onboarding` Patient Onboarding
- `/patient` Patient Dashboard
- `/patient/symptom-checker` Patient: AI Symptom Checker
- `/patient/scanners` Patient: AI Scanners
- `/patient/care-finder` Patient: Emergency & Care Finder
- `/patient/health-card` My Digital Health Card
- `/doctor` Doctor: Clinical Dashboard
- `/doctor/patients/[id]` Doctor: Patient Detail View
- `/provider/verification` Provider Verification

### Stitch sync

- Screen mapping manifest: `src/stitch/manifest.json`
- Sync all Stitch HTML exports:

```bash
npm run sync:stitch
```

This writes the latest HTML snapshots to `src/stitch/html/`.

### Smoke test

Run route + API smoke checks end-to-end:

```bash
npm run test:smoke
```

### Production build

```bash
npm run lint
npm run build
npm run start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
