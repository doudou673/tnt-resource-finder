import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/index';
import { resources, members, events, ResourceTypeType, PlatformType } from '@/db/schema/tnt-resources';
import { sql, ilike, eq, and, or, desc, asc } from 'drizzle-orm';
import { ScraperManager } from '@/lib/scrapers';

// Search query validation schema
const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  type: z.enum(['video', 'audio', 'film', 'other']).optional(),
  member: z.string().uuid().optional(),
  event: z.string().uuid().optional(),
  platform: z.enum(['bilibili', 'douyin', 'youtube', 'weibo', 'other']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['relevance', 'date', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  searchOnline: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const validatedQuery = searchQuerySchema.parse(queryParams);

    console.log(`🔍 API Search: ${validatedQuery.query}`);

    // Start building the database query
    const conditions = [];

    // Main text search across multiple fields
    if (validatedQuery.query) {
      const searchTerm = `%${validatedQuery.query}%`;
      conditions.push(
        or(
          ilike(resources.title, searchTerm),
          ilike(resources.description, searchTerm)
        )
      );
    }

    // Filter by resource type
    if (validatedQuery.type) {
      conditions.push(eq(resources.resourceType, validatedQuery.type as ResourceTypeType));
    }

    // Filter by member
    if (validatedQuery.member) {
      conditions.push(eq(resources.memberId, validatedQuery.member));
    }

    // Filter by event
    if (validatedQuery.event) {
      conditions.push(eq(resources.eventId, validatedQuery.event));
    }

    // Filter by platform
    if (validatedQuery.platform) {
      conditions.push(eq(resources.platform, validatedQuery.platform as PlatformType));
    }

    // Build the main query
    let query = db
      .select({
        id: resources.id,
        title: resources.title,
        url: resources.url,
        downloadUrl: resources.downloadUrl,
        resourceType: resources.resourceType,
        platform: resources.platform,
        uploadDate: resources.uploadDate,
        duration: resources.duration,
        description: resources.description,
        thumbnailUrl: resources.thumbnailUrl,
        scrapedAt: resources.scrapedAt,
        createdAt: resources.createdAt,
        member: {
          id: members.id,
          name: members.name,
          stageName: members.stageName,
          groupRole: members.groupRole,
        },
        event: {
          id: events.id,
          title: events.title,
          eventDate: events.eventDate,
          description: events.description,
          venue: events.venue,
        },
      })
      .from(resources)
      .leftJoin(members, eq(resources.memberId, members.id))
      .leftJoin(events, eq(resources.eventId, events.id));

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    switch (validatedQuery.sortBy) {
      case 'date':
        query = query.orderBy(
          validatedQuery.sortOrder === 'asc'
            ? asc(resources.uploadDate)
            : desc(resources.uploadDate)
        );
        break;
      case 'title':
        query = query.orderBy(
          validatedQuery.sortOrder === 'asc'
            ? asc(resources.title)
            : desc(resources.title)
        );
        break;
      case 'relevance':
      default:
        // For relevance, prioritize recent content and exact matches
        if (validatedQuery.query) {
          query = query.orderBy(
            desc(resources.scrapedAt),
            desc(resources.createdAt)
          );
        } else {
          query = query.orderBy(desc(resources.createdAt));
        }
        break;
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(resources)
      .leftJoin(members, eq(resources.memberId, members.id))
      .leftJoin(events, eq(resources.eventId, events.id));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [totalResult] = await countQuery;
    const total = totalResult?.count || 0;

    // Apply pagination
    query = query.limit(validatedQuery.limit).offset(validatedQuery.offset);

    // Execute the main search query
    const results = await query;

    // If no results found and online search is enabled, search online
    let onlineResults: any[] = [];
    let onlineWarnings: string[] = [];

    if (results.length === 0 && validatedQuery.searchOnline !== false) {
      console.log('🌐 No local results found, searching online...');
      try {
        const scraperManager = new ScraperManager();
        const onlineSearch = await scraperManager.searchAll(validatedQuery.query, {
          platforms: validatedQuery.platform ? [validatedQuery.platform as PlatformType] : undefined,
          maxResults: 10,
          includeDetails: true
        });

        if (onlineSearch.success) {
          onlineResults = onlineSearch.resources;
          onlineWarnings = onlineSearch.warnings;

          // Store new resources in database (async, don't wait for completion)
          storeOnlineResults(onlineResults).catch(error => {
            console.error('Failed to store online results:', error);
          });
        }
      } catch (error) {
        console.error('Online search failed:', error);
        onlineWarnings.push('Online search failed, showing only local results');
      }
    }

    // Combine local and online results
    const allResults = [...results, ...onlineResults];

    const response = {
      success: true,
      data: {
        results: allResults,
        pagination: {
          total: total + onlineResults.length,
          localTotal: total,
          onlineTotal: onlineResults.length,
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: (validatedQuery.offset + validatedQuery.limit) < (total + onlineResults.length),
        },
        filters: {
          query: validatedQuery.query,
          type: validatedQuery.type,
          member: validatedQuery.member,
          event: validatedQuery.event,
          platform: validatedQuery.platform,
        },
      },
      warnings: onlineWarnings.length > 0 ? onlineWarnings : undefined,
      meta: {
        searchTime: new Date().toISOString(),
        includesOnline: onlineResults.length > 0,
      }
    };

    // Add caching headers for better performance
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 minutes client, 10 minutes CDN
        'Vercel-CDN-Cache-Control': 'public, max-age=600, s-maxage=1800', // 10 minutes Vercel CDN
      }
    });

  } catch (error) {
    console.error('Search API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Store online search results in the database (async function)
 */
async function storeOnlineResults(onlineResults: any[]) {
  try {
    console.log(`💾 Storing ${onlineResults.length} online search results in database`);

    for (const result of onlineResults) {
      // Check if resource already exists
      const existing = await db
        .select({ id: resources.id })
        .from(resources)
        .where(eq(resources.url, result.url))
        .limit(1);

      if (existing.length === 0) {
        // Insert new resource
        await db.insert(resources).values({
          title: result.title,
          url: result.url,
          downloadUrl: result.downloadUrl,
          resourceType: result.resourceType,
          platform: result.platform,
          uploadDate: result.uploadDate,
          duration: result.duration,
          description: result.description,
          thumbnailUrl: result.thumbnailUrl,
        });

        console.log(`✅ Stored new resource: ${result.title}`);
      }
    }

    console.log('✅ All online results stored successfully');
  } catch (error) {
    console.error('❌ Failed to store online results:', error);
    throw error;
  }
}