import { NextResponse } from 'next/server';
import { seedDemoDataIfEmpty } from '@/lib/db/seedData';

export async function POST() {
  try {
    await seedDemoDataIfEmpty();
    return NextResponse.json({ success: true, message: 'Demo data seeded successfully' });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}