import { Vibrant } from 'node-vibrant/node';

/**
 * Image Color Analyzer
 *
 * Extracts color palettes from images during crawling for design system analysis.
 */

export interface ColorPalette {
    primary: string;        // Hex color
    secondary?: string;
    accent?: string;
    vibrant?: string;
    muted?: string;
    lightVibrant?: string;
    darkVibrant?: string;
}

export interface ImageColorAnalysis {
    url: string;
    palette: ColorPalette;
    dominantColor: string;
    brightness: 'light' | 'medium' | 'dark';
    saturation: 'vibrant' | 'muted' | 'grayscale';
}

export class ImageColorAnalyzer {
    /**
     * Analyzes image colors and extracts design-relevant palette
     *
     * @param imageUrl - URL of the image to analyze
     * @returns Color analysis results
     */
    static async analyzeImageColors(imageUrl: string): Promise<ImageColorAnalysis> {
        try {
            const palette = await Vibrant.from(imageUrl).getPalette();

            // Extract main colors
            const colorPalette: ColorPalette = {
                primary: palette.Vibrant?.hex || '#000000',
                secondary: palette.DarkVibrant?.hex,
                accent: palette.LightVibrant?.hex,
                vibrant: palette.Vibrant?.hex,
                muted: palette.Muted?.hex,
                lightVibrant: palette.LightVibrant?.hex,
                darkVibrant: palette.DarkVibrant?.hex
            };

            // Determine brightness
            const brightness = this.calculateBrightness(
                palette.Vibrant?.rgb || [0, 0, 0]
            );

            // Determine saturation
            const saturation = this.calculateSaturation(palette);

            return {
                url: imageUrl,
                palette: colorPalette,
                dominantColor: colorPalette.primary,
                brightness,
                saturation
            };
        } catch (error) {
            // Silently skip unsupported formats (SVGs, corrupt buffers)
            // Return fallback
            return {
                url: imageUrl,
                palette: { primary: '#000000' },
                dominantColor: '#000000',
                brightness: 'medium',
                saturation: 'muted'
            };
        }
    }

    /**
     * Analyzes multiple images and extracts site-wide color scheme
     *
     * @param images - Array of images with role classification
     * @returns Aggregated design system colors
     */
    static async extractDesignSystemColors(
        images: Array<{ src: string; role: string }>
    ): Promise<{
        brandColors: ColorPalette;
        heroColors: ColorPalette[];
        logoColors: ColorPalette[];
        overallPalette: string[];
    }> {
        // Prioritize logo images for brand colors
        const logoImages = images.filter(img => img.role === 'logo');
        const heroImages = images.filter(img =>
            img.role === 'hero-background' || img.role === 'hero-foreground'
        );

        // Analyze logos first (most important for brand)
        const logoAnalyses = await Promise.all(
            logoImages.slice(0, 3).map(img => this.analyzeImageColors(img.src))
        );

        // Analyze hero images
        const heroAnalyses = await Promise.all(
            heroImages.slice(0, 5).map(img => this.analyzeImageColors(img.src))
        );

        // Extract brand colors from logo
        const brandColors = logoAnalyses.length > 0
            ? logoAnalyses[0].palette
            : { primary: '#000000' };

        // Collect all unique colors
        const allColors = new Set<string>();
        [...logoAnalyses, ...heroAnalyses].forEach(analysis => {
            Object.values(analysis.palette).forEach(color => {
                if (color) allColors.add(color);
            });
        });

        return {
            brandColors,
            heroColors: heroAnalyses.map(a => a.palette),
            logoColors: logoAnalyses.map(a => a.palette),
            overallPalette: Array.from(allColors)
        };
    }

    /**
     * Calculates brightness level from RGB values
     */
    private static calculateBrightness(rgb: [number, number, number]): 'light' | 'medium' | 'dark' {
        // Using perceived brightness formula
        const brightness = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

        if (brightness > 0.6) return 'light';
        if (brightness > 0.3) return 'medium';
        return 'dark';
    }

    /**
     * Calculates saturation level from palette
     */
    private static calculateSaturation(palette: any): 'vibrant' | 'muted' | 'grayscale' {
        const vibrantPop = palette.Vibrant?.population || 0;
        const mutedPop = palette.Muted?.population || 0;
        const totalPop = vibrantPop + mutedPop;

        if (totalPop === 0) return 'grayscale';

        const vibrantRatio = vibrantPop / totalPop;
        if (vibrantRatio > 0.6) return 'vibrant';
        if (vibrantRatio > 0.3) return 'muted';
        return 'grayscale';
    }

    /**
     * Generates CSS color variables from palette
     */
    static generateCSSVariables(palette: ColorPalette): string {
        return `
:root {
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary || palette.primary};
  --color-accent: ${palette.accent || palette.primary};
  --color-vibrant: ${palette.vibrant || palette.primary};
  --color-muted: ${palette.muted || '#808080'};
}
        `.trim();
    }
}
