import { NextResponse } from 'next/server';

import { getAuthenticatedUser, UnauthorizedError } from '@/lib/server/auth';
import { getRepositories } from '@/lib/server/repositories';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');
    if (!otherUserId) {
      return NextResponse.json({ ok: false, error: 'otherUserId is required' }, { status: 400 });
    }

    const repos = getRepositories();
    const conversation = await repos.messages.listConversation(user.id, otherUserId);
    return NextResponse.json({ ok: true, conversation });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = (await request.json()) as {
      receiverId: string;
      message: string;
      attachments?: Record<string, unknown>;
    };

    if (!body.receiverId || !body.message?.trim()) {
      return NextResponse.json({ ok: false, error: 'receiverId and message are required' }, { status: 400 });
    }

    const repos = getRepositories();
    const created = await repos.messages.createMessage({
      senderId: user.id,
      receiverId: body.receiverId,
      role: user.role,
      message: body.message.trim(),
      attachments: body.attachments ?? {},
    });

    return NextResponse.json({ ok: true, message: created });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
