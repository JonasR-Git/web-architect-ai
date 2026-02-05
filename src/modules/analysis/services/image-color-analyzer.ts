import { Vibrant } from 'node-vibrant/node';
import sharp from 'sharp';

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

export interface PositionalColors {
    main: ColorPalette;
    top: string[];
    bottom: string[];
    left: string[];
    right: string[];
    center: string[];
    corners: {
        topLeft: string;
        topRight: string;
        bottomLeft: string;
        bottomRight: string;
    };
}

export interface ImageColorAnalysis {
    url: string;
    palette: ColorPalette;
    dominantColor: string;
    brightness: 'light' | 'medium' | 'dark';
    saturation: 'vibrant' | 'muted' | 'grayscale';
    positional?: PositionalColors;
}

export class ImageColorAnalyzer {
    /**
     * Analyzes image colors and extracts design-relevant palette
     *
     * @param imageUrl - URL of the image to analyze
     * @param extractPositional - Whether to extract positional color data (slower but more detailed)
     * @returns Color analysis results
     */
    static async analyzeImageColors(
        imageUrl: string,
        extractPositional: boolean = false
    ): Promise<ImageColorAnalysis> {
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

            // Extract positional colors if requested
            let positional: PositionalColors | undefined;
            if (extractPositional) {
                positional = await this.analyzePositionalColors(imageUrl, colorPalette);
            }

            return {
                url: imageUrl,
                palette: colorPalette,
                dominantColor: colorPalette.primary,
                brightness,
                saturation,
                positional
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
     * Extracts colors from specific regions of an image for harmonious design transitions
     * Uses sharp to crop regions and Vibrant to analyze each region separately
     *
     * @param imageUrl - URL of the image to analyze
     * @param mainPalette - Main palette for reference (fallback)
     * @returns Positional color breakdown
     */
    private static async analyzePositionalColors(
        imageUrl: string,
        mainPalette: ColorPalette
    ): Promise<PositionalColors> {
        try {
            // Download image with timeout and size limit
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(imageUrl, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            // Check file size (skip if >5MB)
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
                console.warn(`[ColorAnalyzer] Image too large (${contentLength} bytes), using fallback`);
                return this.getFallbackPositionalColors(mainPalette);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Load image with sharp
            const image = sharp(buffer);
            const metadata = await image.metadata();
            const { width = 0, height = 0 } = metadata;

            if (width === 0 || height === 0) {
                throw new Error('Invalid image dimensions');
            }

            // Define regions (percentages)
            const regions = {
                top: { left: 0, top: 0, width, height: Math.floor(height * 0.2) },
                bottom: { left: 0, top: Math.floor(height * 0.8), width, height: Math.floor(height * 0.2) },
                left: { left: 0, top: 0, width: Math.floor(width * 0.2), height },
                right: { left: Math.floor(width * 0.8), top: 0, width: Math.floor(width * 0.2), height },
                center: {
                    left: Math.floor(width * 0.3),
                    top: Math.floor(height * 0.3),
                    width: Math.floor(width * 0.4),
                    height: Math.floor(height * 0.4)
                },
                topLeft: { left: 0, top: 0, width: Math.floor(width * 0.15), height: Math.floor(height * 0.15) },
                topRight: { left: Math.floor(width * 0.85), top: 0, width: Math.floor(width * 0.15), height: Math.floor(height * 0.15) },
                bottomLeft: { left: 0, top: Math.floor(height * 0.85), width: Math.floor(width * 0.15), height: Math.floor(height * 0.15) },
                bottomRight: { left: Math.floor(width * 0.85), top: Math.floor(height * 0.85), width: Math.floor(width * 0.15), height: Math.floor(height * 0.15) }
            };

            // Extract and analyze all regions in parallel
            const [
                topColors,
                bottomColors,
                leftColors,
                rightColors,
                centerColors,
                topLeftColor,
                topRightColor,
                bottomLeftColor,
                bottomRightColor
            ] = await Promise.all([
                this.extractRegionColors(image, regions.top),
                this.extractRegionColors(image, regions.bottom),
                this.extractRegionColors(image, regions.left),
                this.extractRegionColors(image, regions.right),
                this.extractRegionColors(image, regions.center),
                this.extractRegionColors(image, regions.topLeft, 1),
                this.extractRegionColors(image, regions.topRight, 1),
                this.extractRegionColors(image, regions.bottomLeft, 1),
                this.extractRegionColors(image, regions.bottomRight, 1)
            ]);

            return {
                main: mainPalette,
                top: topColors,
                bottom: bottomColors,
                left: leftColors,
                right: rightColors,
                center: centerColors,
                corners: {
                    topLeft: topLeftColor[0] || mainPalette.primary,
                    topRight: topRightColor[0] || mainPalette.primary,
                    bottomLeft: bottomLeftColor[0] || mainPalette.primary,
                    bottomRight: bottomRightColor[0] || mainPalette.primary
                }
            };
        } catch (error) {
            // Fallback to main palette on any error
            console.warn(`[ColorAnalyzer] Positional extraction failed for ${imageUrl}:`, error);
            return this.getFallbackPositionalColors(mainPalette);
        }
    }

    /**
     * Extracts top N colors from a specific image region
     *
     * @param image - Sharp image instance
     * @param region - Region coordinates {left, top, width, height}
     * @param count - Number of colors to extract (default 3)
     * @returns Array of hex colors
     */
    private static async extractRegionColors(
        image: sharp.Sharp,
        region: { left: number; top: number; width: number; height: number },
        count: number = 3
    ): Promise<string[]> {
        try {
            // Extract region as buffer
            const regionBuffer = await image
                .clone()
                .extract(region)
                .toFormat('png')
                .toBuffer();

            // Analyze with Vibrant
            const palette = await Vibrant.from(regionBuffer).getPalette();

            // Extract top N colors
            const colors: string[] = [];
            const swatches = [
                palette.Vibrant,
                palette.DarkVibrant,
                palette.LightVibrant,
                palette.Muted,
                palette.DarkMuted,
                palette.LightMuted
            ];

            for (const swatch of swatches) {
                if (swatch?.hex && colors.length < count) {
                    colors.push(swatch.hex);
                }
            }

            return colors.length > 0 ? colors : ['#000000'];
        } catch (error) {
            return ['#000000'];
        }
    }

    /**
     * Fallback positional colors when region extraction fails
     */
    private static getFallbackPositionalColors(mainPalette: ColorPalette): PositionalColors {
        return {
            main: mainPalette,
            top: [mainPalette.lightVibrant || mainPalette.primary],
            bottom: [mainPalette.darkVibrant || mainPalette.primary],
            left: [mainPalette.muted || mainPalette.primary],
            right: [mainPalette.vibrant || mainPalette.primary],
            center: [mainPalette.primary],
            corners: {
                topLeft: mainPalette.lightVibrant || mainPalette.primary,
                topRight: mainPalette.vibrant || mainPalette.primary,
                bottomLeft: mainPalette.muted || mainPalette.primary,
                bottomRight: mainPalette.darkVibrant || mainPalette.primary
            }
        };
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
