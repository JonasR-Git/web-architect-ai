import * as cheerio from 'cheerio';
import type { MediaAnalysis, VideoAnalysis, EmbedAnalysis, InteractiveElement, VideoType, EmbedType, InteractiveType } from '@/types';

/**
 * Media Analyzer
 *
 * Detects videos, embeds, and interactive elements on the page.
 */

export class MediaAnalyzer {
    /**
     * Analyzes all media elements on a page
     */
    static analyze($: cheerio.CheerioAPI): MediaAnalysis {
        const videos = this.analyzeVideos($);
        const embeds = this.analyzeEmbeds($);
        const interactiveElements = this.analyzeInteractiveElements($);
        const hasAudio = $('audio').length > 0;
        const hasSvgAnimations = $('svg animate, svg animateTransform').length > 0;

        return {
            videos,
            embeds,
            interactiveElements,
            hasAudio,
            hasSvgAnimations
        };
    }

    /**
     * Analyzes video elements
     */
    private static analyzeVideos($: cheerio.CheerioAPI): VideoAnalysis[] {
        const videos: VideoAnalysis[] = [];

        // YouTube iframes
        $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, el) => {
            const $el = $(el);
            const src = $el.attr('src') || '';

            const videoId = this.extractYouTubeId(src);

            videos.push({
                src,
                type: 'youtube',
                videoId,
                thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
                autoplay: src.includes('autoplay=1'),
                muted: src.includes('mute=1'),
                loop: src.includes('loop=1'),
                context: this.getContext($, $el)
            });
        });

        // Vimeo iframes
        $('iframe[src*="vimeo.com"]').each((_, el) => {
            const $el = $(el);
            const src = $el.attr('src') || '';

            const videoId = this.extractVimeoId(src);

            videos.push({
                src,
                type: 'vimeo',
                videoId,
                autoplay: src.includes('autoplay=1'),
                muted: src.includes('muted=1'),
                loop: src.includes('loop=1'),
                context: this.getContext($, $el)
            });
        });

        // Native video elements
        $('video').each((_, el) => {
            const $el = $(el);
            const src = $el.attr('src') || $el.find('source').first().attr('src') || '';

            videos.push({
                src,
                type: 'native',
                autoplay: $el.attr('autoplay') !== undefined,
                muted: $el.attr('muted') !== undefined,
                loop: $el.attr('loop') !== undefined,
                context: this.getContext($, $el),
                title: $el.attr('title') || $el.attr('aria-label')
            });
        });

        return videos;
    }

    /**
     * Analyzes embed elements (maps, calendars, forms, etc.)
     */
    private static analyzeEmbeds($: cheerio.CheerioAPI): EmbedAnalysis[] {
        const embeds: EmbedAnalysis[] = [];

        // Google Maps
        $('iframe[src*="google.com/maps"]').each((_, el) => {
            const $el = $(el);
            embeds.push({
                type: 'map',
                provider: 'Google Maps',
                iframeSrc: $el.attr('src'),
                context: this.getContext($, $el)
            });
        });

        // Calendly
        $('iframe[src*="calendly.com"]').each((_, el) => {
            const $el = $(el);
            embeds.push({
                type: 'calendar',
                provider: 'Calendly',
                iframeSrc: $el.attr('src'),
                context: this.getContext($, $el)
            });
        });

        // Typeform
        $('iframe[src*="typeform.com"]').each((_, el) => {
            const $el = $(el);
            embeds.push({
                type: 'form',
                provider: 'Typeform',
                iframeSrc: $el.attr('src'),
                context: this.getContext($, $el)
            });
        });

        // Twitter embeds
        $('iframe[src*="twitter.com"], blockquote[class*="twitter"]').each((_, el) => {
            const $el = $(el);
            embeds.push({
                type: 'social-feed',
                provider: 'Twitter',
                iframeSrc: $el.attr('src'),
                context: this.getContext($, $el)
            });
        });

        // Instagram embeds
        $('iframe[src*="instagram.com"], blockquote[class*="instagram"]').each((_, el) => {
            const $el = $(el);
            embeds.push({
                type: 'social-feed',
                provider: 'Instagram',
                iframeSrc: $el.attr('src'),
                context: this.getContext($, $el)
            });
        });

        // Other iframes (generic)
        $('iframe').each((_, el) => {
            const $el = $(el);
            const src = $el.attr('src') || '';

            // Skip if already categorized
            if (src.includes('youtube') || src.includes('vimeo') || src.includes('google.com/maps') ||
                src.includes('calendly') || src.includes('typeform') || src.includes('twitter') ||
                src.includes('instagram')) {
                return;
            }

            embeds.push({
                type: 'other',
                iframeSrc: src,
                context: this.getContext($, $el)
            });
        });

        return embeds;
    }

    /**
     * Analyzes interactive elements
     */
    private static analyzeInteractiveElements($: cheerio.CheerioAPI): InteractiveElement[] {
        const elements: InteractiveElement[] = [];

        // Sliders/Carousels
        const sliders = $('.slider, .carousel, [class*="swiper"], [data-carousel]').length;
        if (sliders > 0) {
            const items: { title?: string; content?: string }[] = [];
            $('.slider .slide, .carousel-item, .swiper-slide').slice(0, 5).each((_, el) => {
                const $el = $(el);
                items.push({
                    title: $el.find('h1, h2, h3').first().text().trim(),
                    content: $el.text().trim().slice(0, 100)
                });
            });

            elements.push({
                type: 'slider',
                count: sliders,
                items,
                hasAutoplay: $('[data-autoplay="true"], .autoplay').length > 0
            });
        }

        // Accordions
        const accordions = $('.accordion, details, [class*="collapse"]').length;
        if (accordions > 0) {
            const items: { title?: string; content?: string }[] = [];
            $('.accordion-item, details, [class*="collapse-item"]').slice(0, 5).each((_, el) => {
                const $el = $(el);
                items.push({
                    title: $el.find('.accordion-header, summary, .title').first().text().trim(),
                    content: $el.find('.accordion-body, .content').first().text().trim().slice(0, 100)
                });
            });

            elements.push({
                type: 'accordion',
                count: accordions,
                items
            });
        }

        // Tabs
        const tabs = $('[role="tablist"], .tabs, [class*="tab-"]').length;
        if (tabs > 0) {
            const items: { title?: string }[] = [];
            $('[role="tab"], .tab-item, .nav-tab').slice(0, 5).each((_, el) => {
                items.push({ title: $(el).text().trim() });
            });

            elements.push({
                type: 'tabs',
                count: tabs,
                items
            });
        }

        // Modals
        const modals = $('.modal, [role="dialog"], [aria-modal="true"]').length;
        if (modals > 0) {
            elements.push({
                type: 'modal',
                count: modals
            });
        }

        // Dropdowns
        const dropdowns = $('.dropdown, [role="menu"], select').length;
        if (dropdowns > 0) {
            elements.push({
                type: 'dropdown',
                count: dropdowns
            });
        }

        return elements;
    }

    /**
     * Extracts YouTube video ID from URL
     */
    private static extractYouTubeId(url: string): string | undefined {
        const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        return match ? match[1] : undefined;
    }

    /**
     * Extracts Vimeo video ID from URL
     */
    private static extractVimeoId(url: string): string | undefined {
        const match = url.match(/vimeo\.com\/video\/(\d+)/);
        return match ? match[1] : undefined;
    }

    /**
     * Gets context of an element (parent section)
     */
    private static getContext($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | undefined {
        const parents = $el.parentsUntil('body').toArray();

        for (const parent of parents) {
            const $parent = $(parent);
            const tag = $parent.prop('tagName')?.toLowerCase();

            if (tag === 'header') return 'header';
            if (tag === 'footer') return 'footer';
            if (tag === 'aside') return 'sidebar';
            if (tag === 'main') return 'main';
            if (tag === 'article') return 'article';

            const classes = $parent.attr('class') || '';
            if (classes.match(/hero|banner/)) return 'hero';
        }

        return undefined;
    }
}
