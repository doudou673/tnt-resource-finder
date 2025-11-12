"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SearchForm, SearchFormData } from './search-form';
import { SearchResults } from './search-results';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  stageName: string;
}

interface Event {
  id: string;
  title: string;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  downloadUrl?: string;
  resourceType: 'video' | 'audio' | 'film' | 'other';
  platform: 'bilibili' | 'douyin' | 'youtube' | 'weibo' | 'other';
  uploadDate?: string;
  duration?: number;
  description?: string;
  thumbnailUrl?: string;
  member?: Member;
  event?: Event;
  scrapedAt?: string;
  createdAt?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    pagination: {
      total: number;
      localTotal: number;
      onlineTotal: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    filters: {
      query: string;
      type?: string;
      member?: string;
      event?: string;
      platform?: string;
    };
  };
  warnings?: string[];
  meta?: {
    searchTime: string;
    includesOnline: boolean;
  };
}

export function SearchInterface() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<SearchFormData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load members and events on component mount
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [membersResponse, eventsResponse] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/events'),
        ]);

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData.data || []);
        }

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData.data || []);
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
        toast.error('加载成员和活动数据失败');
      }
    };

    loadReferenceData();
  }, []);

  // Build search URL with query parameters
  const buildSearchUrl = useCallback((filters: SearchFormData, page: number = 1) => {
    const params = new URLSearchParams();

    if (filters.query) params.append('query', filters.query);
    if (filters.type) params.append('type', filters.type);
    if (filters.member) params.append('member', filters.member);
    if (filters.event) params.append('event', filters.event);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.searchOnline !== undefined) params.append('searchOnline', String(filters.searchOnline));

    // Add platforms if provided
    if ((filters as any).platforms && (filters as any).platforms.length > 0) {
      (filters as any).platforms.forEach((platform: string) => {
        params.append('platforms', platform);
      });
    }

    // Pagination
    params.append('limit', '20');
    params.append('offset', String((page - 1) * 20));

    // Sorting
    params.append('sortBy', 'relevance');
    params.append('sortOrder', 'desc');

    return `/api/search?${params.toString()}`;
  }, []);

  // Perform search
  const performSearch = useCallback(async (filters: SearchFormData, page: number = 1) => {
    if (!filters.query?.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    setLoading(true);
    setWarnings([]);

    try {
      const searchUrl = buildSearchUrl(filters, page);
      console.log('🔍 Searching:', searchUrl);

      const response = await fetch(searchUrl);
      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '搜索失败');
      }

      if (data.success) {
        setResults(data.data.results);
        setTotalCount(data.data.pagination.total);
        setCurrentPage(page);
        setTotalPages(Math.ceil(data.data.pagination.total / 20));
        setCurrentFilters(filters);
        setWarnings(data.warnings || []);

        const localCount = data.data.pagination.localTotal;
        const onlineCount = data.data.pagination.onlineTotal;

        if (onlineCount > 0) {
          toast.success(`找到 ${data.data.pagination.total} 个结果 (本地 ${localCount} 个, 在线 ${onlineCount} 个)`);
        } else {
          toast.success(`找到 ${localCount} 个本地结果`);
        }
      } else {
        throw new Error('搜索请求失败');
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败，请重试');
      setResults([]);
      setTotalCount(0);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [buildSearchUrl]);

  // Handle search form submission
  const handleSearch = useCallback((filters: SearchFormData) => {
    setCurrentPage(1);
    performSearch(filters, 1);
  }, [performSearch]);

  // Handle search clear
  const handleClear = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setCurrentFilters(null);
    setWarnings([]);
    setCurrentPage(1);
    setTotalPages(1);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (currentFilters) {
      performSearch(currentFilters, page);
    }
  }, [currentFilters, performSearch]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          时代少年团资源搜索
        </h1>
        <p className="text-gray-600">
          搜索马嘉祺、丁程鑫、宋亚轩、刘耀文、张真源、严浩翔、贺峻霖的相关资源
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg border p-6">
        <SearchForm
          onSearch={handleSearch}
          onClear={handleClear}
          isLoading={loading}
          members={members}
          events={events}
        />
      </div>

      {/* Search Results */}
      <SearchResults
        results={results}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        warnings={warnings}
        includesOnline={warnings.some(w => w.includes('online') || w.includes('在线'))}
      />

      {/* Current Search Info */}
      {currentFilters && !loading && results.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          当前搜索: "{currentFilters.query}"
          {currentFilters.type && ` • 类型: ${currentFilters.type}`}
          {currentFilters.platform && ` • 平台: ${currentFilters.platform}`}
          {totalCount > 0 && ` • 共 ${totalCount} 个结果`}
        </div>
      )}
    </div>
  );
}