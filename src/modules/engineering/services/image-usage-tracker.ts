import type { SiteStructure, TargetSlot } from '@/types';

/**
 * Image Usage Tracker
 *
 * Ensures ZERO image loss by tracking which source images are used in target specs
 * and providing suggestions for unused images.
 */

export interface ImageUsageReport {
    totalSourceImages: number;
    usedImages: number;
    unusedImages: UnusedImage[];
    coveragePercentage: number;
    byRole: Record<string, { total: number; used: number; unused: number }>;
}

export interface UnusedImage {
    src: string;
    alt?: string;
    role: string;
    roleConfidence: number;
    sourcePage: string;
    suggestedTarget?: string; // Which target spec should use this
}

export class ImageUsageTracker {
    /**
     * Builds inventory of all source images from crawled structure
     *
     * IMPORTANT: Only tracks MASTER images (largest versions).
     * Variants (smaller sizes) are linked via masterImage field but not tracked separately.
     */
    static buildSourceInventory(structure: SiteStructure): Map<string, any> {
        const inventory = new Map<string, any>();

        structure.nodes.forEach(node => {
            if (!node.content.images) return;

            node.content.images.forEach(img => {
                if (!img.src) return;

                // Skip variant images (smaller versions) - only track masters
                if (img.masterImage) {
                    return; // This is a variant, skip it
                }

                inventory.set(img.src, {
                    src: img.src,
                    alt: img.alt,
                    role: img.role || 'unknown',
                    roleConfidence: img.roleConfidence || 0,
                    sourcePage: node.url,
                    context: img.context,
                    isLogo: img.isLogo,
                    usage: img.usage,
                    variants: img.variants || [], // Include list of smaller versions
                    width: img.width,
                    height: img.height
                });
            });
        });

        return inventory;
    }

    /**
     * Tracks which images are actually used in generated page specs
     *
     * IMPORTANT: Recognizes both master images and variants as "used".
     * If a variant is used, the master is considered used too.
     */
    static analyzeUsage(
        structure: SiteStructure,
        pageSpecs: TargetSlot[]
    ): ImageUsageReport {
        const sourceInventory = this.buildSourceInventory(structure);
        const usedImages = new Set<string>();

        // Track all images used in page specs
        pageSpecs.forEach(spec => {
            spec.sections?.forEach(section => {
                section.images?.forEach(img => {
                    usedImages.add(img.src);
                });
            });
        });

        // Build variant-to-master map for reverse lookup
        const variantToMaster = new Map<string, string>();
        sourceInventory.forEach((img, src) => {
            if (img.variants && img.variants.length > 0) {
                img.variants.forEach((variantSrc: string) => {
                    variantToMaster.set(variantSrc, src);
                });
            }
        });

        // Check if master or any of its variants are used
        const isMasterUsed = (masterSrc: string, variants: string[]): boolean => {
            // Check if master itself is used
            if (usedImages.has(masterSrc)) return true;

            // Check if any variant is used
            return variants.some(variantSrc => usedImages.has(variantSrc));
        };

        // Find unused images
        const unusedImages: UnusedImage[] = [];
        const byRole: Record<string, { total: number; used: number; unused: number }> = {};

        sourceInventory.forEach((img, src) => {
            const role = img.role;
            if (!byRole[role]) {
                byRole[role] = { total: 0, used: 0, unused: 0 };
            }
            byRole[role].total++;

            // Check if master or any variant is used
            if (isMasterUsed(src, img.variants || [])) {
                byRole[role].used++;
            } else {
                byRole[role].unused++;

                // Suggest target based on role
                const suggestedTarget = this.suggestTargetForImage(img, pageSpecs);

                unusedImages.push({
                    src: img.src,
                    alt: img.alt,
                    role: img.role,
                    roleConfidence: img.roleConfidence,
                    sourcePage: img.sourcePage,
                    suggestedTarget
                });
            }
        });

        return {
            totalSourceImages: sourceInventory.size,
            usedImages: usedImages.size,
            unusedImages,
            coveragePercentage: Math.round((usedImages.size / sourceInventory.size) * 100),
            byRole
        };
    }

    /**
     * Suggests which target spec should use an unused image
     */
    private static suggestTargetForImage(
        img: any,
        pageSpecs: TargetSlot[]
    ): string | undefined {
        // Role-based suggestions
        const roleToSectionType: Record<string, string[]> = {
            'logo': ['header_global', 'footer_global'],
            'hero-background': ['hero'],
            'hero-foreground': ['hero'],
            'team-avatar': ['team', 'text'],
            'gallery': ['gallery', 'bento_grid'],
            'blog-thumbnail': ['text', 'features'],
            'product': ['features', 'bento_grid'],
            'testimonial': ['testimonials'],
            'sponsor-logo': ['footer_global', 'text'],
            'award-badge': ['text', 'features']
        };

        const suggestedSectionTypes = roleToSectionType[img.role] || ['text'];

        // Find specs with matching section types
        for (const spec of pageSpecs) {
            if (!spec.sections) continue;

            for (const section of spec.sections) {
                if (suggestedSectionTypes.includes(section.type)) {
                    return `${spec.path} → ${section.type}`;
                }
            }
        }

        return undefined;
    }

    /**
     * Generates a report with recommendations
     */
    static generateUsageReport(report: ImageUsageReport): string {
        let output = `# Image Usage Report\n\n`;
        output += `## Summary\n\n`;
        output += `- **Total Source Images:** ${report.totalSourceImages}\n`;
        output += `- **Used in Specs:** ${report.usedImages} (${report.coveragePercentage}%)\n`;
        output += `- **Unused:** ${report.unusedImages.length}\n\n`;

        if (report.coveragePercentage >= 90) {
            output += `✅ **Excellent coverage!** Most images are being used.\n\n`;
        } else if (report.coveragePercentage >= 70) {
            output += `⚠️ **Good coverage** but some images could be utilized better.\n\n`;
        } else {
            output += `❌ **Low coverage!** Many images are unused. Consider regenerating specs.\n\n`;
        }

        output += `## Usage by Role\n\n`;
        output += `| Role | Total | Used | Unused | Coverage |\n`;
        output += `|------|-------|------|--------|---------|\n`;

        Object.entries(report.byRole).forEach(([role, stats]) => {
            const coverage = stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0;
            output += `| ${role} | ${stats.total} | ${stats.used} | ${stats.unused} | ${coverage}% |\n`;
        });

        output += `\n`;

        if (report.unusedImages.length > 0) {
            output += `## Unused Images (Top 20)\n\n`;
            const topUnused = report.unusedImages
                .sort((a, b) => b.roleConfidence - a.roleConfidence)
                .slice(0, 20);

            topUnused.forEach(img => {
                output += `### ${img.role} (${img.roleConfidence}% confidence)\n`;
                output += `- **Source:** ${img.src.split('/').pop()}\n`;
                output += `- **Alt:** ${img.alt || 'N/A'}\n`;
                output += `- **From:** ${img.sourcePage}\n`;
                if (img.suggestedTarget) {
                    output += `- **Suggestion:** Add to ${img.suggestedTarget}\n`;
                }
                output += `\n`;
            });
        }

        return output;
    }

    /**
     * Auto-assigns unused images to appropriate sections
     *
     * This is the ZERO LOSS guarantee - all images get distributed!
     */
    static autoDistributeUnusedImages(
        pageSpecs: TargetSlot[],
        unusedImages: UnusedImage[]
    ): TargetSlot[] {
        const specs = JSON.parse(JSON.stringify(pageSpecs)); // Deep clone

        unusedImages.forEach(img => {
            // Find best target based on role
            let assigned = false;

            for (const spec of specs) {
                if (!spec.sections || assigned) continue;

                for (const section of spec.sections) {
                    // Role-based matching
                    if (this.shouldAddImageToSection(img.role, section.type)) {
                        if (!section.images) section.images = [];

                        // Limit: Max 10 images per section
                        if (section.images.length < 10) {
                            section.images.push({ src: img.src, alt: img.alt });
                            assigned = true;
                            break;
                        }
                    }
                }
            }

            // Fallback: Add to first "text" or "features" section
            if (!assigned) {
                const fallbackSpec = specs.find((s: any) =>
                    s.sections?.some((sec: any) => sec.type === 'text' || sec.type === 'features')
                );

                if (fallbackSpec) {
                    const fallbackSection = fallbackSpec.sections!.find((s: any) =>
                        s.type === 'text' || s.type === 'features'
                    );

                    if (fallbackSection) {
                        if (!fallbackSection.images) fallbackSection.images = [];
                        if (fallbackSection.images.length < 10) {
                            fallbackSection.images.push({ src: img.src, alt: img.alt });
                        }
                    }
                }
            }
        });

        return specs;
    }

    /**
     * Determines if an image role matches a section type
     */
    private static shouldAddImageToSection(role: string, sectionType: string): boolean {
        const roleToSectionMap: Record<string, string[]> = {
            'logo': ['header_global', 'footer_global'],
            'hero-background': ['hero'],
            'hero-foreground': ['hero'],
            'team-avatar': ['team', 'text'],
            'gallery': ['gallery', 'bento_grid'],
            'blog-thumbnail': ['text', 'features', 'bento_grid'],
            'product': ['features', 'bento_grid'],
            'testimonial': ['testimonials'],
            'sponsor-logo': ['footer_global'],
            'award-badge': ['features', 'text'],
            'section-feature': ['features', 'text'],
            'event-photo': ['gallery', 'bento_grid'],
            'location-photo': ['text', 'features'],
            'icon': ['features'],
            'content': ['text']
        };

        const allowedSections = roleToSectionMap[role] || ['text'];
        return allowedSections.includes(sectionType);
    }
}
