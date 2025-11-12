"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

const searchFormSchema = z.object({
  query: z.string().min(1, '请输入搜索关键词').max(200, '搜索词过长'),
  type: z.enum(['video', 'audio', 'film', 'other']).optional(),
  member: z.string().optional(),
  event: z.string().optional(),
  platform: z.enum(['bilibili', 'douyin', 'youtube', 'weibo', 'other']).optional(),
  searchOnline: z.boolean().default(false),
});

export type SearchFormData = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void;
  onClear: () => void;
  isLoading?: boolean;
  members?: Array<{ id: string; name: string; stageName: string }>;
  events?: Array<{ id: string; title: string }>;
}

export function SearchForm({
  onSearch,
  onClear,
  isLoading = false,
  members = [],
  events = [],
}: SearchFormProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: '',
      type: undefined,
      member: '',
      event: '',
      platform: undefined,
      searchOnline: false,
    },
  });

  const handleSearch = (data: SearchFormData) => {
    // Include selected platforms if any
    const searchData = {
      ...data,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
    };
    onSearch(searchData);
  };

  const handleClear = () => {
    form.reset();
    setSelectedPlatforms([]);
    onClear();
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setSelectedPlatforms(prev =>
      checked
        ? [...prev, platform]
        : prev.filter(p => p !== platform)
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
        {/* Main Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...form.register('query')}
              placeholder="搜索时代少年团资源... (如: 马嘉祺 演唱会 MV)"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            搜索
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading}
          >
            清除
          </Button>
        </div>

        {/* Filters Toggle */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-gray-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              高级筛选
              {showFilters ? ' ▲' : ' ▼'}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Resource Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">资源类型</label>
                <Select
                  value={form.watch('type') || ''}
                  onValueChange={(value) =>
                    form.setValue('type', value === '' ? undefined : value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部类型</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="audio">音频</SelectItem>
                    <SelectItem value="film">电影</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Member Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">成员</label>
                <Select
                  value={form.watch('member') || ''}
                  onValueChange={(value) => form.setValue('member', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择成员" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部成员</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.stageName} ({member.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">活动</label>
                <Select
                  value={form.watch('event') || ''}
                  onValueChange={(value) => form.setValue('event', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择活动" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部活动</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">平台</label>
                <Select
                  value={form.watch('platform') || ''}
                  onValueChange={(value) =>
                    form.setValue('platform', value === '' ? undefined : value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部平台</SelectItem>
                    <SelectItem value="bilibili">哔哩哔哩</SelectItem>
                    <SelectItem value="douyin">抖音</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="weibo">微博</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">搜索平台</label>
              <div className="flex flex-wrap gap-2">
                {['bilibili', 'douyin', 'youtube', 'weibo'].map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={(checked) =>
                        handlePlatformChange(platform, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`platform-${platform}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {platform === 'bilibili' && '哔哩哔哩'}
                      {platform === 'douyin' && '抖音'}
                      {platform === 'youtube' && 'YouTube'}
                      {platform === 'weibo' && '微博'}
                    </label>
                  </div>
                ))}
              </div>
              {selectedPlatforms.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {selectedPlatforms.map((platform) => (
                    <Badge
                      key={platform}
                      variant="secondary"
                      className="text-xs"
                    >
                      {platform === 'bilibili' && '哔哩哔哩'}
                      {platform === 'douyin' && '抖音'}
                      {platform === 'youtube' && 'YouTube'}
                      {platform === 'weibo' && '微博'}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Online Search Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="search-online"
                checked={form.watch('searchOnline')}
                onCheckedChange={(checked) => form.setValue('searchOnline', checked as boolean)}
              />
              <label
                htmlFor="search-online"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                如果本地没有结果，在线搜索更多资源
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </div>
  );
}