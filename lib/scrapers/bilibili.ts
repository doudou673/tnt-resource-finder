import * as cheerio from 'cheerio';
import { BaseScraperImpl } from './base-scraper';
import { ScrapedResource, SearchResult, ResourceValidationError } from './types';
import { ResourceTypeType, PlatformType } from '@/db/schema/tnt-resources';

export class BilibiliScraper extends BaseScraperImpl {
  constructor(config = {}) {
    super('bilibili' as PlatformType, {
      delayMs: 2000, // 2 seconds delay
      ...config
    });
  }

  isValidUrl(url: string): boolean {
    return url.includes('bilibili.com/video/') || url.includes('b23.tv/');
  }

  getSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://search.bilibili.com/all?keyword=${encodedQuery}&search_source=1`;
  }

  async search(query: string, maxResults = 50): Promise<SearchResult[]> {
    console.log(`🔍 Bilibili search: ${query}`);

    try {
      const searchUrl = this.getSearchUrl(query);
      const response = await this.retryWithBackoff(() => this.http.get(searchUrl));
      const $ = cheerio.load(response.data);

      const results: SearchResult[] = [];

      $('.video-card, .bili-video-card').each((index, element) => {
        if (results.length >= maxResults) return false;

        const $card = $(element);

        // Extract basic information
        const titleElement = $card.find('.title, .bili-video-card__info--tit');
        const title = titleElement.text().trim();
        const linkElement = $card.find('a[href*="bilibili.com/video/"]').first();
        const href = linkElement.attr('href') || '';
        const url = href.startsWith('http') ? href : `https:${href}`;

        // Extract duration
        const durationText = $card.find('.duration, .bili-video-card__stats--duration').text().trim();
        const duration = this.parseDuration(durationText);

        // Extract view count
        const viewText = $card.find('.playinfo, .bili-video-card__stats--item').first().text().trim();
        const viewCount = this.parseViewCount(viewText);

        // Extract author
        const author = $card.find('.upname, .bili-video-card__info--author').text().trim();

        // Extract thumbnail
        const thumbnailElement = $card.find('img');
        const thumbnailUrl = thumbnailElement.attr('src') || thumbnailElement.attr('data-src');

        // Extract upload time
        const uploadTime = $card.find('.time, .bili-video-card__info--date').text().trim();

        if (title && url && this.isValidUrl(url)) {
          results.push({
            id: this.extractBvidFromUrl(url),
            title,
            url,
            duration,
            viewCount,
            uploadTime,
            thumbnailUrl,
            author
          });
        }
      });

      console.log(`✅ Found ${results.length} results from Bilibili`);
      return results;

    } catch (error) {
      console.error('❌ Bilibili search failed:', error);
      return [];
    }
  }

  async extractResourceDetails(url: string): Promise<ScrapedResource | null> {
    console.log(`📄 Extracting Bilibili resource details: ${url}`);

    try {
      const response = await this.retryWithBackoff(() => this.http.get(url));
      const $ = cheerio.load(response.data);

      // Extract title
      const title = $('h1, .video-title, .tit').first().text().trim() || '';

      // Extract description
      const description = $('.desc, .video-desc, .info').first().text().trim() || '';

      // Extract upload date
      const uploadDateText = $('.pubdate, .upload-info, .time').text().trim();
      const uploadDate = this.parseUploadDate(uploadDateText);

      // Extract duration
      const durationText = $('.duration, .time').text().trim();
      const duration = this.parseDuration(durationText);

      // Extract thumbnail
      const thumbnailUrl = $('meta[property="og:image"]').attr('content') ||
                          $('.poster, .cover img').attr('src') || '';

      // Determine resource type (usually video for Bilibili)
      const resourceType: ResourceTypeType = this.determineResourceType(title, description);

      // Extract member and event names
      const fullText = `${title} ${description}`;
      const memberNames = this.extractMemberNames(fullText);
      const eventNames = this.extractEventNames(fullText);

      // Construct download URL (simplified - actual implementation would need Bilibili API)
      const downloadUrl = await this.getDownloadUrl(url);

      const resource: ScrapedResource = {
        title,
        url,
        downloadUrl,
        resourceType,
        platform: this.platform as PlatformType,
        uploadDate,
        duration,
        description,
        thumbnailUrl,
        memberNames,
        eventNames
      };

      return resource;

    } catch (error) {
      console.error(`❌ Failed to extract Bilibili resource details: ${url}`, error);
      return null;
    }
  }

  /**
   * Extract BV ID from Bilibili URL
   */
  private extractBvidFromUrl(url: string): string {
    const match = url.match(/BV[0-9A-Za-z]+/);
    return match ? match[0] : '';
  }

  /**
   * Parse duration string (e.g., "3:45" -> 225 seconds)
   */
  private parseDuration(durationText: string): number | undefined {
    if (!durationText) return undefined;

    const match = durationText.match(/(?:(\d+):)?(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return undefined;
  }

  /**
   * Parse view count (e.g., "1.2万", "3456" -> number)
   */
  private parseViewCount(viewText: string): number | undefined {
    if (!viewText) return undefined;

    const cleanText = viewText.replace(/[^0-9.万千]/g, '');

    if (cleanText.includes('万')) {
      const num = parseFloat(cleanText.replace('万', ''));
      return Math.floor(num * 10000);
    }

    if (cleanText.includes('千')) {
      const num = parseFloat(cleanText.replace('千', ''));
      return Math.floor(num * 1000);
    }

    const num = parseInt(cleanText);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse upload date
   */
  private parseUploadDate(dateText: string): Date | undefined {
    if (!dateText) return undefined;

    try {
      // Handle different date formats
      if (dateText.includes('年')) {
        // Chinese format: "2023年12月1日"
        const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (match) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
      }

      if (dateText.includes('-')) {
        // ISO format: "2023-12-01"
        return new Date(dateText);
      }

      // Try standard date parsing
      return new Date(dateText);
    } catch {
      return undefined;
    }
  }

  /**
   * Determine resource type based on title and description
   */
  private determineResourceType(title: string, description: string): ResourceTypeType {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('音频') || text.includes('纯音乐') || text.includes('audio')) {
      return 'audio';
    }

    if (text.includes('电影') || text.includes('film') || text.includes('movie')) {
      return 'film';
    }

    // Default to video for Bilibili
    return 'video';
  }

  /**
   * Get download URL (simplified implementation)
   * In a real implementation, this would use Bilibili's API or extract video URLs
   */
  private async getDownloadUrl(url: string): Promise<string | undefined> {
    // This is a placeholder - real implementation would need to:
    // 1. Extract video information from Bilibili's API
    // 2. Get actual video stream URLs
    // 3. Handle authentication if needed

    // For now, return undefined to indicate download URL is not available
    return undefined;
  }
}