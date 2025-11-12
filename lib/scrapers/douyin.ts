import * as cheerio from 'cheerio';
import { BaseScraperImpl } from './base-scraper';
import { ScrapedResource, SearchResult } from './types';
import { ResourceTypeType, PlatformType } from '@/db/schema/tnt-resources';

export class DouyinScraper extends BaseScraperImpl {
  constructor(config = {}) {
    super('douyin' as PlatformType, {
      delayMs: 3000, // 3 seconds delay - Douyin is more strict
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      ...config
    });
  }

  isValidUrl(url: string): boolean {
    return url.includes('douyin.com') || url.includes('v.douyin.com');
  }

  getSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://www.douyin.com/search/${encodedQuery}?type=video`;
  }

  async search(query: string, maxResults = 30): Promise<SearchResult[]> {
    console.log(`🔍 Douyin search: ${query}`);

    try {
      // Note: Douyin has anti-scraping measures and requires specific headers
      // This is a simplified implementation that may need additional work
      const searchUrl = this.getSearchUrl(query);

      const response = await this.retryWithBackoff(async () => {
        return this.http.get(searchUrl, {
          headers: {
            'Referer': 'https://www.douyin.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          }
        });
      });

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      // Douyin heavily uses JavaScript, so we might need to extract from script tags
      const scriptTags = $('script').toArray();

      for (const script of scriptTags) {
        const scriptContent = $(script).html();
        if (scriptContent && scriptContent.includes('aweme')) {
          try {
            // Try to extract video data from script content
            const videoData = this.extractVideoDataFromScript(scriptContent);

            if (videoData && videoData.length > 0) {
              for (const video of videoData) {
                if (results.length >= maxResults) break;

                // Check if video is related to TNT
                if (this.isTntRelated(video.desc || video.title)) {
                  results.push({
                    id: video.aweme_id || video.id,
                    title: video.desc || video.title || '',
                    url: video.share_url || video.url || '',
                    duration: video.duration ? Math.floor(video.duration / 1000) : undefined,
                    viewCount: video.statistics?.play_count,
                    uploadTime: video.create_time ? new Date(video.create_time * 1000).toLocaleDateString() : undefined,
                    thumbnailUrl: video.video?.cover?.url_list?.[0] || video.cover,
                    author: video.author?.nickname || video.nickname
                  });
                }
              }
            }
          } catch (error) {
            // Continue if script parsing fails
            continue;
          }
        }
      }

      // Fallback: Try to extract from visible elements
      if (results.length === 0) {
        $('.video-feed, .video-item, .video-container').each((index, element) => {
          if (results.length >= maxResults) return false;

          const $element = $(element);
          const title = $element.find('.title, .desc, .video-desc').text().trim();
          const linkElement = $element.find('a[href*="douyin.com"]').first();
          const url = linkElement.attr('href') || '';

          if (title && url && this.isTntRelated(title)) {
            results.push({
              id: this.extractVideoIdFromUrl(url),
              title,
              url: url.startsWith('http') ? url : `https://www.douyin.com${url}`,
              author: $element.find('.author, .nickname').text().trim()
            });
          }
        });
      }

      console.log(`✅ Found ${results.length} results from Douyin`);
      return results;

    } catch (error) {
      console.error('❌ Douyin search failed:', error);
      return [];
    }
  }

  async extractResourceDetails(url: string): Promise<ScrapedResource | null> {
    console.log(`📄 Extracting Douyin resource details: ${url}`);

    try {
      const response = await this.retryWithBackoff(async () => {
        return this.http.get(url, {
          headers: {
            'Referer': 'https://www.douyin.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
      });

      const $ = cheerio.load(response.data);

      // Extract from meta tags first
      const title = $('meta[property="og:title"]').attr('content') ||
                   $('title').text().trim() ||
                   $('.video-desc, .desc, .title').first().text().trim() || '';

      const description = $('meta[property="og:description"]').attr('content') ||
                         $('.video-desc, .desc').first().text().trim() || '';

      // Extract from script data
      let videoData = null;
      $('script').each((_, script) => {
        const scriptContent = $(script).html();
        if (scriptContent && scriptContent.includes('aweme_detail')) {
          try {
            const dataMatch = scriptContent.match(/window\._DATA\s*=\s*({.+});/);
            if (dataMatch) {
              videoData = JSON.parse(dataMatch[1]);
            }
          } catch (error) {
            // Continue if parsing fails
          }
        }
      });

      // Extract additional details from video data
      let uploadDate: Date | undefined;
      let duration: number | undefined;
      let thumbnailUrl: string | undefined;

      if (videoData) {
        uploadDate = videoData.create_time ? new Date(videoData.create_time * 1000) : undefined;
        duration = videoData.duration ? Math.floor(videoData.duration / 1000) : undefined;
        thumbnailUrl = videoData.video?.cover?.url_list?.[0];
      }

      // Fallback extraction
      if (!thumbnailUrl) {
        thumbnailUrl = $('meta[property="og:image"]').attr('content') ||
                       $('video').attr('poster') ||
                       '.poster img').attr('src') || '';
      }

      // Determine resource type
      const resourceType: ResourceTypeType = this.determineResourceType(title, description);

      // Extract member and event names
      const fullText = `${title} ${description}`;
      const memberNames = this.extractMemberNames(fullText);
      const eventNames = this.extractEventNames(fullText);

      // Get download URL (simplified)
      const downloadUrl = await this.getDownloadUrl(url, videoData);

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
      console.error(`❌ Failed to extract Douyin resource details: ${url}`, error);
      return null;
    }
  }

  /**
   * Extract video data from script content
   */
  private extractVideoDataFromScript(scriptContent: string): any[] {
    try {
      // Look for different data patterns in Douyin pages
      const patterns = [
        /window\._SSR_HYDRATED_DATA\s*=\s*({.+});?/,
        /window\.__NUXT__\s*=\s*({.+});?/,
        /__DEFAULT_SCOPE__\s*=\s*({.+});?/
      ];

      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match) {
          const data = JSON.parse(match[1]);
          // Try to find video data in different possible locations
          const videoData = data?.aweme_list ||
                          data?.videoList ||
                          data?.feed ||
                          (data?.store?.useState?.[0]?.awemeList);

          if (Array.isArray(videoData)) {
            return videoData;
          }
        }
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if content is related to TNT
   */
  private isTntRelated(text: string): boolean {
    const tntKeywords = [
      '时代少年团', 'TNT', '马嘉祺', '丁程鑫', '宋亚轩',
      '刘耀文', '张真源', '严浩翔', '贺峻霖',
      'Ma Jiaqi', 'Ding Chengxin', 'Song Yaxuan',
      'Liu Yaowen', 'Zhang Zhenyuan', 'Yan Haoxiang', 'He Junlin'
    ];

    const lowerText = text.toLowerCase();
    return tntKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Extract video ID from Douyin URL
   */
  private extractVideoIdFromUrl(url: string): string {
    const match = url.match(/\/video\/(\d+)/) || url.match(/\/share\/video\/(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Determine resource type based on title and description
   */
  private determineResourceType(title: string, description: string): ResourceTypeType {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('音频') || text.includes('音乐') || text.includes('纯音乐')) {
      return 'audio';
    }

    if (text.includes('电影') || text.includes('film') || text.includes('movie')) {
      return 'film';
    }

    // Default to video for Douyin
    return 'video';
  }

  /**
   * Get download URL (simplified implementation)
   */
  private async getDownloadUrl(url: string, videoData: any): Promise<string | undefined> {
    // This is a placeholder - real implementation would need to:
    // 1. Use Douyin's internal API or reverse-engineer their video URLs
    // 2. Handle authentication and anti-scraping measures
    // 3. Extract actual video stream URLs

    // For demo purposes, return undefined
    return undefined;
  }
}