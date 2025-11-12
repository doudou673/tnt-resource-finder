import axios, { AxiosInstance } from 'axios';
import { BaseScraper, ScraperConfig, ScraperResult, ScrapedResource, ResourceValidationError } from './types';
import { insertResourceSchema } from '@/db/schema/tnt-resources';
import { z } from 'zod';

export abstract class BaseScraperImpl implements BaseScraper {
  protected http: AxiosInstance;
  readonly platform: string;
  readonly config: ScraperConfig;

  constructor(platform: string, config: Partial<ScraperConfig> = {}) {
    this.platform = platform;
    this.config = {
      delayMs: 3000, // 3 seconds default delay
      maxRetries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: 30000, // 30 seconds timeout
      ...config
    };

    this.http = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
  }

  async search(query: string, maxResults = 50): Promise<any[]> {
    throw new Error('Search method must be implemented by subclass');
  }

  async extractResourceDetails(url: string): Promise<ScrapedResource | null> {
    throw new Error('extractResourceDetails method must be implemented by subclass');
  }

  isValidUrl(url: string): boolean {
    throw new Error('isValidUrl method must be implemented by subclass');
  }

  getSearchUrl(query: string): string {
    throw new Error('getSearchUrl method must be implemented by subclass');
  }

  /**
   * Add delay between requests to avoid rate limiting
   */
  protected async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.config.delayMs));
  }

  /**
   * Retry failed requests with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`Attempt ${attempt} failed, retrying in ${backoffDelay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Validate scraped resource data
   */
  protected validateResource(resource: ScrapedResource): {
    isValid: boolean;
    errors: ResourceValidationError[];
  } {
    const errors: ResourceValidationError[] = [];

    try {
      // Validate with Zod schema
      insertResourceSchema.parse(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            field: err.path.join('.'),
            message: err.message
          });
        });
      }
    }

    // Custom validations
    if (!resource.title || resource.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!resource.url || this.isValidUrl(resource.url)) {
      errors.push({ field: 'url', message: 'Valid URL is required' });
    }

    // Check if title contains TNT-related keywords
    const tntKeywords = ['时代少年团', 'TNT', '马嘉祺', '丁程鑫', '宋亚轩', '刘耀文', '张真源', '严浩翔', '贺峻霖'];
    const hasTntKeywords = tntKeywords.some(keyword =>
      resource.title.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasTntKeywords && !resource.memberNames?.length && !resource.eventNames?.length) {
      errors.push({
        field: 'relevance',
        message: 'Resource must be related to Teens in Times members or events'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract member names from title or description
   */
  protected extractMemberNames(text: string): string[] {
    const memberNames = [
      '马嘉祺', 'Ma Jiaqi', '马哥',
      '丁程鑫', 'Ding Chengxin', '丁哥',
      '宋亚轩', 'Song Yaxuan', '宋亚轩',
      '刘耀文', 'Liu Yaowen', '刘耀文',
      '张真源', 'Zhang Zhenyuan', '真源',
      '严浩翔', 'Yan Haoxiang', '严浩翔',
      '贺峻霖', 'He Junlin', '贺峻霖'
    ];

    const foundNames: string[] = [];
    const lowerText = text.toLowerCase();

    memberNames.forEach(name => {
      if (lowerText.includes(name.toLowerCase())) {
        // Get the official name (first two characters if it's Chinese)
        const officialName = name.match(/[^\u4e00-\u9fa5]/) ? name : name.substring(0, 2);
        if (!foundNames.includes(officialName)) {
          foundNames.push(officialName);
        }
      }
    });

    return foundNames;
  }

  /**
   * Extract potential event names from text
   */
  protected extractEventNames(text: string): string[] {
    const eventKeywords = [
      '演唱会', '音乐会', '专辑', 'MV', '音乐节目', '综艺',
      '出道', '三周年', '周年庆', '家族演唱会', '录音', '练习生',
      '要你管', '姐姐真漂亮', '我喜欢你', '无尽的冒险'
    ];

    const foundEvents: string[] = [];
    const lowerText = text.toLowerCase();

    eventKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundEvents.push(keyword);
      }
    });

    return foundEvents;
  }

  /**
   * Process scraped results and validate them
   */
  async processScrapedResources(rawResults: ScrapedResource[]): Promise<ScraperResult> {
    const validResources: ScrapedResource[] = [];
    const errors: ResourceValidationError[] = [];
    const warnings: string[] = [];

    // Deduplicate resources by URL
    const uniqueUrls = new Set<string>();

    for (const resource of rawResults) {
      // Skip duplicates
      if (uniqueUrls.has(resource.url)) {
        warnings.push(`Duplicate resource skipped: ${resource.url}`);
        continue;
      }
      uniqueUrls.add(resource.url);

      // Validate resource
      const validation = this.validateResource(resource);

      if (validation.isValid) {
        validResources.push(resource);
      } else {
        errors.push(...validation.errors);
        warnings.push(`Invalid resource skipped: ${resource.title} - ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }

    return {
      success: validResources.length > 0,
      resources: validResources,
      errors,
      warnings
    };
  }
}