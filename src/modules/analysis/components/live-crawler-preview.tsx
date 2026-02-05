/**
 * Live Crawler Preview
 *
 * Real-time visualization of crawling progress showing:
 * - Discovered pages
 * - Extracted colors
 * - Found images
 * - Current processing status
 */

'use client';

import { useState, useEffect } from 'react';
import { Globe, Image as ImageIcon, Palette, CheckCircle, Loader2 } from 'lucide-react';
import type { SiteNode } from '@/types';

interface LiveCrawlerPreviewProps {
  isActive: boolean;
  currentUrl: string;
  discoveredPages: string[];
  processedCount: number;
  queueLength: number;
  recentColors?: string[];
  recentImages?: string[];
}

export function LiveCrawlerPreview({
  isActive,
  currentUrl,
  discoveredPages,
  processedCount,
  queueLength,
  recentColors = [],
  recentImages = [],
}: LiveCrawlerPreviewProps) {
  const [visiblePages, setVisiblePages] = useState<string[]>([]);
  const [visibleColors, setVisibleColors] = useState<string[]>([]);
  const [visibleImages, setVisibleImages] = useState<string[]>([]);

  // Animate new pages appearing
  useEffect(() => {
    if (discoveredPages.length > visiblePages.length) {
      const newPages = discoveredPages.slice(visiblePages.length);
      newPages.forEach((page, index) => {
        setTimeout(() => {
          setVisiblePages((prev) => [...prev, page]);
        }, index * 100); // Stagger animation
      });
    }
  }, [discoveredPages]);

  // Animate new colors appearing
  useEffect(() => {
    if (recentColors.length > visibleColors.length) {
      const newColors = recentColors.slice(visibleColors.length);
      newColors.forEach((color, index) => {
        setTimeout(() => {
          setVisibleColors((prev) => [...prev, color]);
        }, index * 50);
      });
    }
  }, [recentColors]);

  // Animate new images appearing
  useEffect(() => {
    if (recentImages.length > visibleImages.length) {
      const newImages = recentImages.slice(visibleImages.length);
      newImages.forEach((img, index) => {
        setTimeout(() => {
          setVisibleImages((prev) => [...prev, img]);
        }, index * 75);
      });
    }
  }, [recentImages]);

  if (!isActive) return null;

  const totalPages = discoveredPages.length;
  const progressPercent = totalPages > 0 ? (processedCount / totalPages) * 100 : 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Globe className="w-6 h-6 text-purple-400" />
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Live Crawl Preview</h3>
            <p className="text-xs text-gray-400">Real-time discovery updates</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white font-mono">
            {processedCount}/{totalPages}
          </div>
          <div className="text-xs text-gray-400">pages processed</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-black/30 rounded-lg p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Currently Processing
          </span>
        </div>
        <div className="text-sm text-white font-mono truncate" title={currentUrl}>
          {currentUrl || 'Waiting...'}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Queue: {queueLength} pages remaining
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Discovered Pages */}
        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Pages
            </span>
            <span className="ml-auto text-xs font-mono text-blue-400">
              {totalPages}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {visiblePages.slice(-10).map((page, index) => {
              const isProcessed = index < processedCount;
              return (
                <div
                  key={`${page}-${index}`}
                  className="flex items-center gap-2 p-2 bg-white/5 rounded text-xs animate-in slide-in-from-left-2 fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isProcessed ? (
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-3 h-3 text-gray-500 animate-spin flex-shrink-0" />
                  )}
                  <span className="text-gray-300 truncate" title={page}>
                    {new URL(page).pathname || '/'}
                  </span>
                </div>
              );
            })}
          </div>

          {totalPages > 10 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              + {totalPages - 10} more pages
            </div>
          )}
        </div>

        {/* Extracted Colors */}
        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Colors
            </span>
            <span className="ml-auto text-xs font-mono text-purple-400">
              {visibleColors.length}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {visibleColors.slice(0, 20).map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="aspect-square rounded-lg border border-white/20 animate-in zoom-in-50 fade-in"
                style={{
                  backgroundColor: color,
                  animationDelay: `${index * 50}ms`,
                }}
                title={color}
              />
            ))}
          </div>

          {visibleColors.length > 20 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              + {visibleColors.length - 20} more colors
            </div>
          )}
        </div>

        {/* Found Images */}
        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Images
            </span>
            <span className="ml-auto text-xs font-mono text-emerald-400">
              {visibleImages.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {visibleImages.slice(0, 8).map((img, index) => (
              <div
                key={`${img}-${index}`}
                className="aspect-square rounded-lg bg-white/5 border border-white/10 overflow-hidden animate-in zoom-in-50 fade-in"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
          </div>

          {visibleImages.length > 8 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              + {visibleImages.length - 8} more images
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {queueLength === 0 && processedCount > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-400">
              Crawl Complete!
            </div>
            <div className="text-xs text-gray-400">
              Discovered {totalPages} pages, {visibleColors.length} colors, and{' '}
              {visibleImages.length} images
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
