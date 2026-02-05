/**
 * Live Crawler Hook
 *
 * Manages real-time state for crawler preview
 */

import { useState, useEffect, useRef } from 'react';

export interface LiveCrawlerState {
  isActive: boolean;
  currentUrl: string;
  discoveredPages: string[];
  processedCount: number;
  queueLength: number;
  recentColors: string[];
  recentImages: string[];
}

export function useLiveCrawler() {
  const [state, setState] = useState<LiveCrawlerState>({
    isActive: false,
    currentUrl: '',
    discoveredPages: [],
    processedCount: 0,
    queueLength: 0,
    recentColors: [],
    recentImages: [],
  });

  const colorsSet = useRef<Set<string>>(new Set());
  const imagesSet = useRef<Set<string>>(new Set());

  /**
   * Start crawling (reset state)
   */
  const startCrawl = () => {
    setState({
      isActive: true,
      currentUrl: '',
      discoveredPages: [],
      processedCount: 0,
      queueLength: 0,
      recentColors: [],
      recentImages: [],
    });
    colorsSet.current.clear();
    imagesSet.current.clear();
  };

  /**
   * Update current processing URL
   */
  const updateCurrentUrl = (url: string) => {
    setState((prev) => ({ ...prev, currentUrl: url }));
  };

  /**
   * Add discovered page
   */
  const addDiscoveredPage = (url: string) => {
    setState((prev) => {
      if (prev.discoveredPages.includes(url)) {
        return prev;
      }
      return {
        ...prev,
        discoveredPages: [...prev.discoveredPages, url],
      };
    });
  };

  /**
   * Update crawl stats
   */
  const updateStats = (processed: number, queueLength: number) => {
    setState((prev) => ({
      ...prev,
      processedCount: processed,
      queueLength,
    }));
  };

  /**
   * Add extracted color
   */
  const addColor = (color: string) => {
    if (!colorsSet.current.has(color)) {
      colorsSet.current.add(color);
      setState((prev) => ({
        ...prev,
        recentColors: [...prev.recentColors, color],
      }));
    }
  };

  /**
   * Add found image
   */
  const addImage = (imageUrl: string) => {
    if (!imagesSet.current.has(imageUrl)) {
      imagesSet.current.add(imageUrl);
      setState((prev) => ({
        ...prev,
        recentImages: [...prev.recentImages, imageUrl],
      }));
    }
  };

  /**
   * End crawling
   */
  const endCrawl = () => {
    setState((prev) => ({ ...prev, isActive: false }));
  };

  /**
   * Process crawl event from EventSource
   */
  const handleCrawlEvent = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'stats':
          updateStats(data.stats.processed, data.stats.queueLength);
          if (data.stats.currentUrl) {
            updateCurrentUrl(data.stats.currentUrl);
          }
          break;

        case 'page':
          addDiscoveredPage(data.url);
          break;

        case 'color':
          if (data.color) {
            addColor(data.color);
          }
          break;

        case 'image':
          if (data.imageUrl) {
            addImage(data.imageUrl);
          }
          break;

        case 'design':
          // Design config detected - could extract colors
          if (data.designConfig?.colors) {
            Object.values(data.designConfig.colors).forEach((color) => {
              if (typeof color === 'string') {
                addColor(color);
              }
            });
          }
          break;

        case 'complete':
          endCrawl();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('[LiveCrawler] Failed to parse event:', error);
    }
  };

  return {
    state,
    startCrawl,
    updateCurrentUrl,
    addDiscoveredPage,
    updateStats,
    addColor,
    addImage,
    endCrawl,
    handleCrawlEvent,
  };
}
