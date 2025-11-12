import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScraperManager } from '@/lib/scrapers';
import { db } from '@/db/index';
import { resources, members, events } from '@/db/schema/tnt-resources';
import { eq, sql } from 'drizzle-orm';

const scrapeRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  platforms: z.array(z.enum(['bilibili', 'douyin', 'youtube', 'weibo', 'other'])).optional(),
  maxResults: z.coerce.number().int().min(1).max(100).default(20),
  includeDetails: z.boolean().default(true),
  storeInDb: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scrapeRequestSchema.parse(body);

    console.log(`🕷️ Starting manual scraping: ${validatedData.query}`);

    const scraperManager = new ScraperManager();
    const scrapeResult = await scraperManager.searchAll(validatedData.query, {
      platforms: validatedData.platforms,
      maxResults: validatedData.maxResults,
      includeDetails: validatedData.includeDetails,
    });

    let storedCount = 0;
    let duplicates = 0;

    // Store results in database if requested
    if (validatedData.storeInDb && scrapeResult.success) {
      console.log(`💾 Storing ${scrapeResult.resources.length} scraped resources...`);

      for (const resource of scrapeResult.resources) {
        try {
          // Check for duplicates
          const existing = await db
            .select({ id: resources.id })
            .from(resources)
            .where(eq(resources.url, resource.url))
            .limit(1);

          if (existing.length > 0) {
            duplicates++;
            continue;
          }

          // Find member ID if member names are provided
          let memberId: string | undefined;
          if (resource.memberNames && resource.memberNames.length > 0) {
            const member = await db
              .select({ id: members.id })
              .from(members)
              .where(sql`${members.name} = ${resource.memberNames[0]} OR ${members.stageName} = ${resource.memberNames[0]}`)
              .limit(1);

            if (member.length > 0) {
              memberId = member[0].id;
            }
          }

          // Find event ID if event names are provided
          let eventId: string | undefined;
          if (resource.eventNames && resource.eventNames.length > 0) {
            const event = await db
              .select({ id: events.id })
              .from(events)
              .where(eq(events.title, resource.eventNames[0]))
              .limit(1);

            if (event.length > 0) {
              eventId = event[0].id;
            }
          }

          // Insert new resource
          await db.insert(resources).values({
            title: resource.title,
            url: resource.url,
            downloadUrl: resource.downloadUrl,
            resourceType: resource.resourceType,
            platform: resource.platform,
            memberId,
            eventId,
            uploadDate: resource.uploadDate,
            duration: resource.duration,
            description: resource.description,
            thumbnailUrl: resource.thumbnailUrl,
          });

          storedCount++;

        } catch (error) {
          console.error(`Failed to store resource: ${resource.title}`, error);
          scrapeResult.warnings.push(`Failed to store: ${resource.title}`);
        }
      }

      console.log(`✅ Stored ${storedCount} new resources, skipped ${duplicates} duplicates`);
    }

    return NextResponse.json({
      success: true,
      data: {
        resources: scrapeResult.resources,
        stats: {
          totalFound: scrapeResult.resources.length,
          storedInDb: storedCount,
          duplicates: duplicates,
          errors: scrapeResult.errors.length,
          warnings: scrapeResult.warnings.length,
        },
        warnings: scrapeResult.warnings,
        errors: scrapeResult.errors,
      },
      meta: {
        query: validatedData.query,
        platforms: validatedData.platforms,
        scrapedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Scrape API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Scraping failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}