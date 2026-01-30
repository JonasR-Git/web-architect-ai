import type {
    SiteStructure,
    TargetSlot,
    ImageValidationResult,
    InvalidImage
} from '@/types';

/**
 * Image Validation Service
 *
 * Validates that images referenced in page specs actually exist in the
 * source asset inventory. Helps prevent hallucinated images in AI-generated specs.
 */
export class ImageValidator {
    /**
     * Builds an asset inventory from the crawled site structure
     *
     * Creates a map of all images found during crawling, indexed by their src URL.
     * Includes metadata like alt text, role, and source page.
     */
    static buildAssetInventory(structure: SiteStructure): Map<string, any> {
        const inventory = new Map<string, any>();

        structure.nodes.forEach(node => {
            if (!node.content.images) return;

            node.content.images.forEach(img => {
                if (!img.src) return;

                // Normalize URL for consistent matching
                const normalizedSrc = this.normalizeImageUrl(img.src);

                // Store with both normalized and original URLs
                const imageData = {
                    url: img.src,
                    normalizedUrl: normalizedSrc,
                    alt: img.alt,
                    role: img.role,
                    roleConfidence: img.roleConfidence,
                    context: img.context,
                    isLogo: img.isLogo,
                    logoProb: img.logoProb,
                    componentHint: img.componentHint,
                    groupId: img.groupId,
                    sourcePage: node.url,
                    usage: img.usage
                };

                // Store under both keys for flexible lookup
                inventory.set(img.src, imageData);
                if (normalizedSrc !== img.src) {
                    inventory.set(normalizedSrc, imageData);
                }
            });
        });

        return inventory;
    }

    /**
     * Validates that all images in page specs exist in the source inventory
     *
     * Checks each image reference in page spec sections against the inventory.
     * Returns validation result with list of invalid/missing images.
     */
    static validatePageSpecImages(
        pageSpecs: TargetSlot[],
        sourceInventory: Map<string, any>
    ): ImageValidationResult {
        const invalidImages: InvalidImage[] = [];
        const warnings: string[] = [];

        pageSpecs.forEach(spec => {
            // Check section images
            spec.sections?.forEach(section => {
                section.images?.forEach(img => {
                    if (!this.isImageInInventory(img.src, sourceInventory)) {
                        invalidImages.push({
                            src: img.src,
                            section: section.type,
                            reason: 'not_in_inventory'
                        });
                    }
                });
            });
        });

        // Generate warnings
        if (invalidImages.length > 0) {
            warnings.push(
                `${invalidImages.length} image(s) not found in source inventory. ` +
                `These may be AI-hallucinated or from external sources.`
            );

            // Group by reason
            const hallucinated = invalidImages.filter(img => img.reason === 'not_in_inventory');
            if (hallucinated.length > 0) {
                warnings.push(
                    `${hallucinated.length} potentially hallucinated images detected. ` +
                    `Consider regenerating specs or manually verifying these images.`
                );
            }
        }

        return {
            isValid: invalidImages.length === 0,
            invalidImages,
            warnings
        };
    }

    /**
     * Checks if an image exists in the inventory (with flexible matching)
     */
    private static isImageInInventory(src: string, inventory: Map<string, any>): boolean {
        // Direct match
        if (inventory.has(src)) {
            return true;
        }

        // Try normalized match
        const normalized = this.normalizeImageUrl(src);
        if (inventory.has(normalized)) {
            return true;
        }

        // Try partial match (e.g., relative vs absolute URLs)
        const srcPath = this.extractPathFromUrl(src);
        for (const [key] of inventory) {
            const keyPath = this.extractPathFromUrl(key);
            if (srcPath && keyPath && srcPath === keyPath) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalizes image URL for consistent matching
     *
     * Removes protocols, trailing slashes, and query parameters for better matching.
     */
    private static normalizeImageUrl(url: string): string {
        try {
            const urlObj = new URL(url);

            // Remove protocol
            let normalized = urlObj.href.replace(/^https?:\/\//, '');

            // Remove trailing slash
            normalized = normalized.replace(/\/$/, '');

            // Remove common query parameters (cache busters, etc.)
            normalized = normalized.split('?')[0];
            normalized = normalized.split('#')[0];

            return normalized;
        } catch {
            // Not a valid URL, return as-is but cleaned
            return url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('?')[0];
        }
    }

    /**
     * Extracts the path component from a URL
     */
    private static extractPathFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            // Try to extract path-like component from string
            const match = url.match(/\/([^?#]+)/);
            return match ? `/${match[1]}` : null;
        }
    }

    /**
     * Generates a report of image validation issues
     */
    static generateValidationReport(validation: ImageValidationResult): string {
        if (validation.isValid) {
            return '✅ All images validated successfully. No issues found.';
        }

        let report = `⚠️ Image Validation Issues Found\n\n`;
        report += `Total Issues: ${validation.invalidImages.length}\n\n`;

        if (validation.warnings.length > 0) {
            report += `Warnings:\n`;
            validation.warnings.forEach(warning => {
                report += `- ${warning}\n`;
            });
            report += `\n`;
        }

        if (validation.invalidImages.length > 0) {
            report += `Invalid Images:\n\n`;

            // Group by section
            const bySection = new Map<string, InvalidImage[]>();
            validation.invalidImages.forEach(img => {
                if (!bySection.has(img.section)) {
                    bySection.set(img.section, []);
                }
                bySection.get(img.section)!.push(img);
            });

            bySection.forEach((images, section) => {
                report += `${section}:\n`;
                images.forEach(img => {
                    report += `  - ${img.src} (${img.reason})\n`;
                });
                report += `\n`;
            });
        }

        return report;
    }

    /**
     * Filters page specs to remove invalid images
     *
     * Removes all images from page specs that don't exist in the inventory.
     * Useful for automatically cleaning up hallucinated images.
     */
    static filterInvalidImages(
        pageSpecs: TargetSlot[],
        sourceInventory: Map<string, any>
    ): TargetSlot[] {
        return pageSpecs.map(spec => ({
            ...spec,
            sections: spec.sections?.map(section => ({
                ...section,
                images: section.images?.filter(img =>
                    this.isImageInInventory(img.src, sourceInventory)
                )
            }))
        }));
    }

    /**
     * Gets statistics about image usage across the site
     */
    static getImageStatistics(structure: SiteStructure): {
        totalImages: number;
        uniqueImages: number;
        byRole: Record<string, number>;
        avgImagesPerPage: number;
    } {
        const inventory = this.buildAssetInventory(structure);
        const roleCount: Record<string, number> = {};

        inventory.forEach(img => {
            const role = img.role || 'unknown';
            roleCount[role] = (roleCount[role] || 0) + 1;
        });

        const totalImages = structure.nodes.reduce((sum, node) =>
            sum + (node.content.images?.length || 0), 0
        );

        return {
            totalImages,
            uniqueImages: inventory.size,
            byRole: roleCount,
            avgImagesPerPage: structure.nodes.length > 0
                ? totalImages / structure.nodes.length
                : 0
        };
    }
}
