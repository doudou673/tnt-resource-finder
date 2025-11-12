import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/index';
import { members } from '@/db/schema/tnt-resources';
import { ilike, or, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db.select().from(members);

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        or(
          ilike(members.name, searchTerm),
          ilike(members.stageName, searchTerm),
          ilike(members.groupRole, searchTerm)
        )
      );
    }

    const results = await query.orderBy(members.stageName);

    return NextResponse.json({
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Members API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch members',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}