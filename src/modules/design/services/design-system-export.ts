/**
 * Design System Export Service
 *
 * Extracts design tokens from DesignConfig and exports them in multiple formats:
 * - CSS Variables (.css)
 * - Tailwind Config (.js)
 * - Figma Tokens (.json)
 * - Style Dictionary (.json)
 */

import type { DesignConfig } from '@/types';

export interface DesignTokens {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    neutral: Record<string, string>;
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    fontFamilies: {
      heading: string;
      body: string;
      mono: string;
    };
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number>;
    letterSpacing: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface ExportOptions {
  includeComments?: boolean;
  prefix?: string;
  formatPrettify?: boolean;
}

/**
 * Extracts design tokens from DesignConfig
 */
export function extractDesignTokens(config: DesignConfig): DesignTokens {
  const { colors } = config;

  // Extract color scales
  const primaryColors: Record<string, string> = {};
  const secondaryColors: Record<string, string> = {};
  const neutralColors: Record<string, string> = {};

  if (colors.primary) {
    primaryColors['50'] = lighten(colors.primary, 0.4);
    primaryColors['100'] = lighten(colors.primary, 0.3);
    primaryColors['200'] = lighten(colors.primary, 0.2);
    primaryColors['300'] = lighten(colors.primary, 0.1);
    primaryColors['400'] = colors.primary;
    primaryColors['500'] = colors.primary;
    primaryColors['600'] = darken(colors.primary, 0.1);
    primaryColors['700'] = darken(colors.primary, 0.2);
    primaryColors['800'] = darken(colors.primary, 0.3);
    primaryColors['900'] = darken(colors.primary, 0.4);
  }

  if (colors.secondary) {
    secondaryColors['50'] = lighten(colors.secondary, 0.4);
    secondaryColors['100'] = lighten(colors.secondary, 0.3);
    secondaryColors['200'] = lighten(colors.secondary, 0.2);
    secondaryColors['300'] = lighten(colors.secondary, 0.1);
    secondaryColors['400'] = colors.secondary;
    secondaryColors['500'] = colors.secondary;
    secondaryColors['600'] = darken(colors.secondary, 0.1);
    secondaryColors['700'] = darken(colors.secondary, 0.2);
    secondaryColors['800'] = darken(colors.secondary, 0.3);
    secondaryColors['900'] = darken(colors.secondary, 0.4);
  }

  if (colors.background) {
    neutralColors['50'] = lighten(colors.background, 0.4);
    neutralColors['100'] = lighten(colors.background, 0.3);
    neutralColors['200'] = lighten(colors.background, 0.2);
    neutralColors['300'] = lighten(colors.background, 0.1);
    neutralColors['400'] = colors.background;
    neutralColors['500'] = colors.background;
    neutralColors['600'] = darken(colors.background, 0.1);
    neutralColors['700'] = darken(colors.background, 0.2);
    neutralColors['800'] = darken(colors.background, 0.3);
    neutralColors['900'] = darken(colors.background, 0.4);
  }

  // Map typography style to font families
  const typographyMapping: Record<string, { heading: string; body: string }> = {
    modern: {
      heading: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    classic: {
      heading: 'Merriweather, Georgia, serif',
      body: 'Lora, Georgia, serif',
    },
    tech: {
      heading: 'JetBrains Mono, SF Mono, monospace',
      body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    humanist: {
      heading: 'Outfit, system-ui, sans-serif',
      body: 'Open Sans, system-ui, sans-serif',
    },
  };

  const selectedTypography = typographyMapping[config.typography] || typographyMapping.modern;

  // Typography tokens
  const fontSizes: Record<string, string> = {
    'xs': '0.75rem',
    'sm': '0.875rem',
    'base': '1rem',
    'lg': '1.125rem',
    'xl': '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  };

  const fontWeights: Record<string, number> = {
    'thin': 100,
    'extralight': 200,
    'light': 300,
    'normal': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'extrabold': 800,
    'black': 900,
  };

  const lineHeights: Record<string, number> = {
    'none': 1,
    'tight': 1.25,
    'snug': 1.375,
    'normal': 1.5,
    'relaxed': 1.625,
    'loose': 2,
  };

  const letterSpacing: Record<string, string> = {
    'tighter': '-0.05em',
    'tight': '-0.025em',
    'normal': '0em',
    'wide': '0.025em',
    'wider': '0.05em',
    'widest': '0.1em',
  };

  // Spacing scale
  const spacing: Record<string, string> = {
    '0': '0px',
    'px': '1px',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  };

  // Border radius
  const borderRadius: Record<string, string> = {
    'none': '0px',
    'sm': '0.125rem',
    'DEFAULT': '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    'full': '9999px',
  };

  // Shadows
  const shadows: Record<string, string> = {
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    'none': 'none',
  };

  // Breakpoints
  const breakpoints: Record<string, string> = {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
  };

  return {
    colors: {
      primary: primaryColors,
      secondary: secondaryColors,
      neutral: neutralColors,
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
    typography: {
      fontFamilies: {
        heading: selectedTypography.heading,
        body: selectedTypography.body,
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacing,
    },
    spacing,
    borderRadius,
    shadows,
    breakpoints,
  };
}

/**
 * Exports design tokens as CSS Variables
 */
export function exportToCSSVariables(
  tokens: DesignTokens,
  options: ExportOptions = {}
): string {
  const { includeComments = true, prefix = '', formatPrettify = true } = options;
  const lines: string[] = [];

  if (includeComments) {
    lines.push('/**');
    lines.push(' * Design System - CSS Variables');
    lines.push(' * Generated from Web Architect AI');
    lines.push(' */');
    lines.push('');
  }

  lines.push(':root {');

  // Colors
  if (includeComments) {
    lines.push('  /* Primary Colors */');
  }
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    lines.push(`  --${prefix}color-primary-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Secondary Colors */');
  }
  Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
    lines.push(`  --${prefix}color-secondary-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Neutral Colors */');
  }
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    lines.push(`  --${prefix}color-neutral-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Semantic Colors */');
  }
  Object.entries(tokens.colors.semantic).forEach(([key, value]) => {
    lines.push(`  --${prefix}color-${key}: ${value};`);
  });

  // Typography
  if (includeComments) {
    lines.push('');
    lines.push('  /* Font Families */');
  }
  Object.entries(tokens.typography.fontFamilies).forEach(([key, value]) => {
    lines.push(`  --${prefix}font-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Font Sizes */');
  }
  Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
    lines.push(`  --${prefix}font-size-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Font Weights */');
  }
  Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
    lines.push(`  --${prefix}font-weight-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Line Heights */');
  }
  Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
    lines.push(`  --${prefix}line-height-${key}: ${value};`);
  });

  if (includeComments) {
    lines.push('');
    lines.push('  /* Letter Spacing */');
  }
  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    lines.push(`  --${prefix}letter-spacing-${key}: ${value};`);
  });

  // Spacing
  if (includeComments) {
    lines.push('');
    lines.push('  /* Spacing */');
  }
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    lines.push(`  --${prefix}spacing-${key}: ${value};`);
  });

  // Border Radius
  if (includeComments) {
    lines.push('');
    lines.push('  /* Border Radius */');
  }
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    const radiusKey = key === 'DEFAULT' ? 'default' : key;
    lines.push(`  --${prefix}radius-${radiusKey}: ${value};`);
  });

  // Shadows
  if (includeComments) {
    lines.push('');
    lines.push('  /* Shadows */');
  }
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    const shadowKey = key === 'DEFAULT' ? 'default' : key;
    lines.push(`  --${prefix}shadow-${shadowKey}: ${value};`);
  });

  // Breakpoints
  if (includeComments) {
    lines.push('');
    lines.push('  /* Breakpoints */');
  }
  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    lines.push(`  --${prefix}breakpoint-${key}: ${value};`);
  });

  lines.push('}');

  return lines.join('\n');
}

/**
 * Exports design tokens as Tailwind Config
 */
export function exportToTailwindConfig(
  tokens: DesignTokens,
  options: ExportOptions = {}
): string {
  const { includeComments = true, formatPrettify = true } = options;
  const lines: string[] = [];

  if (includeComments) {
    lines.push('/**');
    lines.push(' * Tailwind CSS Configuration');
    lines.push(' * Generated from Web Architect AI');
    lines.push(' */');
    lines.push('');
  }

  lines.push('module.exports = {');
  lines.push('  theme: {');
  lines.push('    extend: {');

  // Colors
  lines.push('      colors: {');
  lines.push('        primary: {');
  Object.entries(tokens.colors.primary).forEach(([key, value]) => {
    lines.push(`          '${key}': '${value}',`);
  });
  lines.push('        },');
  lines.push('        secondary: {');
  Object.entries(tokens.colors.secondary).forEach(([key, value]) => {
    lines.push(`          '${key}': '${value}',`);
  });
  lines.push('        },');
  lines.push('        neutral: {');
  Object.entries(tokens.colors.neutral).forEach(([key, value]) => {
    lines.push(`          '${key}': '${value}',`);
  });
  lines.push('        },');
  Object.entries(tokens.colors.semantic).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Font Families
  lines.push('      fontFamily: {');
  Object.entries(tokens.typography.fontFamilies).forEach(([key, value]) => {
    lines.push(`        '${key}': ['${value}'],`);
  });
  lines.push('      },');

  // Font Sizes
  lines.push('      fontSize: {');
  Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Font Weights
  lines.push('      fontWeight: {');
  Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
    lines.push(`        '${key}': ${value},`);
  });
  lines.push('      },');

  // Line Heights
  lines.push('      lineHeight: {');
  Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
    lines.push(`        '${key}': ${value},`);
  });
  lines.push('      },');

  // Letter Spacing
  lines.push('      letterSpacing: {');
  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Spacing
  lines.push('      spacing: {');
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Border Radius
  lines.push('      borderRadius: {');
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Box Shadow
  lines.push('      boxShadow: {');
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  // Screens (Breakpoints)
  lines.push('      screens: {');
  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    lines.push(`        '${key}': '${value}',`);
  });
  lines.push('      },');

  lines.push('    },');
  lines.push('  },');
  lines.push('  plugins: [],');
  lines.push('};');

  return lines.join('\n');
}

/**
 * Exports design tokens as Figma Tokens JSON
 */
export function exportToFigmaTokens(
  tokens: DesignTokens,
  options: ExportOptions = {}
): string {
  const figmaTokens = {
    $metadata: {
      tokenSetOrder: ['global'],
    },
    global: {
      colors: {
        primary: Object.fromEntries(
          Object.entries(tokens.colors.primary).map(([key, value]) => [
            key,
            { value, type: 'color' },
          ])
        ),
        secondary: Object.fromEntries(
          Object.entries(tokens.colors.secondary).map(([key, value]) => [
            key,
            { value, type: 'color' },
          ])
        ),
        neutral: Object.fromEntries(
          Object.entries(tokens.colors.neutral).map(([key, value]) => [
            key,
            { value, type: 'color' },
          ])
        ),
        semantic: Object.fromEntries(
          Object.entries(tokens.colors.semantic).map(([key, value]) => [
            key,
            { value, type: 'color' },
          ])
        ),
      },
      typography: {
        fontFamilies: Object.fromEntries(
          Object.entries(tokens.typography.fontFamilies).map(([key, value]) => [
            key,
            { value, type: 'fontFamilies' },
          ])
        ),
        fontSizes: Object.fromEntries(
          Object.entries(tokens.typography.fontSizes).map(([key, value]) => [
            key,
            { value, type: 'fontSizes' },
          ])
        ),
        fontWeights: Object.fromEntries(
          Object.entries(tokens.typography.fontWeights).map(([key, value]) => [
            key,
            { value: String(value), type: 'fontWeights' },
          ])
        ),
        lineHeights: Object.fromEntries(
          Object.entries(tokens.typography.lineHeights).map(([key, value]) => [
            key,
            { value: String(value), type: 'lineHeights' },
          ])
        ),
        letterSpacing: Object.fromEntries(
          Object.entries(tokens.typography.letterSpacing).map(([key, value]) => [
            key,
            { value, type: 'letterSpacing' },
          ])
        ),
      },
      spacing: Object.fromEntries(
        Object.entries(tokens.spacing).map(([key, value]) => [
          key,
          { value, type: 'spacing' },
        ])
      ),
      borderRadius: Object.fromEntries(
        Object.entries(tokens.borderRadius).map(([key, value]) => [
          key,
          { value, type: 'borderRadius' },
        ])
      ),
      boxShadow: Object.fromEntries(
        Object.entries(tokens.shadows).map(([key, value]) => [
          key,
          { value, type: 'boxShadow' },
        ])
      ),
    },
  };

  return JSON.stringify(figmaTokens, null, 2);
}

/**
 * Color utility: Lighten a hex color
 */
function lighten(hex: string, amount: number): string {
  const color = hexToRgb(hex);
  if (!color) return hex;

  const { r, g, b } = color;
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return rgbToHex(newR, newG, newB);
}

/**
 * Color utility: Darken a hex color
 */
function darken(hex: string, amount: number): string {
  const color = hexToRgb(hex);
  if (!color) return hex;

  const { r, g, b } = color;
  const newR = Math.max(0, Math.round(r * (1 - amount)));
  const newG = Math.max(0, Math.round(g * (1 - amount)));
  const newB = Math.max(0, Math.round(b * (1 - amount)));

  return rgbToHex(newR, newG, newB);
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}
