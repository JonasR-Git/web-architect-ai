import type { DesignSystemExtraction } from '@/types';

/**
 * Design System Extractor
 *
 * Extracts typography, spacing, border radius, shadows from computed styles.
 * Creates reusable design tokens for the new website.
 */

export class DesignSystemExtractor {
    /**
     * Extracts design system from page evaluation
     */
    static extract(designData: {
        fontFamilies: string[];
        headingSizes: { h1?: string; h2?: string; h3?: string; h4?: string; h5?: string; h6?: string };
        fontWeights: number[];
        lineHeights: number[];
        spacingScale: number[];
        borderRadii: number[];
        shadows: string[];
        colors: { primary: string[]; secondary: string[]; text: string[]; background: string[] };
    }): DesignSystemExtraction {
        // Determine border radius mode
        let borderRadiusMode: 'sharp' | 'soft' | 'rounded' | 'pill' = 'sharp';
        const avgRadius = designData.borderRadii.length > 0
            ? designData.borderRadii.reduce((a, b) => a + b, 0) / designData.borderRadii.length
            : 0;

        if (avgRadius === 0) borderRadiusMode = 'sharp';
        else if (avgRadius < 8) borderRadiusMode = 'soft';
        else if (avgRadius < 20) borderRadiusMode = 'rounded';
        else borderRadiusMode = 'pill';

        // Determine shadow types
        const shadowTypes: ('soft' | 'hard' | 'none')[] = [];
        if (designData.shadows.length === 0) {
            shadowTypes.push('none');
        } else {
            designData.shadows.forEach(shadow => {
                if (shadow.includes('0px')) shadowTypes.push('soft');
                else shadowTypes.push('hard');
            });
        }

        return {
            typography: {
                fontFamilies: designData.fontFamilies,
                headingSizes: designData.headingSizes,
                bodySize: '16px', // Default
                fontWeights: designData.fontWeights,
                lineHeights: designData.lineHeights
            },
            spacing: {
                scale: designData.spacingScale,
                commonPaddings: designData.spacingScale.map(s => `${s}px`),
                commonMargins: designData.spacingScale.map(s => `${s}px`)
            },
            borderRadius: {
                values: designData.borderRadii,
                mostCommon: designData.borderRadii.length > 0 ? `${designData.borderRadii[0]}px` : '0px',
                mode: borderRadiusMode
            },
            shadows: {
                hasShadows: designData.shadows.length > 0,
                types: shadowTypes,
                commonValues: designData.shadows
            },
            colorPalette: designData.colors
        };
    }
}
