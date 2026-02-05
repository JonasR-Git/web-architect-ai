/**
 * Multi-Language Content Generation
 *
 * Automatically detects page languages and generates
 * translated/adapted content for all discovered languages
 */

import type { SiteStructure, SiteNode, TargetSlot } from '@/types';

export interface LanguageDetection {
  code: string; // ISO 639-1 (e.g., 'en', 'de', 'fr')
  name: string; // Full name (e.g., 'English', 'German')
  pages: string[]; // URLs in this language
  percentage: number; // % of total pages
  isDefault: boolean; // Most common language
}

export interface MultiLanguageContent {
  languages: LanguageDetection[];
  translations: Record<string, Record<string, string>>; // page -> lang -> translated content
  adaptations: LanguageAdaptation[];
}

export interface LanguageAdaptation {
  targetLanguage: string;
  culturalNotes: string[];
  contentAdjustments: string[];
  seoRecommendations: string[];
}

/**
 * Language detection patterns based on common words
 */
const LANGUAGE_PATTERNS: Record<string, { name: string; patterns: RegExp[] }> = {
  en: {
    name: 'English',
    patterns: [
      /\b(the|and|is|in|to|of|for|that|with|on)\b/i,
      /\b(about|contact|services|products|home|blog)\b/i,
    ],
  },
  de: {
    name: 'German',
    patterns: [
      /\b(der|die|das|und|ist|in|zu|von|für|mit|auf)\b/i,
      /\b(über|kontakt|dienstleistungen|produkte|startseite|blog)\b/i,
      /\b(wir|sie|können|mehr|unsere|ihre)\b/i,
    ],
  },
  fr: {
    name: 'French',
    patterns: [
      /\b(le|la|les|et|est|dans|pour|avec|sur|de)\b/i,
      /\b(à propos|contact|services|produits|accueil|blog)\b/i,
      /\b(nous|vous|pouvez|plus|notre|votre)\b/i,
    ],
  },
  es: {
    name: 'Spanish',
    patterns: [
      /\b(el|la|los|las|y|es|en|de|para|con|por)\b/i,
      /\b(sobre|contacto|servicios|productos|inicio|blog)\b/i,
      /\b(nosotros|usted|puede|más|nuestro|su)\b/i,
    ],
  },
  it: {
    name: 'Italian',
    patterns: [
      /\b(il|la|i|le|e|è|in|di|per|con|su)\b/i,
      /\b(chi siamo|contatto|servizi|prodotti|home|blog)\b/i,
      /\b(noi|voi|può|più|nostro|vostro)\b/i,
    ],
  },
  pt: {
    name: 'Portuguese',
    patterns: [
      /\b(o|a|os|as|e|é|em|de|para|com|por)\b/i,
      /\b(sobre|contato|serviços|produtos|início|blog)\b/i,
      /\b(nós|você|pode|mais|nosso|seu)\b/i,
    ],
  },
  nl: {
    name: 'Dutch',
    patterns: [
      /\b(de|het|een|en|is|in|van|voor|met|op)\b/i,
      /\b(over|contact|diensten|producten|home|blog)\b/i,
      /\b(wij|u|kunt|meer|onze|uw)\b/i,
    ],
  },
  pl: {
    name: 'Polish',
    patterns: [
      /\b(i|w|na|z|do|się|jest|że|o|nie)\b/i,
      /\b(o nas|kontakt|usługi|produkty|strona główna|blog)\b/i,
    ],
  },
};

/**
 * Detects language of a page based on content
 */
export function detectPageLanguage(content: string, url: string): string {
  // Check URL path for language indicators
  const urlMatch = url.match(/\/(en|de|fr|es|it|pt|nl|pl)\//);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Score each language based on pattern matches
  const scores: Record<string, number> = {};

  Object.entries(LANGUAGE_PATTERNS).forEach(([code, { patterns }]) => {
    let score = 0;
    patterns.forEach((pattern) => {
      const matches = content.match(new RegExp(pattern, 'gi'));
      score += matches ? matches.length : 0;
    });
    scores[code] = score;
  });

  // Return language with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'en'; // Default to English

  const detectedLang = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
  return detectedLang || 'en';
}

/**
 * Detects all languages used in the site
 */
export function detectSiteLanguages(structure: SiteStructure): LanguageDetection[] {
  const languageCounts: Record<string, string[]> = {};

  // Detect language for each page
  structure.nodes.forEach((node) => {
    const content = node.content?.rawText || '';
    const lang = detectPageLanguage(content, node.url);

    if (!languageCounts[lang]) {
      languageCounts[lang] = [];
    }
    languageCounts[lang].push(node.url);
  });

  const totalPages = structure.nodes.length;

  // Create language detections
  const detections = Object.entries(languageCounts).map(([code, pages]) => ({
    code,
    name: LANGUAGE_PATTERNS[code]?.name || code.toUpperCase(),
    pages,
    percentage: (pages.length / totalPages) * 100,
    isDefault: false,
  }));

  // Sort by percentage (most common first)
  detections.sort((a, b) => b.percentage - a.percentage);

  // Mark most common as default
  if (detections.length > 0) {
    detections[0].isDefault = true;
  }

  return detections;
}

/**
 * Generates translation prompt for AI
 */
export function generateTranslationPrompt(
  content: string,
  targetLanguage: string,
  sourceLanguage: string
): string {
  const langName = LANGUAGE_PATTERNS[targetLanguage]?.name || targetLanguage;

  return `Translate and culturally adapt the following content from ${sourceLanguage} to ${langName}.

IMPORTANT GUIDELINES:
1. **Natural Translation**: Don't translate word-for-word. Adapt idioms and expressions to ${langName} equivalents.
2. **Cultural Adaptation**: Consider cultural context - adjust examples, references, and metaphors.
3. **SEO Optimization**: Use keywords that ${langName} speakers would actually search for.
4. **Tone Preservation**: Maintain the same tone and formality level as the original.
5. **Technical Terms**: Keep industry-specific terms if they're commonly used in ${langName}.
6. **Call-to-Actions**: Translate CTAs to be compelling in the target culture.
7. **Formatting**: Preserve markdown formatting, links, and structure.

Original Content:
\`\`\`
${content}
\`\`\`

Please provide:
1. The translated content
2. A brief note on any significant cultural adaptations made

Translation:`;
}

/**
 * Generates cultural adaptation notes for a language
 */
export function generateCulturalNotes(targetLanguage: string): string[] {
  const notes: Record<string, string[]> = {
    de: [
      'Use formal "Sie" for business contexts, informal "du" for casual brands',
      'Germans value precision and detailed information - avoid overly promotional language',
      'Privacy (Datenschutz) is crucial - emphasize GDPR compliance',
      'Prefer factual, data-driven content over emotional appeals',
    ],
    fr: [
      'Use "vous" for formal contexts - French business culture is more formal',
      'French readers appreciate elegant, well-crafted language',
      'Cultural references should be France-specific (not US-centric)',
      'Avoid overly direct sales language - prefer subtle persuasion',
    ],
    es: [
      'Consider regional variations (Spain vs Latin America)',
      'Spanish business culture values personal relationships',
      'Use warm, personable tone rather than overly formal',
      'Visual content is highly valued in Spanish-speaking markets',
    ],
    it: [
      'Italian business culture values style and aesthetics',
      'Use "Lei" for formal contexts, "tu" for casual brands',
      'Italians appreciate passionate, expressive language',
      'Family and tradition themes resonate well',
    ],
    pt: [
      'Distinguish between Brazilian Portuguese and European Portuguese',
      'Brazilian market prefers friendly, approachable tone',
      'Use inclusive language and diverse representation',
      'Social proof and testimonials are highly effective',
    ],
    nl: [
      'Dutch business culture is direct and pragmatic',
      'Avoid excessive formality - use "je" more liberally',
      'Emphasize sustainability and social responsibility',
      'Dutch readers appreciate honesty and transparency',
    ],
    pl: [
      'Polish market is growing and tech-savvy',
      'Use "Pan/Pani" for formal contexts',
      'Value-for-money messaging resonates well',
      'Polish readers appreciate detailed product information',
    ],
  };

  return notes[targetLanguage] || [
    'Research local cultural norms and preferences',
    'Consider time zones and regional holidays',
    'Use local currency and measurement units',
    'Adapt visual content to local preferences',
  ];
}

/**
 * Generates SEO recommendations for a language
 */
export function generateSEORecommendations(targetLanguage: string): string[] {
  const langName = LANGUAGE_PATTERNS[targetLanguage]?.name || targetLanguage;

  return [
    `Use hreflang tags to indicate ${langName} content (hreflang="${targetLanguage}")`,
    `Research ${langName}-specific keywords - don't just translate English keywords`,
    `Localize meta descriptions and title tags for ${langName} search intent`,
    `Build backlinks from ${langName} websites and directories`,
    `Consider local search engines (e.g., Yandex for Russian, Baidu for Chinese)`,
    `Use local domain extension (e.g., .de, .fr) or subdirectory (/de/, /fr/)`,
    `Register business in Google My Business for local markets`,
    `Create content about local events, news, and topics`,
  ];
}

/**
 * Generates multi-language content structure
 */
export async function generateMultiLanguageContent(
  structure: SiteStructure,
  targetLanguages: string[]
): Promise<MultiLanguageContent> {
  const languages = detectSiteLanguages(structure);

  // Generate adaptations for each target language
  const adaptations: LanguageAdaptation[] = targetLanguages.map((lang) => ({
    targetLanguage: lang,
    culturalNotes: generateCulturalNotes(lang),
    contentAdjustments: [
      'Adapt date formats (DD/MM/YYYY vs MM/DD/YYYY)',
      'Localize currency and pricing',
      'Adjust time zones and business hours',
      'Use local phone number formats',
      'Update contact information for local markets',
    ],
    seoRecommendations: generateSEORecommendations(lang),
  }));

  // Translation mapping will be populated by AI
  const translations: Record<string, Record<string, string>> = {};

  return {
    languages,
    translations,
    adaptations,
  };
}

/**
 * Creates multi-language page specs
 */
export function createMultiLanguagePageSpecs(
  baseSpecs: TargetSlot[],
  languages: string[]
): TargetSlot[] {
  const multiLangSpecs: TargetSlot[] = [];

  // For each language, create variant specs
  languages.forEach((lang) => {
    baseSpecs.forEach((spec) => {
      const langSpec: TargetSlot = {
        ...spec,
        path: `/${lang}${spec.path}`,
        label: `${spec.label} (${LANGUAGE_PATTERNS[lang]?.name || lang})`,
        language: lang,
        hreflangs: [
          ...(spec.hreflangs || []),
          { lang, url: `/${lang}${spec.path}` },
        ],
      };
      multiLangSpecs.push(langSpec);
    });
  });

  return multiLangSpecs;
}

/**
 * Generates language switcher component code
 */
export function generateLanguageSwitcher(languages: string[]): string {
  return `
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const LANGUAGES = ${JSON.stringify(
    languages.map((code) => ({
      code,
      name: LANGUAGE_PATTERNS[code]?.name || code.toUpperCase(),
    })),
    null,
    2
  )};

export function LanguageSwitcher() {
  const pathname = usePathname();

  // Extract current language from path (e.g., /de/about -> 'de')
  const currentLang = pathname.split('/')[1];

  return (
    <div className="flex items-center gap-2">
      {LANGUAGES.map(({ code, name }) => {
        // Replace current language in path with new language
        const newPath = pathname.replace(/^\\/[a-z]{2}(\\/|$)/, \`/\${code}$1\`);
        const isActive = currentLang === code;

        return (
          <Link
            key={code}
            href={newPath}
            className={\`px-3 py-1 rounded-lg text-sm transition-all \${
              isActive
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }\`}
          >
            {name}
          </Link>
        );
      })}
    </div>
  );
}
`;
}

/**
 * Generates i18n configuration for Next.js
 */
export function generateI18nConfig(languages: string[], defaultLanguage: string): string {
  return `
// next.config.js
module.exports = {
  i18n: {
    locales: ${JSON.stringify(languages)},
    defaultLocale: '${defaultLanguage}',
    localeDetection: true,
  },
};

// Or for App Router (middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ${JSON.stringify(languages)};
const defaultLocale = '${defaultLanguage}';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(\`/\${locale}/\`) && pathname !== \`/\${locale}\`
  );

  // Redirect to default locale if missing
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(\`/\${defaultLocale}\${pathname}\`, request.url)
    );
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;
}
