import * as cheerio from 'cheerio';
import type { ContentTypeDetection, ContentType } from '@/types';

/**
 * Content Type Detector
 *
 * Detects page content type (blog, product, event, etc.) using heuristics and schema.org
 */

export class ContentTypeDetector {
    /**
     * Detects content type from page
     */
    static detect($: cheerio.CheerioAPI, schemaMarkup: string[]): ContentTypeDetection {
        let scores: Record<ContentType, number> = {
            'blog-post': 0,
            'product': 0,
            'event': 0,
            'team-member': 0,
            'case-study': 0,
            'service': 0,
            'landing-page': 0,
            'documentation': 0,
            'faq': 0,
            'page': 0
        };

        // Check schema.org markup first (highest confidence)
        schemaMarkup.forEach(schema => {
            const schemaLower = schema.toLowerCase();
            if (schemaLower.includes('"@type":"article"') || schemaLower.includes('"@type":"blogposting"')) {
                scores['blog-post'] += 60;
            }
            if (schemaLower.includes('"@type":"product"')) {
                scores['product'] += 60;
            }
            if (schemaLower.includes('"@type":"event"')) {
                scores['event'] += 60;
            }
            if (schemaLower.includes('"@type":"person"')) {
                scores['team-member'] += 50;
            }
        });

        // URL patterns
        const url = $('link[rel="canonical"]').attr('href') || '';
        const urlLower = url.toLowerCase();

        if (urlLower.match(/\/blog\/|\/post\/|\/artikel\//)) scores['blog-post'] += 40;
        if (urlLower.match(/\/product\/|\/produkt\//)) scores['product'] += 40;
        if (urlLower.match(/\/event\/|\/veranstaltung\//)) scores['event'] += 40;
        if (urlLower.match(/\/team\/|\/about\/|\/uber\//)) scores['team-member'] += 30;
        if (urlLower.match(/\/case-study\/|\/referenz\//)) scores['case-study'] += 40;
        if (urlLower.match(/\/service\/|\/leistung\//)) scores['service'] += 30;
        if (urlLower.match(/\/doc\/|\/docs\/|\/documentation\//)) scores['documentation'] += 40;
        if (urlLower.match(/\/faq\/|\/hilfe\//)) scores['faq'] += 40;

        // Content-based heuristics
        const bodyText = $('body').text().toLowerCase();

        // Blog post signals
        if ($('article').length > 0) scores['blog-post'] += 25;
        if ($('.author, .by-line, [rel="author"]').length > 0) scores['blog-post'] += 20;
        if ($('time[datetime], .published-date, .post-date').length > 0) scores['blog-post'] += 20;
        if ($('.tags, .categories').length > 0) scores['blog-post'] += 15;

        // Product signals
        if ($('.price, [itemprop="price"]').length > 0) scores['product'] += 35;
        if ($('.add-to-cart, .buy-now, [data-product]').length > 0) scores['product'] += 30;
        if ($('.rating, .reviews, [itemprop="aggregateRating"]').length > 0) scores['product'] += 25;
        if (bodyText.match(/sku|artikelnummer|availability|verfügbarkeit/)) scores['product'] += 15;

        // Event signals
        if ($('[datetime], .event-date, .veranstaltung').length > 0) scores['event'] += 30;
        if (bodyText.match(/tickets?|anmeldung|registration|location|venue|ort/)) scores['event'] += 25;

        // Team member signals
        if ($('.bio, .biography, .vita').length > 0) scores['team-member'] += 30;
        if ($('[href^="mailto:"], [href^="tel:"]').length > 2) scores['team-member'] += 20;
        if (bodyText.match(/position|rolle|experience|experience|expertise/)) scores['team-member'] += 15;

        // Case study signals
        if (bodyText.match(/challenge|solution|results|ergebnis|kunde|client/)) scores['case-study'] += 25;
        if ($('.testimonial, .quote, blockquote').length > 0) scores['case-study'] += 20;

        // Service signals
        if (bodyText.match(/we offer|wir bieten|our service|unsere leistung/)) scores['service'] += 25;
        if ($('.feature, .benefit').length > 3) scores['service'] += 20;

        // Documentation signals
        if ($('code, pre, .highlight').length > 3) scores['documentation'] += 30;
        if ($('.toc, .table-of-contents, nav[aria-label*="table"]').length > 0) scores['documentation'] += 25;

        // FAQ signals
        if ($('.faq, .accordion, details').length > 2) scores['faq'] += 35;
        if ($('h2, h3').filter((_, el) => !!$(el).text().match(/\?/)).length > 2) scores['faq'] += 25;

        // Landing page signals (hero, CTA-heavy)
        if ($('.hero, .banner, .jumbotron').length > 0) scores['landing-page'] += 20;
        if ($('.cta, .btn-primary, button[type="submit"]').length > 3) scores['landing-page'] += 20;

        // Find highest score
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topType, topScore] = sortedScores[0];

        // Default to 'page' if no strong signal
        if (topScore < 25) {
            return { type: 'page', confidence: 40 };
        }

        const confidence = Math.min(100, Math.round(topScore));

        // Extract structured data based on type
        const structuredData = this.extractStructuredData($, topType as ContentType, schemaMarkup);

        return {
            type: topType as ContentType,
            confidence,
            structuredData,
            schemaMarkup: schemaMarkup.length > 0 ? schemaMarkup : undefined
        };
    }

    /**
     * Extracts structured data based on content type
     */
    private static extractStructuredData(
        $: cheerio.CheerioAPI,
        type: ContentType,
        schemaMarkup: string[]
    ): ContentTypeDetection['structuredData'] {
        const data: ContentTypeDetection['structuredData'] = {};

        if (type === 'blog-post') {
            data.author = $('.author, [rel="author"], [itemprop="author"]').first().text().trim();
            data.publishDate = $('time[datetime]').first().attr('datetime') || $('[itemprop="datePublished"]').attr('content');
            data.categories = $('.category, .categories a').map((_, el) => $(el).text().trim()).get();
            data.tags = $('.tag, .tags a').map((_, el) => $(el).text().trim()).get();
        }

        if (type === 'product') {
            data.price = $('.price, [itemprop="price"]').first().text().trim();
            data.sku = $('[itemprop="sku"]').text().trim();
            data.rating = parseFloat($('[itemprop="ratingValue"]').attr('content') || '0');
            data.inStock = !$('.out-of-stock, [itemprop="availability"][content*="OutOfStock"]').length;
            data.brand = $('[itemprop="brand"]').text().trim();
        }

        if (type === 'event') {
            data.eventDate = $('[datetime], [itemprop="startDate"]').first().attr('datetime') ||
                           $('[itemprop="startDate"]').attr('content');
            data.location = $('[itemprop="location"], .location, .venue').first().text().trim();
            data.ticketLink = $('a[href*="ticket"]').first().attr('href');
        }

        if (type === 'team-member') {
            data.role = $('.role, .position, [itemprop="jobTitle"]').first().text().trim();
            data.email = $('[href^="mailto:"]').first().attr('href')?.replace('mailto:', '');
            data.phone = $('[href^="tel:"]').first().attr('href')?.replace('tel:', '');
            data.socialLinks = $('a[href*="linkedin"], a[href*="twitter"], a[href*="github"]')
                .map((_, el) => $(el).attr('href')).get();
        }

        return Object.keys(data).length > 0 ? data : undefined;
    }
}
