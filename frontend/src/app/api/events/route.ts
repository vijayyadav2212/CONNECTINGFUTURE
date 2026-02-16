import { NextRequest, NextResponse } from 'next/server';

// Dummy in-memory event store (replace with DB integration)
let events: any[] = [];

export async function GET() {
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const newEvent = { ...data, id: Date.now() };
  events.push(newEvent);
  return NextResponse.json(newEvent, { status: 201 });
}
