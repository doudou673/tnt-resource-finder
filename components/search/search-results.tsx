"use client";

import React, { useState } from 'react';
import { ExternalLink, Download, Play, Music, Film, Clock, Eye, Calendar, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  member?: {
    id: string;
    name: string;
    stageName: string;
    groupRole?: string;
  };
  event?: {
    id: string;
    title: string;
    eventDate?: string;
    venue?: string;
  };
  scrapedAt?: string;
  createdAt?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading?: boolean;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  warnings?: string[];
  includesOnline?: boolean;
}

export function SearchResults({
  results,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  warnings = [],
  includesOnline = false,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'bilibili':
        return '📺';
      case 'douyin':
        return '🎵';
      case 'youtube':
        return '▶️';
      case 'weibo':
        return '📱';
      default:
        return '🌐';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'bilibili':
        return '哔哩哔哩';
      case 'douyin':
        return '抖音';
      case 'youtube':
        return 'YouTube';
      case 'weibo':
        return '微博';
      default:
        return '其他';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'film':
        return <Film className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getResourceTypeName = (type: string) => {
    switch (type) {
      case 'video':
        return '视频';
      case 'audio':
        return '音频';
      case 'film':
        return '电影';
      default:
        return '其他';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">搜索中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关资源</h3>
            <p className="text-gray-600">
              请尝试调整搜索关键词或筛选条件
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          找到 {totalCount} 个结果
          {includesOnline && (
            <Badge variant="secondary" className="ml-2">
              包含在线搜索结果
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            列表视图
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('card')}
          >
            卡片视图
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>资源</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>成员/活动</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="max-w-md">
                      <div className="font-medium truncate" title={result.title}>
                        {result.title}
                      </div>
                      {result.description && (
                        <div className="text-sm text-gray-600 truncate">
                          {result.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getResourceIcon(result.resourceType)}
                      <span className="text-sm">
                        {getResourceTypeName(result.resourceType)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{getPlatformIcon(result.platform)}</span>
                      <span className="text-sm">
                        {getPlatformName(result.platform)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {result.member && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {result.member.stageName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{result.member.stageName}</span>
                        </div>
                      )}
                      {result.event && (
                        <Badge variant="outline" className="text-xs">
                          {result.event.title}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {formatDuration(result.duration)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {formatDate(result.uploadDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(result.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>在新窗口打开</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {result.downloadUrl && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(result.downloadUrl, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>下载资源</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              {result.thumbnailUrl && (
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-sm line-clamp-2" title={result.title}>
                  {result.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{getPlatformIcon(result.platform)}</span>
                  <span>{getPlatformName(result.platform)}</span>
                  <span>•</span>
                  <span>{getResourceTypeName(result.resourceType)}</span>
                  {result.duration && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(result.duration)}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {result.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {result.description}
                  </p>
                )}

                <div className="space-y-2 mb-3">
                  {result.member && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {result.member.stageName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{result.member.stageName}</span>
                    </div>
                  )}
                  {result.event && (
                    <Badge variant="outline" className="text-xs">
                      {result.event.title}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    查看
                  </Button>
                  {result.downloadUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.downloadUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                const isActive = page === currentPage;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={isActive}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}