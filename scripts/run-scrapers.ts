#!/usr/bin/env tsx

import 'dotenv/config';
import { ScraperManager } from '../lib/scrapers';
import { db } from '../db/index';
import { resources, members, events } from '../db/schema/tnt-resources';
import { eq, sql, desc } from 'drizzle-orm';

interface ScraperStats {
  platform: string;
  totalFound: number;
  newResources: number;
  duplicates: number;
  errors: number;
  duration: number;
}

interface TotalStats {
  total: ScraperStats[];
  summary: {
    totalResources: number;
    newResources: number;
    duplicates: number;
    errors: number;
    duration: number;
  };
}

async function runScrapers() {
  console.log('🚀 Starting comprehensive resource scraping...');
  console.log('='.repeat(50));

  const startTime = Date.now();
  const scraperManager = new ScraperManager();
  const totalStats: ScraperStats[] = [];

  // Get current database stats before scraping
  const beforeStats = await getDatabaseStats();
  console.log('📊 Database stats before scraping:', beforeStats);

  // Define search queries for comprehensive coverage
  const searchQueries = [
    // Individual members
    '马嘉祺',
    '丁程鑫',
    '宋亚轩',
    '刘耀文',
    '张真源',
    '严浩翔',
    '贺峻霖',

    // Group names
    '时代少年团',
    'TNT',
    'Teens in Times',

    // Event-related terms
    '演唱会',
    'MV',
    '舞台',
    '综艺',
    '采访',
    '练习室',

    // Song names
    '要你管',
    '姐姐真漂亮',
    '无尽的冒险',
    '朱雀',

    // Combinations
    '马嘉祺 宋亚轩',
    '丁程鑫 刘耀文',
    '时代少年团 演唱会',
  ];

  const platforms = ['bilibili', 'douyin']; // Start with main platforms

  console.log(`🔍 Will search for ${searchQueries.length} queries across ${platforms.length} platforms`);

  // Run scraping for each query and platform
  for (const query of searchQueries) {
    console.log(`\n📝 Searching for: "${query}"`);

    for (const platform of platforms) {
      const platformStartTime = Date.now();

      try {
        console.log(`  🌐 ${platform}: Searching...`);

        const result = await scraperManager.searchAll(query, {
          platforms: [platform as any],
          maxResults: 30, // Reasonable limit per query
          includeDetails: true,
        });

        const duration = Date.now() - platformStartTime;
        let newResources = 0;
        let duplicates = 0;

        if (result.success && result.resources.length > 0) {
          // Store results in database
          for (const resource of result.resources) {
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

              newResources++;
            } catch (error) {
              console.error(`    ❌ Failed to store resource: ${resource.title}`, error);
            }
          }

          console.log(`  ✅ ${platform}: Found ${result.resources.length}, New: ${newResources}, Duplicates: ${duplicates}, Warnings: ${result.warnings.length}`);
        } else {
          console.log(`  ⚠️ ${platform}: No results found`);
        }

        // Record stats
        totalStats.push({
          platform,
          totalFound: result.resources.length,
          newResources,
          duplicates,
          errors: result.errors.length,
          duration,
        });

      } catch (error) {
        const duration = Date.now() - platformStartTime;
        console.error(`  ❌ ${platform}: Failed`, error);

        totalStats.push({
          platform,
          totalFound: 0,
          newResources: 0,
          duplicates: 0,
          errors: 1,
          duration,
        });
      }

      // Add delay between requests to avoid rate limiting
      console.log(`    ⏳ Waiting 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Calculate total stats
  const totalDuration = Date.now() - startTime;
  const summary = {
    totalResources: totalStats.reduce((sum, stat) => sum + stat.totalFound, 0),
    newResources: totalStats.reduce((sum, stat) => sum + stat.newResources, 0),
    duplicates: totalStats.reduce((sum, stat) => sum + stat.duplicates, 0),
    errors: totalStats.reduce((sum, stat) => sum + stat.errors, 0),
    duration: totalDuration,
  };

  // Get final database stats
  const afterStats = await getDatabaseStats();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Scraping completed!');
  console.log('\n📊 Summary:');
  console.log(`  Total duration: ${(summary.duration / 1000).toFixed(2)} seconds`);
  console.log(`  Total resources found: ${summary.totalResources}`);
  console.log(`  New resources added: ${summary.newResources}`);
  console.log(`  Duplicates skipped: ${summary.duplicates}`);
  console.log(`  Errors encountered: ${summary.errors}`);

  console.log('\n📈 Database changes:');
  console.log(`  Before: ${beforeStats.totalResources} total resources`);
  console.log(`  After:  ${afterStats.totalResources} total resources`);
  console.log(`  Growth: +${afterStats.totalResources - beforeStats.totalResources} resources`);

  console.log('\n🌐 Platform breakdown:');
  const platformStats = totalStats.reduce((acc, stat) => {
    if (!acc[stat.platform]) {
      acc[stat.platform] = { totalFound: 0, newResources: 0, duplicates: 0, errors: 0 };
    }
    acc[stat.platform].totalFound += stat.totalFound;
    acc[stat.platform].newResources += stat.newResources;
    acc[stat.platform].duplicates += stat.duplicates;
    acc[stat.platform].errors += stat.errors;
    return acc;
  }, {} as Record<string, any>);

  Object.entries(platformStats).forEach(([platform, stats]: [string, any]) => {
    console.log(`  ${platform}:`);
    console.log(`    Found: ${stats.totalFound}`);
    console.log(`    New: ${stats.newResources}`);
    console.log(`    Duplicates: ${stats.duplicates}`);
    console.log(`    Errors: ${stats.errors}`);
  });

  // Log any warnings that occurred
  const allWarnings = [];
  for (const query of searchQueries) {
    for (const platform of platforms) {
      try {
        const result = await scraperManager.searchAll(query, {
          platforms: [platform as any],
          maxResults: 1,
        });
        if (result.warnings.length > 0) {
          allWarnings.push(...result.warnings);
        }
      } catch (error) {
        // Already logged above
      }
    }
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️ Warnings encountered:');
    const uniqueWarnings = [...new Set(allWarnings)];
    uniqueWarnings.forEach(warning => console.log(`  - ${warning}`));
  }

  console.log('\n✨ All done!');

  return {
    success: summary.errors === 0,
    stats: totalStats,
    summary,
    beforeStats,
    afterStats,
  };
}

async function getDatabaseStats() {
  const totalResources = await db
    .select({ count: sql<number>`count(*)` })
    .from(resources);

  const resourcesByType = await db
    .select({
      resourceType: resources.resourceType,
      count: sql<number>`count(*)`,
    })
    .from(resources)
    .groupBy(resources.resourceType);

  const resourcesByPlatform = await db
    .select({
      platform: resources.platform,
      count: sql<number>`count(*)`,
    })
    .from(resources)
    .groupBy(resources.platform);

  return {
    totalResources: totalResources[0]?.count || 0,
    resourcesByType: resourcesByType.reduce((acc, row) => {
      acc[row.resourceType] = row.count;
      return acc;
    }, {} as Record<string, number>),
    resourcesByPlatform: resourcesByPlatform.reduce((acc, row) => {
      acc[row.platform] = row.count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// Run the scrapers if this file is executed directly
if (require.main === module) {
  runScrapers()
    .then((result) => {
      console.log('\n🎯 Scraper execution finished');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Scraper execution failed:', error);
      process.exit(1);
    });
}

export { runScrapers };