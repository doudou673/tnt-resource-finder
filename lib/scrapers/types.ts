import { NewResource, ResourceTypeType, PlatformType } from '@/db/schema/tnt-resources';

export interface ScrapedResource {
  title: string;
  url: string;
  downloadUrl?: string;
  resourceType: ResourceTypeType;
  platform: PlatformType;
  uploadDate?: Date;
  duration?: number;
  description?: string;
  thumbnailUrl?: string;
  memberNames?: string[]; // Array of member names found in content
  eventNames?: string[]; // Array of event names found in content
}

export interface ScraperConfig {
  delayMs: number;
  maxRetries: number;
  userAgent: string;
  timeout: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  duration?: number;
  viewCount?: number;
  uploadTime?: string;
  thumbnailUrl?: string;
  author?: string;
}

export interface BaseScraper {
  readonly platform: PlatformType;
  readonly config: ScraperConfig;

  /**
   * Search for resources related to a query
   */
  search(query: string, maxResults?: number): Promise<SearchResult[]>;

  /**
   * Extract detailed information from a specific resource URL
   */
  extractResourceDetails(url: string): Promise<ScrapedResource | null>;

  /**
   * Validate if a URL belongs to this platform
   */
  isValidUrl(url: string): boolean;

  /**
   * Get platform-specific search URLs
   */
  getSearchUrl(query: string): string;
}

export type ResourceValidationError = {
  field: string;
  message: string;
};

export interface ScraperResult {
  success: boolean;
  resources: ScrapedResource[];
  errors: ResourceValidationError[];
  warnings: string[];
}