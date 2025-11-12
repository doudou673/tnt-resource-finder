import { BilibiliScraper } from './bilibili';
import { DouyinScraper } from './douyin';
import { BaseScraper, ScraperResult, ScrapedResource } from './types';
import { PlatformType } from '@/db/schema/tnt-resources';

export interface SearchOptions {
  platforms?: PlatformType[];
  maxResults?: number;
  includeDetails?: boolean; // Whether to fetch detailed information
}

export class ScraperManager {
  private scrapers: Map<PlatformType, BaseScraper>;

  constructor() {
    this.scrapers = new Map([
      ['bilibili', new BilibiliScraper()],
      ['douyin', new DouyinScraper()],
      // Add more scrapers here in the future
      // ['youtube', new YouTubeScraper()],
      // ['weibo', new WeiboScraper()],
    ]);
  }

  /**
   * Search for resources across multiple platforms
   */
  async searchAll(query: string, options: SearchOptions = {}): Promise<ScraperResult> {
    const {
      platforms = ['bilibili', 'douyin'],
      maxResults = 30,
      includeDetails = false
    } = options;

    console.log(`🔍 Starting search across platforms: ${platforms.join(', ')}`);

    const allResources: ScrapedResource[] = [];
    const allErrors: any[] = [];
    const warnings: string[] = [];

    // Run searches in parallel for efficiency
    const searchPromises = platforms.map(async (platform) => {
      const scraper = this.scrapers.get(platform);
      if (!scraper) {
        warnings.push(`Scraper not available for platform: ${platform}`);
        return [];
      }

      try {
        console.log(`🔄 Searching on ${platform}...`);
        const searchResults = await scraper.search(query, maxResults);

        if (includeDetails) {
          // Extract detailed information for each result
          const detailedResults = await Promise.allSettled(
            searchResults.map(async (result) => {
              const details = await scraper.extractResourceDetails(result.url);
              return details;
            })
          );

          const validResources = detailedResults
            .filter((result): result is PromiseFulfilledResult<ScrapedResource> =>
              result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);

          console.log(`✅ ${platform}: Found ${validResources.length} detailed resources`);
          return validResources;
        } else {
          // Create basic resources from search results
          const basicResources = searchResults.map(result => ({
            title: result.title,
            url: result.url,
            resourceType: 'video' as const, // Default to video
            platform: platform,
            description: result.uploadTime ? `上传时间: ${result.uploadTime}` : undefined,
            duration: result.duration,
            thumbnailUrl: result.thumbnailUrl,
          }));

          console.log(`✅ ${platform}: Found ${basicResources.length} basic resources`);
          return basicResources;
        }

      } catch (error) {
        console.error(`❌ Search failed on ${platform}:`, error);
        allErrors.push({ platform, error: error instanceof Error ? error.message : String(error) });
        return [];
      }
    });

    const results = await Promise.all(searchPromises);

    // Flatten all results
    results.forEach(platformResults => {
      allResources.push(...platformResults);
    });

    // Process and validate all resources
    const finalResult = await this.processScrapedResources(allResources);
    finalResult.errors.push(...allErrors);
    finalResult.warnings.push(...warnings);

    console.log(`🎉 Search completed: ${finalResult.resources.length} valid resources found`);
    return finalResult;
  }

  /**
   * Extract detailed information from a specific URL
   */
  async extractResourceDetails(url: string): Promise<ScrapedResource | null> {
    // Determine which scraper to use based on URL
    const platform = this.detectPlatform(url);
    const scraper = this.scrapers.get(platform);

    if (!scraper) {
      console.error(`No scraper available for platform: ${platform}`);
      return null;
    }

    try {
      console.log(`🔍 Extracting details from ${platform}: ${url}`);
      const resource = await scraper.extractResourceDetails(url);
      console.log(`✅ Successfully extracted details: ${resource?.title || 'Unknown'}`);
      return resource;
    } catch (error) {
      console.error(`❌ Failed to extract details:`, error);
      return null;
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): PlatformType {
    if (url.includes('bilibili.com') || url.includes('b23.tv/')) {
      return 'bilibili';
    }
    if (url.includes('douyin.com') || url.includes('v.douyin.com')) {
      return 'douyin';
    }
    // Default to other if unknown
    return 'other';
  }

  /**
   * Process and validate scraped resources (duplicates, validation, etc.)
   */
  private async processScrapedResources(resources: ScrapedResource[]): Promise<ScraperResult> {
    const uniqueResources = new Map<string, ScrapedResource>();
    const errors: any[] = [];
    const warnings: string[] = [];

    // Deduplicate by URL (normalized)
    resources.forEach(resource => {
      const normalizedUrl = this.normalizeUrl(resource.url);
      const existing = uniqueResources.get(normalizedUrl);

      if (!existing) {
        uniqueResources.set(normalizedUrl, resource);
      } else {
        // Merge information if the new resource has more details
        if (resource.description && !existing.description) {
          existing.description = resource.description;
        }
        if (resource.duration && !existing.duration) {
          existing.duration = resource.duration;
        }
        if (resource.thumbnailUrl && !existing.thumbnailUrl) {
          existing.thumbnailUrl = resource.thumbnailUrl;
        }
        if (resource.memberNames && resource.memberNames.length > 0) {
          existing.memberNames = [...new Set([...(existing.memberNames || []), ...resource.memberNames])];
        }
        if (resource.eventNames && resource.eventNames.length > 0) {
          existing.eventNames = [...new Set([...(existing.eventNames || []), ...resource.eventNames])];
        }

        warnings.push(`Duplicate resource merged: ${resource.title}`);
      }
    });

    // Validate resources
    const validResources: ScrapedResource[] = [];
    uniqueResources.forEach(resource => {
      const validation = this.validateResource(resource);
      if (validation.isValid) {
        validResources.push(resource);
      } else {
        errors.push(...validation.errors);
        warnings.push(`Invalid resource skipped: ${resource.title}`);
      }
    });

    return {
      success: validResources.length > 0,
      resources: validResources,
      errors,
      warnings
    };
  }

  /**
   * Normalize URL for deduplication
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove tracking parameters and normalize
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'share', 'from'];
      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  }

  /**
   * Validate resource (basic implementation)
   */
  private validateResource(resource: ScrapedResource): { isValid: boolean; errors: any[] } {
    const errors: any[] = [];

    if (!resource.title || resource.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!resource.url) {
      errors.push({ field: 'url', message: 'URL is required' });
    }

    // Check if URL is valid
    try {
      new URL(resource.url);
    } catch {
      errors.push({ field: 'url', message: 'Invalid URL format' });
    }

    // Check if resource is related to TNT
    const tntKeywords = ['时代少年团', 'TNT', '马嘉祺', '丁程鑫', '宋亚轩', '刘耀文', '张真源', '严浩翔', '贺峻霖'];
    const hasTntKeywords = tntKeywords.some(keyword =>
      resource.title.toLowerCase().includes(keyword.toLowerCase())
    ) ||
    (resource.memberNames && resource.memberNames.length > 0) ||
    (resource.eventNames && resource.eventNames.length > 0);

    if (!hasTntKeywords) {
      errors.push({
        field: 'relevance',
        message: 'Resource must be related to Teens in Times'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.scrapers.keys()) as PlatformType[];
  }

  /**
   * Get statistics about the scrapers
   */
  getStats(): { [platform: string]: any } {
    const stats: any = {};
    this.scrapers.forEach((scraper, platform) => {
      stats[platform] = {
        platform,
        config: scraper.config,
        available: true
      };
    });
    return stats;
  }
}