import * as cheerio from 'cheerio';
import type { LinkAnalysis, LinkType, LinkRole, SocialPlatform, ButtonStyle } from '@/types';

/**
 * Link Analysis Service
 *
 * Intelligently classifies links into CTAs, Navigation, Social Media, etc.
 * Critical for preserving navigation structure and identifying conversion elements.
 */

export class LinkAnalyzer {
    /**
     * Analyzes all links on a page and classifies them
     */
    static analyzeLinks($: cheerio.CheerioAPI, pageUrl: string): LinkAnalysis[] {
        const links: LinkAnalysis[] = [];

        // Extract regular <a href> links
        $('a[href]').each((_, linkEl) => {
            const $link = $(linkEl);
            const href = $link.attr('href');
            if (!href) return;

            const text = $link.text().trim();
            const ariaLabel = $link.attr('aria-label');

            // Determine link type
            const type = this.determineLinkType(href, pageUrl);

            // Determine role and confidence
            const { role, confidence } = this.determineLinkRole($, $link, href, text);

            // Detect if it's styled as a button
            const { isButton, buttonStyle } = this.detectButtonStyle($link);

            // Extract context (parent section)
            const context = this.extractContext($, $link);

            // Check for social media
            const social = this.detectSocial(href, text);

            // Check attributes
            const opensInNewTab = $link.attr('target') === '_blank';
            const isDownload = $link.attr('download') !== undefined;

            links.push({
                href,
                text,
                type,
                role,
                roleConfidence: confidence,
                context,
                isButton,
                buttonStyle,
                social,
                ariaLabel,
                opensInNewTab,
                isDownload
            });
        });

        // FRAMESET SUPPORT: Extract <frame> and <iframe> sources as internal links
        // This enables crawling of old frameset-based websites
        $('frame[src], iframe[src]').each((_, frameEl) => {
            const $frame = $(frameEl);
            const src = $frame.attr('src');
            if (!src) return;

            const frameName = $frame.attr('name') || 'frame';
            const frameTitle = $frame.attr('title') || '';

            // Resolve relative URLs
            let resolvedSrc: string;
            try {
                resolvedSrc = new URL(src, pageUrl).toString();
            } catch {
                // Invalid URL, skip
                return;
            }

            links.push({
                href: resolvedSrc,
                text: frameTitle || `[Frame: ${frameName}]`,
                type: 'internal', // Frames are always internal to the same site
                role: 'navigation', // Frames typically contain navigation or content
                roleConfidence: 70,
                context: 'frameset',
                isButton: false,
                buttonStyle: undefined,
                social: undefined,
                ariaLabel: frameTitle || undefined,
                opensInNewTab: false,
                isDownload: false
            });
        });

        return links;
    }

    /**
     * Determines the type of link (internal, external, anchor, etc.)
     */
    private static determineLinkType(href: string, pageUrl: string): LinkType {
        const hrefLower = href.toLowerCase();

        // Tel link
        if (hrefLower.startsWith('tel:')) return 'tel';

        // Mailto link
        if (hrefLower.startsWith('mailto:')) return 'mailto';

        // Anchor link
        if (href.startsWith('#')) return 'anchor';

        // Try to determine internal vs external
        try {
            const linkUrl = new URL(href, pageUrl);
            const pageUrlObj = new URL(pageUrl);

            if (linkUrl.hostname === pageUrlObj.hostname) {
                return 'internal';
            } else {
                return 'external';
            }
        } catch {
            // Relative URLs are internal
            if (href.startsWith('/') || !href.includes('://')) {
                return 'internal';
            }
            return 'external';
        }
    }

    /**
     * Determines the role of a link (navigation, CTA, social, etc.)
     */
    private static determineLinkRole(
        $: cheerio.CheerioAPI,
        $link: cheerio.Cheerio<any>,
        href: string,
        text: string
    ): { role: LinkRole; confidence: number } {
        let scores: Record<LinkRole, number> = {
            navigation: 0,
            cta: 0,
            social: 0,
            footer: 0,
            content: 0,
            breadcrumb: 0,
            pagination: 0
        };

        const textLower = text.toLowerCase();
        const hrefLower = href.toLowerCase();

        // Check parent elements for context
        const parents = $link.parentsUntil('body').toArray().map(el => $(el));
        const hasNavParent = parents.some(p => p.is('nav') || p.attr('role') === 'navigation');
        const hasHeaderParent = parents.some(p => p.is('header'));
        const hasFooterParent = parents.some(p => p.is('footer'));
        const hasBreadcrumbParent = parents.some(p =>
            p.attr('aria-label')?.toLowerCase().includes('breadcrumb') ||
            p.attr('class')?.includes('breadcrumb')
        );
        const hasPaginationParent = parents.some(p =>
            p.attr('class')?.includes('paginat') ||
            p.attr('aria-label')?.toLowerCase().includes('paginat')
        );

        // Navigation signals
        if (hasNavParent || hasHeaderParent) scores.navigation += 50;
        if (textLower.match(/^(home|about|services|products|contact|blog|faq|team|pricing|features)$/)) {
            scores.navigation += 30;
        }
        if (hrefLower.match(/^\/(home|about|services|products|contact|blog|faq|team|pricing|features)/)) {
            scores.navigation += 20;
        }

        // CTA signals (Call-to-Action)
        const ctaKeywords = [
            'buy', 'purchase', 'get started', 'start', 'sign up', 'register', 'subscribe',
            'download', 'try', 'demo', 'contact', 'book', 'reserve', 'order', 'shop',
            'learn more', 'request', 'schedule', 'join', 'enroll',
            // German
            'kaufen', 'starten', 'anmelden', 'registrieren', 'herunterladen', 'buchen',
            'bestellen', 'mehr erfahren', 'anfragen', 'jetzt', 'kostenlos'
        ];

        if (ctaKeywords.some(kw => textLower.includes(kw))) {
            scores.cta += 40;
        }

        // Button styling is a strong CTA signal
        const classes = $link.attr('class') || '';
        if (classes.includes('btn') || classes.includes('button') || classes.includes('cta')) {
            scores.cta += 35;
        }

        // Check if it's in a prominent position (hero, banner)
        const hasHeroParent = parents.some(p =>
            (p.attr('class') || '').match(/hero|banner|jumbotron|intro/)
        );
        if (hasHeroParent) scores.cta += 25;

        // Social media signals
        const socialPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'github', 'tiktok'];
        if (socialPlatforms.some(platform => hrefLower.includes(platform))) {
            scores.social += 60;
        }
        if (textLower.match(/^(facebook|twitter|linkedin|instagram|youtube|github|tiktok)$/)) {
            scores.social += 40;
        }

        // Footer signals
        if (hasFooterParent) {
            scores.footer += 40;
            // Footer links are often navigation too
            if (!ctaKeywords.some(kw => textLower.includes(kw))) {
                scores.navigation += 20;
            }
        }

        // Breadcrumb signals
        if (hasBreadcrumbParent) scores.breadcrumb += 70;
        if (textLower.match(/^(home|back|zurück)$/) && hrefLower === '/') {
            scores.breadcrumb += 30;
        }

        // Pagination signals
        if (hasPaginationParent) scores.pagination += 70;
        if (textLower.match(/^(next|previous|prev|page \d+|\d+|»|«|›|‹|weiter|zurück)$/)) {
            scores.pagination += 40;
        }
        if (hrefLower.match(/page=\d+|\/page\/\d+/)) {
            scores.pagination += 30;
        }

        // Content signals (in-article links)
        const hasArticleParent = parents.some(p => p.is('article') || p.is('main'));
        const hasContentClass = parents.some(p =>
            (p.attr('class') || '').match(/content|article|post|text/)
        );
        if ((hasArticleParent || hasContentClass) && !hasNavParent && !hasFooterParent) {
            scores.content += 40;
        }

        // Find highest score
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topRole, topScore] = sortedScores[0];

        // If score is too low, default to content
        if (topScore < 15) {
            return { role: 'content', confidence: 30 };
        }

        // Calculate confidence (0-100)
        const confidence = Math.min(100, Math.round(topScore));

        return { role: topRole as LinkRole, confidence };
    }

    /**
     * Detects if link is styled as a button
     */
    private static detectButtonStyle($link: cheerio.Cheerio<any>): { isButton: boolean; buttonStyle?: ButtonStyle } {
        // Check if it's actually a button element
        const isButtonElement = $link.is('button');

        // Check classes for button styling
        const classes = ($link.attr('class') || '').toLowerCase();
        const hasButtonClass = classes.includes('btn') ||
                              classes.includes('button') ||
                              classes.includes('cta');

        const isButton = isButtonElement || hasButtonClass;

        if (!isButton) {
            return { isButton: false };
        }

        // Detect button style
        let style: ButtonStyle = 'unknown';

        if (classes.includes('primary') || classes.includes('btn-primary')) {
            style = 'primary';
        } else if (classes.includes('secondary') || classes.includes('btn-secondary')) {
            style = 'secondary';
        } else if (classes.includes('ghost') || classes.includes('outline') || classes.includes('btn-outline')) {
            style = 'ghost';
        } else if (classes.includes('link') || classes.includes('btn-link')) {
            style = 'link';
        } else if (hasButtonClass) {
            // If it has a button class but no specific style, assume primary
            style = 'primary';
        }

        return { isButton, buttonStyle: style };
    }

    /**
     * Detects social media links
     */
    private static detectSocial(href: string, text: string): { platform: SocialPlatform; handle?: string } | undefined {
        const hrefLower = href.toLowerCase();
        const textLower = text.toLowerCase();

        const platforms: { platform: SocialPlatform; patterns: RegExp[] }[] = [
            { platform: 'facebook', patterns: [/facebook\.com/i, /fb\.com/i] },
            { platform: 'twitter', patterns: [/twitter\.com/i, /x\.com/i] },
            { platform: 'linkedin', patterns: [/linkedin\.com/i] },
            { platform: 'instagram', patterns: [/instagram\.com/i] },
            { platform: 'youtube', patterns: [/youtube\.com/i, /youtu\.be/i] },
            { platform: 'github', patterns: [/github\.com/i] },
            { platform: 'tiktok', patterns: [/tiktok\.com/i] },
            { platform: 'whatsapp', patterns: [/wa\.me/i, /whatsapp\.com/i] },
            { platform: 'email', patterns: [/^mailto:/i] }
        ];

        for (const { platform, patterns } of platforms) {
            if (patterns.some(pattern => pattern.test(hrefLower)) ||
                textLower === platform) {
                // Try to extract handle/username
                let handle: string | undefined;

                if (platform === 'email') {
                    handle = href.replace(/^mailto:/i, '').split('?')[0];
                } else {
                    // Extract from URL path
                    try {
                        const url = new URL(href);
                        const pathParts = url.pathname.split('/').filter(Boolean);
                        if (pathParts.length > 0) {
                            handle = '@' + pathParts[0];
                        }
                    } catch { }
                }

                return { platform, handle };
            }
        }

        return undefined;
    }

    /**
     * Extracts context (parent section)
     */
    private static extractContext($: cheerio.CheerioAPI, $link: cheerio.Cheerio<any>): string | undefined {
        const parents = $link.parentsUntil('body').toArray();

        for (const parent of parents) {
            const $parent = $(parent);
            const tag = $parent.prop('tagName')?.toLowerCase();

            if (tag === 'header') return 'header';
            if (tag === 'footer') return 'footer';
            if (tag === 'nav') return 'navigation';
            if (tag === 'aside') return 'sidebar';
            if (tag === 'main') return 'main';
            if (tag === 'article') return 'article';

            // Check roles
            const role = $parent.attr('role');
            if (role === 'navigation') return 'navigation';
            if (role === 'contentinfo') return 'footer';
            if (role === 'banner') return 'header';

            // Check classes
            const classes = $parent.attr('class') || '';
            if (classes.match(/hero|banner/)) return 'hero';
            if (classes.match(/sidebar/)) return 'sidebar';
        }

        return undefined;
    }

    /**
     * Generates a summary report for links
     */
    static generateLinkReport(links: LinkAnalysis[]): string {
        if (links.length === 0) return 'No links found on this page.';

        // Group by role
        const byRole: Record<LinkRole, LinkAnalysis[]> = {
            navigation: [],
            cta: [],
            social: [],
            footer: [],
            content: [],
            breadcrumb: [],
            pagination: []
        };

        links.forEach(link => {
            if (byRole[link.role]) {
                byRole[link.role].push(link);
            }
        });

        let report = `Found ${links.length} link(s):\n\n`;

        Object.entries(byRole).forEach(([role, roleLinks]) => {
            if (roleLinks.length > 0) {
                report += `${role.toUpperCase()}: ${roleLinks.length}\n`;

                // Show top 5
                roleLinks.slice(0, 5).forEach(link => {
                    report += `  - "${link.text}" → ${link.href}\n`;
                });

                if (roleLinks.length > 5) {
                    report += `  ... and ${roleLinks.length - 5} more\n`;
                }

                report += `\n`;
            }
        });

        // Social media summary
        const socialLinks = links.filter(l => l.social);
        if (socialLinks.length > 0) {
            report += `Social Media Profiles:\n`;
            socialLinks.forEach(link => {
                report += `  - ${link.social!.platform}: ${link.social!.handle || link.href}\n`;
            });
            report += `\n`;
        }

        return report;
    }
}
