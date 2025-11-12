import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/index';
import { events } from '@/db/schema/tnt-resources';
import { ilike, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db.select().from(events);

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        or(
          ilike(events.title, searchTerm),
          ilike(events.description, searchTerm),
          ilike(events.venue, searchTerm)
        )
      );
    }

    const results = await query.orderBy(desc(events.eventDate));

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}