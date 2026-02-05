/**
 * Design Archetypes for all 3 Levels
 *
 * Standard: Ordentlich & Strukturiert (10-15 professional archetypes)
 * Semi-Unleashed: Kreativ & Ausgewogen (10-15 creative archetypes)
 * Unleashed: Chaotisch & Einzigartig (15 ultra-extreme archetypes)
 */

import {
  Layout, Grid, Layers, Box, Sparkles, Palette,
  Zap, Wind, Droplet, Flame, Diamond, Eye,
  Skull, Circle, Square, Type
} from 'lucide-react';

export interface Archetype {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  level: 'standard' | 'semi-unleashed' | 'unleashed';
  designPrinciples: string[];
  promptInstructions: string;
}

/**
 * STANDARD ARCHETYPES (15)
 * Ordentlich, strukturiert, professionell
 */
export const STANDARD_ARCHETYPES: Archetype[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'standard',
    description: 'Clean whitespace, subtle accents, Stripe/Linear aesthetic',
    icon: Layout,
    level: 'standard',
    designPrinciples: ['Generous whitespace (120px+ sections)', 'Monochrome + 1 accent', 'Subtle shadows (0.05 opacity)', 'Sans-serif only', 'Simple shapes'],
    promptInstructions: `## 🎯 MODERN MINIMAL - The Stripe/Linear Doctrine
**DIRECTIVE**: You are building the **most restrained interface possible** while remaining functional.
**AESTHETIC**: Think Stripe, Linear, or Apple's minimalism. Every pixel is intentional.

### 1. 🌬️ GENEROUS WHITESPACE (120px+ sections)
Space is your primary design element:

\`\`\`css
section {
    padding: 120px 80px; /* Massive breathing room */
    margin-bottom: 160px; /* Generous section gaps */
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 80px; /* Wide margins */
}

h1 {
    font-size: 72px;
    line-height: 1.1;
    margin-bottom: 48px; /* 48px gaps everywhere */
    letter-spacing: -0.02em; /* Tight tracking */
}
\`\`\`

### 2. 🎨 MONOCHROME + 1 ACCENT
90% neutral grays, 10% single accent color:

\`\`\`css
:root {
    --neutral-50: #fafafa;
    --neutral-900: #0a0a0a;
    --accent: #3b82f6; /* ONE accent color only */
}

/* Almost everything is neutral */
body { background: var(--neutral-50); color: var(--neutral-900); }
.card { background: white; border: 1px solid #e5e5e5; }

/* Accent used SPARINGLY (buttons, links only) */
button { background: var(--accent); }
a { color: var(--accent); }
\`\`\`

### 3. ✨ ULTRA-SUBTLE SHADOWS
Shadows so subtle they're barely visible:

\`\`\`css
.card {
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Barely visible */
    border-radius: 12px;
}

.card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Still subtle on hover */
}

/* NO heavy shadows - keep it light and airy */
\`\`\`

**CRITICAL**: Sans-serif only (Inter, SF Pro, System UI). No decorative fonts. Maintain 4.5:1 contrast minimum.`,
  },
  {
    id: 'corporate-professional',
    name: 'Corporate Professional',
    category: 'standard',
    description: 'Trust-building, enterprise-ready, structured grids',
    icon: Grid,
    level: 'standard',
    designPrinciples: ['Structured 12-column grid', 'Blues/grays palette', 'Clear hierarchy', 'Conventional nav', 'Professional imagery'],
    promptInstructions: `## 💼 CORPORATE PROFESSIONAL - The Enterprise Standard
**DIRECTIVE**: Build a design that screams **trust, stability, and professionalism**.
**AESTHETIC**: IBM, McKinsey, major banks. Conservative, structured, no risks taken.

### 1. 📐 STRUCTURED 12-COLUMN GRID
Rigid, mathematical grid system:

\`\`\`css
.container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    max-width: 1440px;
    margin: 0 auto;
}

/* Everything aligns to grid */
.hero { grid-column: 1 / 13; }
.sidebar { grid-column: 1 / 4; }
.main-content { grid-column: 4 / 13; }

/* NO breaking the grid - everything is structured */
\`\`\`

### 2. 🔵 CONSERVATIVE COLOR PALETTE
Blues, grays, and nothing else:

\`\`\`css
:root {
    --primary-blue: #1e40af; /* Trust blue */
    --secondary-blue: #3b82f6;
    --neutral-100: #f3f4f6;
    --neutral-700: #374151;
    --neutral-900: #111827;
}

body { background: white; color: var(--neutral-900); }
.header { background: var(--primary-blue); color: white; }
.section { background: var(--neutral-100); }
button.primary { background: var(--primary-blue); }

/* NO bright colors, NO gradients, NO creativity */
\`\`\`

### 3. 📊 CLEAR VISUAL HIERARCHY
Three-level hierarchy (H1 > H2 > H3):

\`\`\`css
h1 {
    font-size: 48px;
    font-weight: 700;
    color: var(--neutral-900);
    margin-bottom: 24px;
}

h2 {
    font-size: 32px;
    font-weight: 600;
    color: var(--neutral-700);
    margin-bottom: 16px;
}

h3 {
    font-size: 24px;
    font-weight: 600;
    color: var(--neutral-700);
}

p {
    font-size: 16px;
    line-height: 1.6;
    color: var(--neutral-700);
}
\`\`\`

### 4. 🧭 CONVENTIONAL NAVIGATION
Standard horizontal nav bar, no surprises:

\`\`\`css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 48px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
}

.nav-links {
    display: flex;
    gap: 32px;
}

.nav-link {
    font-size: 16px;
    font-weight: 500;
    color: var(--neutral-700);
    text-decoration: none;
}
\`\`\`

**CRITICAL**: Professional imagery only (stock photos of offices, handshakes, diverse teams). Maintain accessibility (WCAG AA minimum).`,
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    category: 'standard',
    description: 'Luxury typography, sophisticated, high-end editorial',
    icon: Type,
    level: 'standard',
    designPrinciples: ['Serif headings', 'Gold/black/cream palette', 'Generous negative space', 'Refined details', 'Editorial layouts'],
    promptInstructions: `## 👑 ELEGANT SERIF - The Luxury Editorial
**DIRECTIVE**: You are designing for **high-end luxury brands**. Think Vogue, Rolex, or premium fashion.
**AESTHETIC**: Refined, sophisticated, timeless elegance. Serif typography dominates.

### 1. 📖 SERIF TYPOGRAPHY HIERARCHY
Elegant serifs for all headings:

\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');

h1, h2, h3 {
    font-family: 'Playfair Display', 'Georgia', serif;
}

h1 {
    font-size: 96px;
    font-weight: 400; /* Light weight for elegance */
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 48px;
}

h2 {
    font-size: 64px;
    font-weight: 400;
    line-height: 1.2;
}

/* Body text can be sans-serif or light serif */
p {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    line-height: 1.8; /* Generous line height */
    font-weight: 300; /* Light weight */
}
\`\`\`

### 2. ✨ GOLD/BLACK/CREAM PALETTE
Luxury color scheme:

\`\`\`css
:root {
    --gold: #d4af37; /* Rich gold accent */
    --cream: #faf8f3; /* Soft cream background */
    --black: #1a1a1a; /* Deep black text */
    --warm-gray: #8b8680;
}

body {
    background: var(--cream);
    color: var(--black);
}

.accent-line {
    width: 80px;
    height: 2px;
    background: var(--gold);
    margin: 32px 0;
}

button.luxury {
    background: var(--black);
    color: var(--cream);
    border: 1px solid var(--gold);
    padding: 16px 48px;
}
\`\`\`

### 3. 🌌 GENEROUS NEGATIVE SPACE
Space creates luxury:

\`\`\`css
section {
    padding: 160px 120px; /* Extreme padding */
    margin-bottom: 200px;
}

.editorial-layout {
    max-width: 800px; /* Narrow content column */
    margin: 0 auto;
}

h1 {
    margin-bottom: 80px; /* Huge gaps */
}

.image-wrapper {
    margin: 120px 0; /* Images float in space */
}
\`\`\`

### 4. 🎨 REFINED EDITORIAL DETAILS
Sophisticated touches:

\`\`\`css
/* Drop caps for first letter */
.editorial-text::first-letter {
    font-size: 120px;
    line-height: 0.8;
    float: left;
    margin: 12px 16px 0 0;
    font-weight: 400;
}

/* Pull quotes with gold accent */
blockquote {
    font-size: 32px;
    font-weight: 300;
    line-height: 1.5;
    border-left: 4px solid var(--gold);
    padding-left: 48px;
    margin: 80px 0;
    font-style: italic;
}

/* Subtle dividers */
hr {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold), transparent);
    margin: 80px auto;
    width: 200px;
}
\`\`\`

**CRITICAL**: Maintain elegance through restraint. Use gold sparingly as accent only. Keep contrast high (4.5:1 minimum).`,
  },
  {
    id: 'clean-cards',
    name: 'Clean Cards',
    category: 'standard',
    description: 'Card-based layouts, modern, organized, Pinterest-style',
    icon: Layers,
    level: 'standard',
    designPrinciples: ['Card grids', 'Consistent radius (12px)', 'Subtle shadows', 'Clear separation', 'Visual breathing room'],
    promptInstructions: `## 🃏 CLEAN CARDS - The Pinterest Aesthetic
**DIRECTIVE**: Build a **card-based interface** where everything lives in organized boxes.
**AESTHETIC**: Pinterest, Dribbble, Notion. Clean, organized, scannable.

### 1. 📦 CONSISTENT CARD STRUCTURE
Every element is a card with 12px border-radius:

\`\`\`css
.card {
    background: white;
    border-radius: 12px; /* EXACTLY 12px everywhere */
    padding: 32px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.2s ease;
}

.card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    transform: translateY(-2px);
}

/* Nested cards also 12px */
.card .inner-card {
    background: #f9fafb;
    border-radius: 12px;
    padding: 24px;
}
\`\`\`

### 2. 🎯 CARD GRID LAYOUTS
Masonry or uniform grids:

\`\`\`css
/* Uniform grid */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    padding: 24px;
}

/* Masonry-style (varying heights) */
.masonry-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 20px;
    gap: 24px;
}

.card-tall { grid-row: span 15; }
.card-medium { grid-row: span 10; }
.card-short { grid-row: span 8; }
\`\`\`

### 3. ✨ SUBTLE SHADOWS
Three-tier shadow system:

\`\`\`css
/* Resting state - barely visible */
.card-rest {
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* Hover state - noticeable */
.card-hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.10);
}

/* Active/Selected state - prominent */
.card-active {
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    border: 2px solid #3b82f6;
}
\`\`\`

### 4. 🔲 VISUAL SEPARATION
Clear borders and spacing between cards:

\`\`\`css
.card {
    margin-bottom: 24px; /* Breathing room */
    background: white;
    border: 1px solid #e5e7eb; /* Subtle border */
}

/* Card headers */
.card-header {
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

/* Card sections */
.card-section + .card-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f3f4f6;
}

/* Image cards have no top padding */
.card.image-card {
    padding: 0;
    overflow: hidden;
}

.card.image-card img {
    border-radius: 12px 12px 0 0; /* Rounded top only */
}

.card.image-card .content {
    padding: 24px;
}
\`\`\`

**CRITICAL**: Consistency is key. ALL border-radius = 12px. ALL gaps = 24px. ALL shadows use same opacity scale.`,
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    category: 'standard',
    description: 'SaaS aesthetic, vibrant gradients, Vercel/Framer vibes',
    icon: Sparkles,
    level: 'standard',
    designPrinciples: ['Vibrant gradients', 'Modern sans-serif', 'Asymmetric layouts', 'Bold CTAs', 'Glassmorphism'],
    promptInstructions: `## 🚀 TECH STARTUP - The SaaS Aesthetic
**DIRECTIVE**: Build a **modern startup landing page** that screams innovation and energy.
**AESTHETIC**: Vercel, Framer, Linear. Vibrant, modern, slightly futuristic.

### 1. 🌈 VIBRANT GRADIENTS
Bold, multi-stop gradients everywhere:

\`\`\`css
.hero {
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 50%,
        #f093fb 100%
    );
    padding: 120px 80px;
}

/* Gradient text */
.gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Animated gradient buttons */
.cta-button {
    background: linear-gradient(135deg, #667eea, #764ba2);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
\`\`\`

### 2. 💎 GLASSMORPHISM CARDS
Frosted glass blur effects:

\`\`\`css
.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 32px;
}

/* Works best on gradient backgrounds */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
\`\`\`

### 3. 🎨 ASYMMETRIC BENTO GRIDS
Apple-style irregular grids:

\`\`\`css
.bento-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 200px);
    gap: 24px;
    padding: 80px;
}

/* Varied sizes create visual interest */
.bento-item-1 { grid-column: 1 / 4; grid-row: 1 / 3; } /* 2x2 */
.bento-item-2 { grid-column: 4 / 7; grid-row: 1 / 2; } /* 1x3 */
.bento-item-3 { grid-column: 4 / 7; grid-row: 2 / 3; } /* 1x3 */
.bento-item-4 { grid-column: 1 / 3; grid-row: 3 / 5; } /* 2x2 */
.bento-item-5 { grid-column: 3 / 5; grid-row: 3 / 5; } /* 2x2 */
.bento-item-6 { grid-column: 5 / 7; grid-row: 3 / 5; } /* 2x2 */

.bento-item {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 40px;
}
\`\`\`

### 4. ⚡ BOLD CALL-TO-ACTIONS
Buttons that demand attention:

\`\`\`css
.cta-button {
    font-size: 18px;
    font-weight: 600;
    padding: 18px 48px;
    border-radius: 12px;
    background: white;
    color: #667eea;
    border: none;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.2s ease;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Gradient variant */
.cta-gradient {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}
\`\`\`

**CRITICAL**: Use modern sans-serif fonts (Inter, SF Pro). Ensure glass effects have fallbacks for older browsers. Maintain 4.5:1 contrast on text.`,
  },
  {
    id: 'swiss-minimalism',
    name: 'Swiss Minimalism',
    category: 'standard',
    description: 'Grid perfection, typography focus, Bauhaus influence',
    icon: Grid,
    level: 'standard',
    designPrinciples: ['Perfect grids', 'Typography hierarchy', 'Limited color (2-3)', 'Mathematical spacing', 'Rational layouts'],
    promptInstructions: `## 🇨🇭 SWISS MINIMALISM - Josef Müller-Brockmann Mode
**DIRECTIVE**: You are **Josef Müller-Brockmann**, master of Swiss International Style.
**AESTHETIC**: Rational, mathematical, grid-obsessed. Form follows function.

### 1. 📐 PERFECT MATHEMATICAL GRIDS
Everything aligns to a strict modular grid:

\`\`\`css
:root {
    --grid-unit: 8px; /* Base unit - everything is multiples of 8 */
}

.container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: calc(var(--grid-unit) * 3); /* 24px */
    max-width: 1200px;
    margin: 0 auto;
}

/* All spacing is mathematical */
section { padding: calc(var(--grid-unit) * 10) 0; } /* 80px */
h1 { margin-bottom: calc(var(--grid-unit) * 6); } /* 48px */
p { margin-bottom: calc(var(--grid-unit) * 3); } /* 24px */

/* NO arbitrary values - everything is calculated */
\`\`\`

### 2. 📝 TYPOGRAPHY HIERARCHY
Strong type with strict hierarchy:

\`\`\`css
/* Helvetica or similar grotesque sans-serif ONLY */
body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
}

h1 {
    font-size: 72px; /* 4.5 * base */
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-transform: uppercase; /* Swiss style often uses caps */
}

h2 {
    font-size: 48px; /* 3 * base */
    font-weight: 600;
    line-height: 1.2;
}

h3 {
    font-size: 32px; /* 2 * base */
    font-weight: 600;
}

/* Body text is perfectly readable */
p {
    font-size: 16px;
    line-height: 1.6; /* 8/5 ratio */
    max-width: 65ch; /* Optimal reading length */
}
\`\`\`

### 3. 🎨 LIMITED COLOR PALETTE (2-3 Colors MAX)
Extreme color restraint:

\`\`\`css
:root {
    --black: #000000;
    --white: #ffffff;
    --red: #ff0000; /* Single accent color */
}

/* Almost everything is black & white */
body { background: var(--white); color: var(--black); }

/* Red used ONLY for emphasis */
.highlight { color: var(--red); }
button { background: var(--red); color: var(--white); }

/* NO gradients, NO additional colors */
\`\`\`

### 4. 🔲 RATIONAL LAYOUTS
Asymmetric balance with mathematical precision:

\`\`\`css
.swiss-layout {
    display: grid;
    grid-template-columns: 2fr 3fr; /* Golden ratio approximation */
    gap: calc(var(--grid-unit) * 6);
}

/* Content blocks align to grid */
.text-block {
    grid-column: 2;
    padding: calc(var(--grid-unit) * 4);
}

/* Images flush left */
.image-block {
    grid-column: 1;
}

/* Vertical rhythm maintained */
.section + .section {
    margin-top: calc(var(--grid-unit) * 12); /* 96px */
}
\`\`\`

**CRITICAL**: NO decorative elements. NO ornament. Pure function. Everything serves communication. Maintain perfect alignment.`,
  },
  {
    id: 'soft-gradients',
    name: 'Soft Gradients',
    category: 'standard',
    description: 'Pastel blends, gentle transitions, calming aesthetics',
    icon: Palette,
    level: 'standard',
    designPrinciples: ['Soft gradients', 'Pastel palette', 'Rounded corners', 'Gentle shadows', 'Soothing colors'],
    promptInstructions: `## 🌸 SOFT GRADIENTS - The Calm Aesthetic
**DIRECTIVE**: Build the **most calming, soothing interface possible**. Think meditation apps.
**AESTHETIC**: Pastel dreams, gentle transitions, visual ASMR.

### 1. 🎨 PASTEL GRADIENT PALETTE
Soft, low-saturation gradients:

\`\`\`css
:root {
    --pastel-pink: #ffd6e8;
    --pastel-blue: #c8e6f5;
    --pastel-purple: #e4d4f4;
    --pastel-yellow: #fff4cc;
}

body {
    background: linear-gradient(
        135deg,
        var(--pastel-pink) 0%,
        var(--pastel-blue) 50%,
        var(--pastel-purple) 100%
    );
    min-height: 100vh;
}

.card {
    background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0.8),
        rgba(255, 255, 255, 0.4)
    );
    backdrop-filter: blur(10px);
}
\`\`\`

### 2. 🔄 GENTLE COLOR TRANSITIONS
Smooth, slow animations:

\`\`\`css
/* Slow gradient animation */
.hero {
    background: linear-gradient(
        -45deg,
        #ffd6e8, #c8e6f5, #e4d4f4, #fff4cc
    );
    background-size: 400% 400%;
    animation: gentleGradient 15s ease infinite;
}

@keyframes gentleGradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Soft hover transitions */
.button {
    background: var(--pastel-purple);
    transition: all 0.6s ease; /* Slow, gentle */
}

.button:hover {
    background: var(--pastel-pink);
    transform: scale(1.02); /* Subtle scale */
}
\`\`\`

### 3. ⭕ ROUNDED CORNERS EVERYWHERE
Extreme roundness (16px+):

\`\`\`css
/* ALL elements are rounded */
.card { border-radius: 24px; }
button { border-radius: 20px; }
input { border-radius: 16px; }
.avatar { border-radius: 50%; }

/* Even sections can be rounded */
.section {
    border-radius: 32px;
    padding: 60px;
    margin: 40px;
}
\`\`\`

### 4. ✨ GENTLE SHADOWS
Soft, diffused shadows:

\`\`\`css
.card {
    box-shadow:
        0 4px 24px rgba(200, 230, 245, 0.3),
        0 8px 48px rgba(228, 212, 244, 0.2);
}

.button {
    box-shadow: 0 4px 16px rgba(255, 214, 232, 0.4);
}

.button:hover {
    box-shadow: 0 8px 32px rgba(255, 214, 232, 0.5);
}

/* Shadows use pastel colors, not black */
\`\`\`

**CRITICAL**: Everything should feel soft and calming. NO sharp edges. NO harsh contrasts. Use opacity liberally for dreamy effect.`,
  },
  {
    id: 'editorial-magazine',
    name: 'Editorial Magazine',
    category: 'standard',
    description: 'Magazine layouts, strong typography, visual storytelling',
    icon: Type,
    level: 'standard',
    designPrinciples: ['Magazine layouts', 'Large headlines', 'Image-text balance', 'Pull quotes', 'Editorial grids'],
    promptInstructions: `## 📰 EDITORIAL MAGAZINE - Vogue/Bloomberg Layout
**DIRECTIVE**: You are an **art director at Vogue or Bloomberg**. Every screen is a magazine spread.
**AESTHETIC**: Visual storytelling through layout, image-text balance, sophisticated grids.

### 1. 📰 MAGAZINE GRID LAYOUTS
Multi-column editorial grids:

\`\`\`css
.editorial-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr); /* 8-column magazine grid */
    gap: 32px;
    padding: 80px 60px;
}

/* Hero image spans full width */
.feature-image {
    grid-column: 1 / 9;
    height: 70vh;
    object-fit: cover;
}

/* Text in columns (magazine style) */
.article-text {
    grid-column: 2 / 6;
    column-count: 2;
    column-gap: 48px;
    font-size: 18px;
    line-height: 1.8;
}

/* Sidebar content */
.sidebar {
    grid-column: 6 / 8;
    font-size: 14px;
}
\`\`\`

### 2. 📏 LARGE EXPRESSIVE HEADLINES
Magazine-style typography:

\`\`\`css
.headline {
    font-size: 120px;
    font-weight: 700;
    line-height: 0.9; /* Tight leading */
    letter-spacing: -0.04em; /* Tight tracking */
    margin-bottom: 24px;
}

.subheadline {
    font-size: 36px;
    font-weight: 300; /* Light weight contrast */
    line-height: 1.3;
    margin-bottom: 48px;
}

/* Drop cap for article starts */
.article-body::first-letter {
    font-size: 96px;
    line-height: 1;
    float: left;
    margin: 8px 12px 0 0;
    font-weight: 700;
}
\`\`\`

### 3. 💬 PULL QUOTES
Featured quotes as design elements:

\`\`\`css
.pull-quote {
    font-size: 48px;
    font-weight: 600;
    line-height: 1.3;
    font-style: italic;
    margin: 80px 0;
    padding: 40px 60px;
    border-left: 6px solid #000;
    position: relative;
}

.pull-quote::before {
    content: '"';
    font-size: 120px;
    position: absolute;
    top: -20px;
    left: 20px;
    opacity: 0.1;
    font-family: Georgia, serif;
}

/* Alternative centered style */
.pull-quote-center {
    text-align: center;
    font-size: 56px;
    max-width: 800px;
    margin: 100px auto;
    border: none;
}
\`\`\`

### 4. 🖼️ IMAGE-TEXT BALANCE
Sophisticated image integration:

\`\`\`css
/* Text wraps around images */
.inline-image {
    float: left;
    width: 40%;
    margin: 0 48px 32px 0;
}

/* Full-bleed images */
.full-bleed {
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    height: 100vh;
    object-fit: cover;
}

/* Image captions */
.caption {
    font-size: 14px;
    font-style: italic;
    color: #666;
    margin-top: 12px;
    padding-left: 16px;
    border-left: 2px solid #ddd;
}
\`\`\`

**CRITICAL**: Maintain visual rhythm through consistent spacing. Use high-quality images. Typography should be razor-sharp and readable.`,
  },
  {
    id: 'friendly-rounded',
    name: 'Friendly Rounded',
    category: 'standard',
    description: 'Approachable, rounded shapes, warm colors',
    icon: Circle,
    level: 'standard',
    designPrinciples: ['Rounded everything (16px+)', 'Warm colors', 'Friendly tone', 'Soft shadows', 'Playful but professional'],
    promptInstructions: `## 😊 FRIENDLY ROUNDED - The Approachable Interface
**DIRECTIVE**: Build the **most welcoming, friendly interface possible**. Think Duolingo, Headspace.
**AESTHETIC**: Rounded, warm, inviting. Like a friendly hug.

### 1. ⭕ ROUNDED EVERYTHING (16px+ minimum)
NO sharp corners allowed:

\`\`\`css
/* Global rounding */
* {
    border-radius: 16px !important; /* Force rounding on everything */
}

button { border-radius: 24px; padding: 16px 32px; }
.card { border-radius: 20px; }
input, textarea { border-radius: 16px; }
.avatar { border-radius: 50%; } /* Fully circular */
img { border-radius: 20px; }

/* Even sections are rounded */
.section {
    border-radius: 32px;
    padding: 60px;
    margin: 40px 20px;
}
\`\`\`

### 2. 🌤️ WARM COLOR PALETTE
Friendly, inviting colors:

\`\`\`css
:root {
    --warm-orange: #ff9e5c;
    --soft-yellow: #ffd966;
    --friendly-coral: #ff8b94;
    --warm-cream: #fff8f0;
    --soft-teal: #6fcfb4;
}

body {
    background: var(--warm-cream);
    color: #4a4a4a;
}

button.primary {
    background: var(--warm-orange);
    color: white;
}

.highlight {
    background: var(--soft-yellow);
    padding: 4px 12px;
    border-radius: 12px;
}
\`\`\`

### 3. ☁️ SOFT SHADOWS
Gentle, approachable shadows:

\`\`\`css
.card {
    box-shadow:
        0 4px 16px rgba(255, 158, 92, 0.15),
        0 8px 32px rgba(255, 158, 92, 0.1);
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow:
        0 6px 24px rgba(255, 158, 92, 0.2),
        0 12px 48px rgba(255, 158, 92, 0.15);
    transform: translateY(-4px);
}

/* Button shadows use warm colors */
button {
    box-shadow: 0 4px 12px rgba(255, 158, 92, 0.3);
}

button:active {
    box-shadow: 0 2px 6px rgba(255, 158, 92, 0.4);
    transform: translateY(2px);
}
\`\`\`

### 4. 💬 FRIENDLY TONE
Approachable UI elements:

\`\`\`css
/* Rounded icons with backgrounds */
.icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--warm-orange), var(--friendly-coral));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(255, 139, 148, 0.3);
}

/* Pill-shaped badges */
.badge {
    background: var(--soft-teal);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
}

/* Progress bars with rounded ends */
.progress-bar {
    height: 12px;
    background: #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--warm-orange), var(--friendly-coral));
    border-radius: 12px;
    transition: width 0.6s ease;
}
\`\`\`

**CRITICAL**: Maintain warmth and approachability. Use micro-interactions (gentle bounces, smooth transitions). Keep contrast sufficient (4.5:1).`,
  },
  {
    id: 'bold-typography',
    name: 'Bold Typography',
    category: 'standard',
    description: 'Type-driven, massive headlines, kinetic letters',
    icon: Type,
    level: 'standard',
    designPrinciples: ['Massive type (80px+)', 'Type as layout', 'Bold weights (700-900)', 'Minimal graphics', 'Typography hierarchy'],
    promptInstructions: `## 🔤 BOLD TYPOGRAPHY - Type is the Hero
**DIRECTIVE**: **Typography IS the design**. Text dominates 80% of visual space.
**AESTHETIC**: Kinetic energy through letterforms. Think Typewolf showcases.

### 1. 📏 MASSIVE TYPE SCALES (80-120px+)
Headlines that dominate the viewport:

\`\`\`css
h1 {
    font-size: clamp(80px, 15vw, 180px); /* Responsive massive type */
    font-weight: 900; /* Extra bold */
    line-height: 0.9; /* Tight leading */
    letter-spacing: -0.04em; /* Tight tracking */
    margin-bottom: 40px;
}

h2 {
    font-size: clamp(60px, 10vw, 120px);
    font-weight: 800;
    line-height: 1;
}

/* Body text is still readable */
p {
    font-size: 18px;
    line-height: 1.6;
    max-width: 60ch;
}
\`\`\`

### 2. 🎨 TYPE AS LAYOUT ELEMENT
Use text to create visual structure:

\`\`\`css
/* Vertical text as design element */
.vertical-label {
    writing-mode: vertical-rl;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.1em;
    position: absolute;
    left: 40px;
    top: 40px;
}

/* Overlapping headline layers */
.hero-stack h1 {
    position: relative;
}

.hero-stack h1::after {
    content: attr(data-text);
    position: absolute;
    top: 8px;
    left: 8px;
    opacity: 0.1;
    font-size: 1.1em;
    z-index: -1;
}

/* Outline text */
.outline-text {
    font-size: 200px;
    font-weight: 900;
    -webkit-text-stroke: 3px #000;
    -webkit-text-fill-color: transparent;
    line-height: 1;
}
\`\`\`

### 3. 💪 BOLD WEIGHTS (700-900)
Heavy typography throughout:

\`\`\`css
/* Use heavy weight fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');

body {
    font-family: 'Inter', sans-serif;
    font-weight: 700; /* Even body text is bold */
}

h1, h2, h3 { font-weight: 900; }
button { font-weight: 800; }
.caption { font-weight: 700; }

/* Only fine print is regular weight */
.legal { font-weight: 400; font-size: 12px; }
\`\`\`

### 4. 🚫 MINIMAL GRAPHICS
Let type do all the work:

\`\`\`css
/* Text-based "graphics" */
.number-feature {
    font-size: 240px;
    font-weight: 900;
    line-height: 1;
    color: #000;
    opacity: 0.08;
    position: absolute;
    z-index: -1;
}

/* Typographic dividers */
.divider::before {
    content: '///';
    font-size: 48px;
    font-weight: 900;
    display: block;
    margin: 80px 0;
}

/* NO images - use letters as visuals */
.icon-replacement {
    font-size: 120px;
    font-weight: 900;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    color: #fff;
}
\`\`\`

**CRITICAL**: Font-loading is crucial. Use font-display: swap. Ensure massive type is responsive (use clamp). Maintain hierarchy despite large sizes.`,
  },
  {
    id: 'geometric-precision',
    name: 'Geometric Precision',
    category: 'standard',
    description: 'Perfect shapes, mathematical layouts, technical accuracy',
    icon: Box,
    level: 'standard',
    designPrinciples: ['Perfect geometry', 'Mathematical ratios', 'Technical precision', 'Sharp edges', 'Calculated spacing'],
    promptInstructions: `## 📐 GEOMETRIC PRECISION - The Mathematical Designer
**DIRECTIVE**: Every element is a **perfect geometric shape**. Mathematics, not intuition.
**AESTHETIC**: Bauhaus meets technical drawing. Circles, squares, triangles only.

### 1. ⚪ PERFECT GEOMETRIC SHAPES
Only pure geometric forms:

\`\`\`css
/* Perfect circles */
.circle {
    width: 200px;
    height: 200px;
    border-radius: 50%; /* Perfect circle */
    background: #000;
}

/* Perfect squares */
.square {
    width: 200px;
    height: 200px; /* Equal width/height */
    border-radius: 0; /* Sharp corners */
}

/* Perfect triangles (CSS trick) */
.triangle {
    width: 0;
    height: 0;
    border-left: 100px solid transparent;
    border-right: 100px solid transparent;
    border-bottom: 173px solid #000; /* 173 ≈ 100 * √3 for equilateral */
}

/* Hexagons */
.hexagon {
    width: 200px;
    height: 115px; /* 200 / √3 */
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
\`\`\`

### 2. 📏 GOLDEN RATIO (1:1.618)
Use Fibonacci and golden ratio for all proportions:

\`\`\`css
:root {
    --phi: 1.618; /* Golden ratio */
    --base: 100px;
}

.golden-section {
    width: calc(var(--base) * var(--phi)); /* 161.8px */
    height: var(--base); /* 100px */
}

/* Fibonacci spacing */
.margin-8 { margin: 8px; }
.margin-13 { margin: 13px; }
.margin-21 { margin: 21px; }
.margin-34 { margin: 34px; }
.margin-55 { margin: 55px; }
.margin-89 { margin: 89px; }

/* Grid based on golden ratio */
.golden-grid {
    display: grid;
    grid-template-columns: 1fr 1.618fr; /* Golden ratio columns */
    gap: 21px; /* Fibonacci number */
}
\`\`\`

### 3. ⬛ SHARP EDGES ONLY
NO rounded corners - pure geometry:

\`\`\`css
* {
    border-radius: 0 !important; /* Force sharp edges */
}

.card {
    border: 2px solid #000;
    padding: 34px; /* Fibonacci */
    background: #fff;
}

/* Geometric patterns */
.grid-pattern {
    background:
        linear-gradient(0deg, #000 1px, transparent 1px),
        linear-gradient(90deg, #000 1px, transparent 1px);
    background-size: 21px 21px; /* Fibonacci grid */
}
\`\`\`

### 4. 🔢 CALCULATED SPACING
Every measurement is mathematical:

\`\`\`css
/* Modular scale based on 16px base */
.scale-1 { font-size: 16px; }
.scale-2 { font-size: 24px; } /* 16 * 1.5 */
.scale-3 { font-size: 36px; } /* 24 * 1.5 */
.scale-4 { font-size: 54px; } /* 36 * 1.5 */
.scale-5 { font-size: 81px; } /* 54 * 1.5 */

/* All spacing is multiples of 8 */
.spacing-1 { margin: 8px; }
.spacing-2 { margin: 16px; }
.spacing-3 { margin: 24px; }
.spacing-4 { margin: 32px; }
.spacing-5 { margin: 40px; }
.spacing-8 { margin: 64px; }

/* Geometric layouts */
.three-column {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* Equal thirds */
    gap: 24px;
}
\`\`\`

**CRITICAL**: Use CSS Grid for precise alignment. Everything must be pixel-perfect. NO arbitrary values allowed.`,
  },
  {
    id: 'monochrome-contrast',
    name: 'Monochrome Contrast',
    category: 'standard',
    description: 'Black & white only, high contrast, timeless',
    icon: Square,
    level: 'standard',
    designPrinciples: ['Black & white only', 'High contrast (7:1+)', 'No grays', 'Bold statements', 'Timeless aesthetic'],
    promptInstructions: `## ⚫⚪ MONOCHROME CONTRAST - Pure Black & White
**DIRECTIVE**: Only **#000000 and #FFFFFF** are allowed. NO grays. NO other colors.
**AESTHETIC**: Stark, timeless, brutally simple. Maximum contrast.

### 1. 🎨 BLACK & WHITE ONLY
Literally NO other colors:

\`\`\`css
:root {
    --black: #000000;
    --white: #ffffff;
    /* That's it. No grays. No colors. */
}

body {
    background: var(--white);
    color: var(--black);
}

/* Backgrounds are either pure black or pure white */
.dark-section {
    background: var(--black);
    color: var(--white);
}

.light-section {
    background: var(--white);
    color: var(--black);
}

/* NO grays - use patterns instead */
.subtle-area {
    background: var(--white);
    background-image:
        linear-gradient(45deg, var(--black) 25%, transparent 25%),
        linear-gradient(-45deg, var(--black) 25%, transparent 25%);
    background-size: 4px 4px;
    background-position: 0 0, 2px 2px;
}
\`\`\`

### 2. ⚡ HIGH CONTRAST (7:1+)
Maximum possible contrast:

\`\`\`css
/* Black text on white = 21:1 contrast (perfect) */
.text-light {
    background: var(--white);
    color: var(--black);
}

/* White text on black = 21:1 contrast */
.text-dark {
    background: var(--black);
    color: var(--white);
}

/* Borders are pure black */
.card {
    background: var(--white);
    border: 3px solid var(--black);
    padding: 40px;
}

/* Shadows use pure black (NO opacity) */
.hard-shadow {
    box-shadow: 8px 8px 0 var(--black);
}
\`\`\`

### 3. 🔲 BOLD GRAPHIC ELEMENTS
Use pure black shapes as design elements:

\`\`\`css
/* Large geometric shapes */
.hero::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: var(--black);
    border-radius: 50%;
    top: -200px;
    right: -200px;
    z-index: -1;
}

/* Stripe patterns */
.striped {
    background: repeating-linear-gradient(
        45deg,
        var(--black),
        var(--black) 10px,
        var(--white) 10px,
        var(--white) 20px
    );
}

/* Checkerboard */
.checkerboard {
    background:
        linear-gradient(45deg, var(--black) 25%, transparent 25%),
        linear-gradient(-45deg, var(--black) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, var(--black) 75%),
        linear-gradient(-45deg, transparent 75%, var(--black) 75%);
    background-size: 40px 40px;
    background-position: 0 0, 0 20px, 20px -20px, -20px 0px;
}
\`\`\`

### 4. 📏 TIMELESS AESTHETIC
No trends - just pure contrast:

\`\`\`css
/* Typography is bold and clear */
h1 {
    font-size: 96px;
    font-weight: 900;
    color: var(--black);
    line-height: 1;
    text-transform: uppercase;
}

/* Buttons are stark */
.button {
    background: var(--black);
    color: var(--white);
    padding: 20px 40px;
    border: none;
    font-weight: 700;
    cursor: pointer;
}

.button:hover {
    background: var(--white);
    color: var(--black);
    border: 3px solid var(--black);
}

/* Inverted sections */
.inverted {
    background: var(--black);
    color: var(--white);
    padding: 120px 80px;
}
\`\`\`

**CRITICAL**: NO opacity, NO gradients, NO grays. Only pure #000 and #FFF. Use patterns/shapes for visual interest instead of color.`,
  },
  {
    id: 'glass-morphism',
    name: 'Glassmorphism',
    category: 'standard',
    description: 'Frosted glass, blur effects, depth layers',
    icon: Layers,
    level: 'standard',
    designPrinciples: ['Backdrop blur', 'Frosted glass cards', 'Layered depth', 'Subtle transparency', 'Light backgrounds'],
    promptInstructions: `## 💎 GLASSMORPHISM - The Frosted Glass Aesthetic
**DIRECTIVE**: Build interfaces that look like **frosted glass panels** floating in space.
**AESTHETIC**: iOS 11+, Windows 11, Apple Vision Pro. Depth through blur and transparency.

### 1. 🪟 BACKDROP-FILTER BLUR
Frosted glass effect on all cards:

\`\`\`css
.glass-card {
    background: rgba(255, 255, 255, 0.15); /* Semi-transparent white */
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 32px;
}

/* Stronger glass effect */
.glass-strong {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
}

/* Dark glass variant */
.glass-dark {
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px) saturate(180%);
    -webkit-backdrop-filter: blur(10px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
\`\`\`

### 2. 📚 LAYERED DEPTH
Stack glass panels to create depth:

\`\`\`css
/* Layer 1 (back) */
.glass-layer-1 {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    transform: translateZ(-10px);
    opacity: 0.8;
}

/* Layer 2 (middle) */
.glass-layer-2 {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    transform: translateZ(0);
    margin-top: -100px; /* Overlap */
}

/* Layer 3 (front) */
.glass-layer-3 {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    transform: translateZ(10px);
    margin-top: -100px; /* Overlap */
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
\`\`\`

### 3. ☀️ LIGHT BACKGROUNDS (REQUIRED)
Glass only works on colorful/light backgrounds:

\`\`\`css
body {
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 50%,
        #f093fb 100%
    );
    min-height: 100vh;
}

/* Alternative gradient backgrounds */
.bg-sunset {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.bg-ocean {
    background: linear-gradient(135deg, #667eea 0%, #00f2fe 100%);
}

.bg-forest {
    background: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
}
\`\`\`

### 4. ✨ SUBTLE TRANSPARENCY BORDERS
Light borders enhance glass effect:

\`\`\`css
.glass-card {
    /* Multi-layer border effect */
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
}

.glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.1)
    );
    -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
}

/* Subtle shadows */
.glass-card {
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
\`\`\`

**CRITICAL**: backdrop-filter requires vibrant background to show blur. Provide fallback for older browsers. Works best with gradient backgrounds.`,
  },
  {
    id: 'nature-organic',
    name: 'Nature Organic',
    category: 'standard',
    description: 'Earth tones, organic shapes, natural photography',
    icon: Droplet,
    level: 'standard',
    designPrinciples: ['Earth tone palette', 'Organic shapes', 'Nature photography', 'Soft textures', 'Sustainable aesthetic'],
    promptInstructions: `## 🌿 NATURE ORGANIC - Earth-Inspired Design
**DIRECTIVE**: Build an interface that feels like **walking through a forest**. Natural, grounded, sustainable.
**AESTHETIC**: Patagonia, Whole Foods, eco-conscious brands. Earthy and organic.

### 1. 🍂 EARTH TONE PALETTE
Greens, browns, natural colors only:

\`\`\`css
:root {
    --forest-green: #2d5016;
    --sage: #87a96b;
    --clay: #a0522d;
    --sand: #e8dcc4;
    --stone: #8b8680;
    --bark: #3e2723;
    --moss: #606c38;
}

body {
    background: var(--sand);
    color: var(--bark);
}

.section-earth {
    background: linear-gradient(
        to bottom,
        var(--sage),
        var(--forest-green)
    );
    color: var(--sand);
}

/* NO bright artificial colors */
button {
    background: var(--moss);
    color: var(--sand);
}
\`\`\`

### 2. 🌊 ORGANIC SHAPES
Asymmetric, flowing, natural forms:

\`\`\`css
/* Blob-like organic shapes */
.organic-card {
    border-radius: 63% 37% 54% 46% / 45% 62% 38% 55%;
    background: var(--sage);
    padding: 40px;
}

/* Irregular borders */
.leaf-shape {
    clip-path: polygon(
        50% 0%,
        80% 10%,
        100% 35%,
        100% 70%,
        80% 90%,
        50% 100%,
        20% 90%,
        0% 70%,
        0% 35%,
        20% 10%
    );
}

/* Flowing section dividers */
.wave-divider {
    height: 100px;
    background: var(--sage);
    clip-path: polygon(
        0 0,
        100% 0,
        100% 70%,
        90% 80%,
        80% 75%,
        70% 85%,
        60% 80%,
        50% 90%,
        40% 80%,
        30% 85%,
        20% 75%,
        10% 80%,
        0 70%
    );
}
\`\`\`

### 3. 📸 NATURE PHOTOGRAPHY
High-quality nature images:

\`\`\`css
.hero-nature {
    height: 70vh;
    background-image: url('/forest-landscape.jpg');
    background-size: cover;
    background-position: center;
    position: relative;
}

/* Overlay for text readability */
.hero-nature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom,
        rgba(45, 80, 22, 0.3),
        rgba(45, 80, 22, 0.7)
    );
}

/* Image cards with nature textures */
.texture-card {
    background-image: url('/wood-texture.jpg');
    background-blend-mode: multiply;
    background-color: var(--sage);
}
\`\`\`

### 4. 🪵 SOFT NATURAL TEXTURES
Subtle texture overlays:

\`\`\`css
/* Paper texture */
body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url('data:image/svg+xml;base64,... /* noise pattern */');
    opacity: 0.05;
    pointer-events: none;
}

/* Grain texture on cards */
.card-nature {
    background: var(--sand);
    position: relative;
}

.card-nature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/paper-grain.png');
    opacity: 0.1;
    mix-blend-mode: multiply;
    pointer-events: none;
}

/* Organic shadows (soft and diffused) */
.card {
    box-shadow:
        0 4px 16px rgba(45, 80, 22, 0.15),
        0 8px 32px rgba(45, 80, 22, 0.1);
}
\`\`\`

**CRITICAL**: Use sustainable, eco-friendly messaging. Images should be high-quality nature photography. Maintain warmth and approachability.`,
  },
  {
    id: 'grid-bento',
    name: 'Bento Grid',
    category: 'standard',
    description: 'Asymmetric grids, varied cell sizes, Apple-style',
    icon: Grid,
    level: 'standard',
    designPrinciples: ['Bento box layout', 'Asymmetric grids', 'Varied cell sizes', 'Contained cards', 'Visual rhythm'],
    promptInstructions: `## 🍱 BENTO GRID - Apple-Style Asymmetric Layouts
**DIRECTIVE**: Build **Bento Box layouts** with varied, asymmetric grid cells.
**AESTHETIC**: Apple.com, iOS 14 widgets. Rhythmic, contained, visually interesting.

### 1. 📦 ASYMMETRIC GRID STRUCTURE
Varied cell sizes create visual rhythm:

\`\`\`css
.bento-container {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 200px);
    gap: 20px;
    padding: 40px;
}

/* Varied cell sizes */
.bento-large {
    grid-column: span 3;
    grid-row: span 2;
} /* 3x2 cell */

.bento-tall {
    grid-column: span 2;
    grid-row: span 3;
} /* 2x3 cell */

.bento-wide {
    grid-column: span 4;
    grid-row: span 1;
} /* 4x1 cell */

.bento-square {
    grid-column: span 2;
    grid-row: span 2;
} /* 2x2 cell */

.bento-small {
    grid-column: span 1;
    grid-row: span 1;
} /* 1x1 cell */
\`\`\`

### 2. 🎨 CONTAINED CARDS
Each cell is a self-contained card:

\`\`\`css
.bento-card {
    background: white;
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    transition: all 0.3s ease;
}

.bento-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Different background colors for variety */
.bento-card:nth-child(1) { background: #f0f9ff; }
.bento-card:nth-child(2) { background: #fef3c7; }
.bento-card:nth-child(3) { background: #f0fdf4; }
.bento-card:nth-child(4) { background: white; }
.bento-card:nth-child(5) { background: #fce7f3; }
\`\`\`

### 3. 🎭 VISUAL RHYTHM
Create patterns with deliberate variation:

\`\`\`css
/* Pattern 1: Hero + Grid */
.pattern-hero {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(3, 250px);
    gap: 20px;
}

.hero-bento {
    grid-column: 1 / 4;
    grid-row: 1 / 3;
} /* Big hero card */

/* Smaller cards fill remaining space */
.small-1 { grid-column: 4 / 6; grid-row: 1; }
.small-2 { grid-column: 6 / 7; grid-row: 1; }
.small-3 { grid-column: 4 / 7; grid-row: 2; }
.small-4 { grid-column: 1 / 3; grid-row: 3; }
.small-5 { grid-column: 3 / 5; grid-row: 3; }
.small-6 { grid-column: 5 / 7; grid-row: 3; }
\`\`\`

### 4. 🎨 CONTENT VARIATIONS
Different content types in each cell:

\`\`\`css
/* Image-dominant card */
.bento-image {
    padding: 0;
    background: #000;
}

.bento-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Text-heavy card */
.bento-text {
    padding: 40px;
}

.bento-text h3 {
    font-size: 32px;
    margin-bottom: 16px;
}

/* Data/metric card */
.bento-metric {
    padding: 32px;
    text-align: center;
}

.bento-metric .number {
    font-size: 72px;
    font-weight: 700;
    line-height: 1;
}

.bento-metric .label {
    font-size: 16px;
    opacity: 0.6;
    margin-top: 8px;
}

/* Icon card */
.bento-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64px;
}
\`\`\`

**CRITICAL**: Maintain consistent gap spacing (20px). Each card should feel complete and self-contained. Use subtle hover effects for interactivity.`,
  },
];

/**
 * SEMI-UNLEASHED ARCHETYPES (15)
 * Kreativ, ausgewogen, experimentell aber kontrolliert
 */
export const SEMI_UNLEASHED_ARCHETYPES: Archetype[] = [
  {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    category: 'semi-unleashed',
    description: 'Raw concrete, hard shadows, bold borders, punk aesthetic',
    icon: Box,
    level: 'semi-unleashed',
    designPrinciples: ['Hard shadows (8-12px solid)', 'Bold borders (3-4px)', 'Clash colors', 'Asymmetric grids', 'Raw honesty'],
    promptInstructions: `## 🔨 NEO-BRUTALISM - Raw Digital Concrete
**DIRECTIVE**: You are a **punk designer rejecting polish**. Build raw, honest, confrontational interfaces.
**AESTHETIC**: Gumroad, Craigslist's cooler cousin. Hard shadows, bold borders, no apologies.

### 1. ⬛ HARD SOLID SHADOWS (8-12px)
Brutally harsh drop shadows:

\`\`\`css
.card {
    background: #fff;
    border: 4px solid #000;
    box-shadow: 8px 8px 0 #000; /* Hard offset shadow */
    padding: 32px;
}

.card:hover {
    transform: translate(4px, 4px);
    box-shadow: 4px 4px 0 #000; /* Shadow moves with card */
}

.button {
    background: #ffff00; /* Harsh yellow */
    border: 3px solid #000;
    padding: 16px 32px;
    box-shadow: 6px 6px 0 #000;
    font-weight: 900;
}

.button:active {
    transform: translate(6px, 6px);
    box-shadow: none; /* Pressed down */
}
\`\`\`

### 2. 🎨 CLASHING COLOR SCHEMES
Intentionally discordant colors:

\`\`\`css
:root {
    --brutal-yellow: #ffff00;
    --brutal-cyan: #00ffff;
    --brutal-magenta: #ff00ff;
    --brutal-lime: #00ff00;
    --black: #000000;
}

/* Colors that shouldn't work together (but do) */
.section-1 {
    background: var(--brutal-yellow);
    color: var(--black);
}

.section-2 {
    background: var(--brutal-cyan);
    color: var(--black);
    border-top: 6px solid var(--brutal-magenta);
}

.accent {
    background: var(--brutal-lime);
    border: 3px solid var(--black);
}

/* High saturation, no pastels */
\`\`\`

### 3. 🔲 BOLD BORDERS (3-4px)
Thick black borders everywhere:

\`\`\`css
* {
    border: 3px solid #000 !important; /* Everything has a border */
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0; /* No gaps - borders touch */
}

.grid-item {
    border: 3px solid #000;
    padding: 24px;
    background: var(--brutal-yellow);
}

/* Borders create the grid lines */
.grid-item:not(:nth-child(3n)) {
    border-right-width: 1.5px; /* Shared borders */
}

.grid-item:nth-child(-n+3) {
    border-top: none; /* Remove top border from first row */
}
\`\`\`

### 4. ⚡ ASYMMETRIC GRIDS
Intentionally unbalanced layouts:

\`\`\`css
.brutal-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 2fr; /* Uneven columns */
    grid-template-rows: 300px 150px 400px; /* Uneven rows */
    gap: 0;
}

.item-1 {
    grid-column: 1 / 3;
    background: var(--brutal-cyan);
}

.item-2 {
    grid-column: 3;
    grid-row: 1 / 3;
    background: var(--brutal-magenta);
}

/* No symmetry, no balance */
.offset-content {
    margin-left: 80px; /* Intentional off-center */
    margin-top: -40px; /* Break the grid */
}
\`\`\`

**CRITICAL**: Embrace ugliness. NO subtle shadows, NO gradients, NO rounded corners. Everything is harsh, direct, honest. Maintain accessibility despite brutal aesthetic.`,
  },
  {
    id: 'kinetic-typography',
    name: 'Kinetic Typography',
    category: 'semi-unleashed',
    description: 'Type dominates 80%, extreme scale, dynamic motion hints',
    icon: Type,
    level: 'semi-unleashed',
    designPrinciples: ['Type = 80% design', 'Extreme scale (12-200px)', 'Overlapping text', 'Minimal graphics', 'Rotated headlines'],
    promptInstructions: `## 🎬 KINETIC TYPOGRAPHY - Text in Motion
**DIRECTIVE**: **Typography IS 80% of your design**. Text dominates everything.
**AESTHETIC**: Movie posters, kinetic type animations, text as visual element.

### 1. 📏 EXTREME SCALE RANGES (12-200px)
Massive contrast in type sizes:

\`\`\`css
.hero-headline {
    font-size: clamp(120px, 20vw, 280px);
    font-weight: 900;
    line-height: 0.85;
    letter-spacing: -0.05em;
}

.tiny-label {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

/* Mix massive and tiny in same layout */
.kinetic-stack h1 {
    font-size: 200px;
}

.kinetic-stack .caption {
    font-size: 14px;
    margin-top: -60px; /* Overlap with headline */
}
\`\`\`

### 2. 🎭 OVERLAPPING TEXT LAYERS
Text stacks on top of text:

\`\`\`css
.text-layer-1 {
    font-size: 180px;
    font-weight: 900;
    opacity: 0.1;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}

.text-layer-2 {
    font-size: 120px;
    font-weight: 700;
    position: relative;
    z-index: 2;
    margin-top: 100px;
    margin-left: 60px;
}

.text-layer-3 {
    font-size: 48px;
    position: relative;
    z-index: 3;
    margin-top: -40px;
}

/* Create depth through layering */
\`\`\`

### 3. 🔄 ROTATED & TRANSFORMED TYPE
Break the horizontal:

\`\`\`css
.rotated-text {
    transform: rotate(-5deg);
    transform-origin: left center;
}

.vertical-label {
    writing-mode: vertical-rl;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: 0.2em;
    position: absolute;
    right: 40px;
    top: 80px;
}

.diagonal-text {
    transform: rotate(45deg);
    font-size: 96px;
    font-weight: 900;
    position: absolute;
}

/* Text at all angles */
.chaotic-type:nth-child(1) { transform: rotate(3deg); }
.chaotic-type:nth-child(2) { transform: rotate(-7deg); }
.chaotic-type:nth-child(3) { transform: rotate(12deg); }
\`\`\`

### 4. 🚫 MINIMAL GRAPHICS
Text creates all visual interest:

\`\`\`css
/* NO images - just type */
.number-graphic {
    font-size: 320px;
    font-weight: 900;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 2px #000;
}

/* Text as background */
.text-background {
    position: relative;
    overflow: hidden;
}

.text-background::before {
    content: 'TYPE TYPE TYPE TYPE';
    position: absolute;
    font-size: 240px;
    font-weight: 900;
    opacity: 0.03;
    white-space: nowrap;
    animation: scroll 20s linear infinite;
}

@keyframes scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}
\`\`\`

**CRITICAL**: Type must remain readable despite chaos. Use font-display: swap. Maintain 4.5:1 contrast on primary content.`,
  },
  {
    id: 'retro-future',
    name: 'Retro-Future Y2K',
    category: 'semi-unleashed',
    description: 'Vaporwave gradients, neon glows, nostalgic tech vibes',
    icon: Sparkles,
    level: 'semi-unleashed',
    designPrinciples: ['Y2K nostalgia', 'Gradient meshes', 'Neon glows', 'Chrome effects', 'Pink/cyan palette'],
    promptInstructions: `## 🌈 RETRO-FUTURE Y2K - Vaporwave Nostalgia
**DIRECTIVE**: Build a time machine to **late 90s/early 2000s optimistic tech**. Think Windows XP meets vaporwave.
**AESTHETIC**: Gradient meshes, chrome buttons, neon glows, nostalgic tech dreams.

### 1. 🎨 GRADIENT MESH BACKGROUNDS
Complex multi-stop gradients everywhere:

\`\`\`css
body {
    background: radial-gradient(
        circle at 20% 30%,
        #ff6ec7 0%,
        #7873f5 25%,
        #00d4ff 50%,
        #7873f5 75%,
        #ff6ec7 100%
    );
}

.mesh-section {
    background:
        radial-gradient(circle at 80% 20%, rgba(255, 110, 199, 0.5), transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.5), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(120, 115, 245, 0.5), transparent 50%);
}
\`\`\`

### 2. ✨ NEON GLOW EFFECTS
Text and elements glow like neon signs:

\`\`\`css
.neon-text {
    color: #00d4ff;
    text-shadow:
        0 0 10px #00d4ff,
        0 0 20px #00d4ff,
        0 0 30px #00d4ff,
        0 0 40px #0084ff;
    font-size: 72px;
    font-weight: 700;
}

.neon-button {
    background: transparent;
    border: 2px solid #ff6ec7;
    color: #ff6ec7;
    box-shadow:
        0 0 10px #ff6ec7,
        inset 0 0 10px #ff6ec7;
    padding: 16px 48px;
}

.neon-button:hover {
    background: #ff6ec7;
    color: #000;
    box-shadow:
        0 0 20px #ff6ec7,
        0 0 40px #ff6ec7;
}
\`\`\`

### 3. 🪙 CHROME EFFECTS
Metallic, reflective surfaces:

\`\`\`css
.chrome-text {
    background: linear-gradient(
        135deg,
        #c0c0c0 0%,
        #ffffff 25%,
        #808080 50%,
        #ffffff 75%,
        #c0c0c0 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 96px;
    font-weight: 900;
}

.chrome-card {
    background: linear-gradient(
        135deg,
        #d4d4d4,
        #ffffff,
        #a0a0a0,
        #ffffff,
        #d4d4d4
    );
    border-radius: 24px;
    padding: 40px;
    position: relative;
}

.chrome-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0.8),
        transparent,
        rgba(255, 255, 255, 0.8)
    );
    border-radius: 24px;
    mix-blend-mode: overlay;
}
\`\`\`

### 4. 💖 PINK/CYAN/PURPLE PALETTE
The iconic Y2K color scheme:

\`\`\`css
:root {
    --y2k-pink: #ff6ec7;
    --y2k-cyan: #00d4ff;
    --y2k-purple: #7873f5;
    --y2k-yellow: #ffd966;
}

.section-1 {
    background: linear-gradient(135deg, var(--y2k-pink), var(--y2k-purple));
}

.section-2 {
    background: linear-gradient(135deg, var(--y2k-cyan), var(--y2k-purple));
}

.section-3 {
    background: linear-gradient(135deg, var(--y2k-purple), var(--y2k-yellow));
}

/* Combine all Y2K colors */
.y2k-blend {
    background:
        linear-gradient(135deg, var(--y2k-pink), transparent),
        linear-gradient(225deg, var(--y2k-cyan), transparent),
        linear-gradient(315deg, var(--y2k-purple), transparent);
}
\`\`\`

**CRITICAL**: Add overflow-x: hidden. Use web-safe fonts or futuristic sans-serifs. Everything should feel optimistic and slightly plastic.`,
  },
  {
    id: 'organic-blobs',
    name: 'Organic Blobs',
    category: 'semi-unleashed',
    description: 'Asymmetric shapes, fluid forms, natural flowing layouts',
    icon: Droplet,
    level: 'semi-unleashed',
    designPrinciples: ['Blob shapes', 'Asymmetric radius', 'Flowing layouts', 'Natural colors', 'Soft morphology'],
    promptInstructions: `## 🫧 ORGANIC BLOBS - Liquid Morphology
**DIRECTIVE**: **NO straight lines allowed**. Everything is a flowing, organic blob.
**AESTHETIC**: Amoeba-inspired, lava lamp fluidity, natural morphology.

### 1. 🌊 ASYMMETRIC BORDER-RADIUS
Complex blob formulas:

\`\`\`css
.blob-1 {
    border-radius: 60% 40% 70% 30% / 40% 60% 30% 70%;
    background: #a8e6cf;
    padding: 48px;
}

.blob-2 {
    border-radius: 73% 27% 48% 52% / 31% 58% 42% 69%;
    background: #ffd3b6;
}

.blob-3 {
    border-radius: 38% 62% 63% 37% / 41% 44% 56% 59%;
    background: #ffaaa5;
}

/* Each blob unique - vary the percentages */
.blob-4 {
    border-radius: 55% 45% 62% 38% / 48% 33% 67% 52%;
}

/* NO sharp corners - minimum 30% radius */
\`\`\`

### 2. 🎨 FLOWING NATURAL COLORS
Pastel, nature-inspired palette:

\`\`\`css
:root {
    --mint: #a8e6cf;
    --peach: #ffd3b6;
    --coral: #ffaaa5;
    --lavender: #dcd3ff;
    --sky: #b4e7ff;
}

/* Soft, flowing gradients */
.blob-section {
    background: radial-gradient(
        ellipse at top left,
        var(--mint) 0%,
        var(--sky) 100%
    );
    border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
}
\`\`\`

### 3. 🌀 FLOWING LAYOUTS
Elements flow into each other:

\`\`\`css
.flow-container {
    position: relative;
}

.blob-card {
    margin: -40px 0; /* Negative margin creates overlap */
    position: relative;
    z-index: var(--layer);
}

.blob-card:nth-child(1) {
    --layer: 3;
    background: var(--mint);
}

.blob-card:nth-child(2) {
    --layer: 2;
    background: var(--peach);
    margin-left: 60px; /* Offset creates flow */
}

.blob-card:nth-child(3) {
    --layer: 1;
    background: var(--coral);
    margin-left: -40px; /* Flow back */
}
\`\`\`

### 4. 💧 SOFT ORGANIC SHADOWS
Diffused blob shadows:

\`\`\`css
.blob {
    box-shadow:
        0 8px 32px rgba(168, 230, 207, 0.3),
        0 16px 64px rgba(168, 230, 207, 0.2);
    filter: drop-shadow(0 4px 16px rgba(168, 230, 207, 0.25));
}

/* Shadows follow blob shape */
.blob-hover:hover {
    box-shadow:
        0 12px 48px rgba(168, 230, 207, 0.4),
        0 24px 96px rgba(168, 230, 207, 0.3);
    transform: translateY(-4px);
}
\`\`\`

**CRITICAL**: All containers need overflow: hidden to prevent blob overflow. Keep text readable inside morphed shapes.`,
  },
  {
    id: 'grid-maximalism',
    name: 'Grid Maximalism',
    category: 'semi-unleashed',
    description: 'Dense info, complex columns, editorial magazine chaos',
    icon: Grid,
    level: 'semi-unleashed',
    designPrinciples: ['8-12 columns', 'Dense content', 'Editorial layouts', 'Controlled chaos', 'Multi-level hierarchy'],
    promptInstructions: `## 📰 GRID MAXIMALISM - Dense Editorial Chaos
**DIRECTIVE**: Pack **MAXIMUM information** into complex multi-column layouts. Think Bloomberg Terminal meets magazine.
**AESTHETIC**: Dense, information-rich, editorial complexity, controlled chaos.

### 1. 📐 8-12 COLUMN GRIDS
Ultra-complex grid systems:

\`\`\`css
.max-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    padding: 40px;
}

/* Different items span different widths */
.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }

/* Dense packing */
.dense-item {
    padding: 20px;
    border: 1px solid #e0e0e0;
}
\`\`\`

### 2. 📊 DENSE INFORMATION
Multi-level hierarchy, lots of content:

\`\`\`css
.info-card {
    padding: 24px;
    background: white;
    border: 1px solid #ddd;
}

.info-card h4 {
    font-size: 18px;
    margin-bottom: 8px;
}

.info-card .meta {
    font-size: 12px;
    color: #666;
    margin-bottom: 12px;
    display: flex;
    gap: 12px;
}

.info-card p {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 16px;
}

.info-card .tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.tag {
    font-size: 11px;
    padding: 4px 8px;
    background: #f0f0f0;
    border-radius: 4px;
}
\`\`\`

### 3. 📰 EDITORIAL MAGAZINE LAYOUTS
Newspaper-style complexity:

\`\`\`css
.editorial-section {
    column-count: 3;
    column-gap: 32px;
    column-rule: 1px solid #ddd;
}

.pullout-stat {
    column-span: all; /* Break columns */
    font-size: 64px;
    font-weight: 900;
    text-align: center;
    margin: 40px 0;
    padding: 40px 0;
    border-top: 3px solid #000;
    border-bottom: 3px solid #000;
}

/* Sidebar content */
.sidebar-complex {
    position: sticky;
    top: 80px;
    padding: 24px;
    background: #f8f8f8;
    border-left: 4px solid #000;
}
\`\`\`

### 4. 🎭 CONTROLLED COMPLEXITY
Dense but organized:

\`\`\`css
/* Visual separators */
.divider {
    height: 1px;
    background: linear-gradient(
        to right,
        transparent,
        #ddd 20%,
        #ddd 80%,
        transparent
    );
    margin: 32px 0;
}

/* Nested grids */
.nested-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

/* Dense typography */
.compact-text {
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 12px;
}

/* Small headings for density */
.micro-heading {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
    color: #666;
}
\`\`\`

**CRITICAL**: Despite density, maintain clear hierarchy. Use consistent spacing (12px/16px/24px). Everything should be scannable.`,
  },
  {
    id: 'acid-chrome',
    name: 'Acid Chrome',
    category: 'semi-unleashed',
    description: 'Metallic sheens, iridescent colors, reflective surfaces',
    icon: Diamond,
    level: 'semi-unleashed',
    designPrinciples: ['Chrome gradients', 'Iridescent colors', 'Metallic sheen', 'Holographic effects', 'Reflective surfaces'],
    promptInstructions: `## 💿 ACID CHROME - Holographic Metal
**DIRECTIVE**: Build interfaces that look like **liquid metal and oil slicks**. Iridescent, reflective, trippy.
**AESTHETIC**: CD-ROM rainbows, holographic stickers, metallic sheens, acid trip visuals.

### 1. 🌈 IRIDESCENT HUE-ROTATE
Animated rainbow metal effects:

\`\`\`css
.iridescent {
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 25%,
        #f093fb 50%,
        #4facfe 75%,
        #00f2fe 100%
    );
    animation: hueShift 4s linear infinite;
}

@keyframes hueShift {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
}

/* Text with rainbow effect */
.rainbow-text {
    background: linear-gradient(
        to right,
        #ff0000,
        #ff7f00,
        #ffff00,
        #00ff00,
        #0000ff,
        #4b0082,
        #9400d3
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 96px;
    font-weight: 900;
}
\`\`\`

### 2. 🪙 METALLIC CHROME GRADIENTS
Complex multi-stop metallic sheens:

\`\`\`css
.chrome {
    background: linear-gradient(
        135deg,
        #e0e0e0 0%,
        #ffffff 10%,
        #c0c0c0 20%,
        #ffffff 30%,
        #a0a0a0 40%,
        #ffffff 50%,
        #808080 60%,
        #ffffff 70%,
        #606060 80%,
        #ffffff 90%,
        #e0e0e0 100%
    );
    position: relative;
}

.chrome::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0.8),
        transparent 50%,
        rgba(0, 0, 0, 0.3)
    );
    mix-blend-mode: overlay;
}
\`\`\`

### 3. 💎 HOLOGRAPHIC EFFECTS
Oil-slick rainbow reflections:

\`\`\`css
.holographic {
    background:
        radial-gradient(circle at 30% 40%, rgba(255,0,255,0.8), transparent 40%),
        radial-gradient(circle at 70% 60%, rgba(0,255,255,0.8), transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(255,255,0,0.8), transparent 40%),
        linear-gradient(135deg, #667eea, #764ba2);
    animation: holoShift 6s ease-in-out infinite;
}

@keyframes holoShift {
    0%, 100% {
        filter: hue-rotate(0deg) saturate(150%);
    }
    50% {
        filter: hue-rotate(180deg) saturate(200%);
    }
}

/* Holographic border */
.holo-border {
    border: 3px solid transparent;
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #ff00ff, #00ffff, #ffff00, #ff00ff) border-box;
}
\`\`\`

### 4. ✨ REFLECTIVE SHEEN
Simulated light reflections:

\`\`\`css
.reflective-card {
    background: linear-gradient(
        135deg,
        #c0c0c0,
        #ffffff,
        #a0a0a0
    );
    position: relative;
    overflow: hidden;
}

.reflective-card::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0.8) 0%,
        transparent 50%
    );
    transform: rotate(45deg);
    animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
    0%, 100% { transform: rotate(45deg) translateX(-100%); }
    50% { transform: rotate(45deg) translateX(100%); }
}
\`\`\`

**CRITICAL**: Use overflow-x: hidden. High saturation can cause eye strain - use sparingly. Add reduced-motion queries for accessibility.`,
  },
  {
    id: 'collage-mixed',
    name: 'Collage Mixed Media',
    category: 'semi-unleashed',
    description: 'Layered elements, torn edges, scrapbook aesthetic',
    icon: Layers,
    level: 'semi-unleashed',
    designPrinciples: ['Layered collage', 'Torn paper edges', 'Mixed textures', 'Overlapping elements', 'Artistic chaos'],
    promptInstructions: `## ✂️ COLLAGE MIXED MEDIA - Scrapbook Aesthetic
**DIRECTIVE**: Build a **digital scrapbook** where elements are cut, torn, and layered.
**AESTHETIC**: Magazine cutouts, torn paper, overlapping layers, artistic chaos.

### 1. 📄 TORN PAPER EDGES (clip-path)
Irregular, hand-torn edges:

\`\`\`css
.torn-edge {
    clip-path: polygon(
        0% 0%,
        95% 0%,
        100% 3%,
        98% 7%,
        100% 12%,
        97% 15%,
        100% 20%,
        100% 100%,
        0% 100%,
        0% 95%,
        2% 90%,
        0% 85%,
        3% 80%,
        0% 75%
    );
}

.torn-bottom {
    clip-path: polygon(
        0% 0%,
        100% 0%,
        100% 95%,
        97% 92%,
        95% 96%,
        90% 93%,
        85% 97%,
        80% 94%,
        75% 98%,
        70% 95%,
        65% 99%,
        60% 96%,
        55% 98%,
        50% 97%,
        45% 99%,
        40% 96%,
        35% 97%,
        30% 99%,
        25% 96%,
        20% 98%,
        15% 95%,
        10% 97%,
        5% 95%,
        0% 98%
    );
}
\`\`\`

### 2. 🎨 LAYERED OVERLAPPING ELEMENTS
Scrapbook-style composition:

\`\`\`css
.collage-container {
    position: relative;
    min-height: 800px;
}

.layer-1 {
    position: absolute;
    top: 50px;
    left: 100px;
    z-index: 1;
    transform: rotate(-3deg);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.layer-2 {
    position: absolute;
    top: 120px;
    left: 200px;
    z-index: 2;
    transform: rotate(5deg);
    box-shadow: 0 8px 16px rgba(0,0,0,0.25);
}

.layer-3 {
    position: absolute;
    top: 80px;
    left: 350px;
    z-index: 3;
    transform: rotate(-7deg);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

/* Tape effect to hold elements */
.tape {
    position: absolute;
    width: 100px;
    height: 30px;
    background: rgba(255, 255, 200, 0.6);
    transform: rotate(45deg);
    top: -15px;
    right: 20px;
}
\`\`\`

### 3. 🖼️ MIXED TEXTURES
Paper, photos, stickers combined:

\`\`\`css
.paper-texture {
    background: #faf8f0;
    position: relative;
}

.paper-texture::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('data:image/svg+xml,...'); /* noise texture */
    opacity: 0.15;
    mix-blend-mode: multiply;
}

/* Photo element */
.photo-element {
    background: white;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    border: 1px solid #e0e0e0;
}

/* Sticker element */
.sticker {
    border-radius: 50%;
    background: #ff6b6b;
    color: white;
    padding: 20px;
    font-weight: 900;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
\`\`\`

### 4. 🎭 ARTISTIC CHAOS
Intentionally messy composition:

\`\`\`css
/* Random rotations */
.chaos-item:nth-child(1) { transform: rotate(3deg); }
.chaos-item:nth-child(2) { transform: rotate(-7deg); }
.chaos-item:nth-child(3) { transform: rotate(12deg); }
.chaos-item:nth-child(4) { transform: rotate(-5deg); }

/* Overlapping with negative margins */
.overlap-item {
    margin-top: -40px;
    margin-left: -20px;
}

/* Hand-drawn style borders */
.sketch-border {
    border: 3px solid #000;
    border-radius: 2px;
    position: relative;
}

.sketch-border::after {
    content: '';
    position: absolute;
    inset: -3px;
    border: 2px dashed #000;
    opacity: 0.5;
}
\`\`\`

**CRITICAL**: Use overflow: hidden on containers. Ensure text remains readable despite rotation/overlap. Test on different screen sizes.`,
  },
  {
    id: 'neon-tokyo',
    name: 'Neon Tokyo Nights',
    category: 'semi-unleashed',
    description: 'Cyberpunk neons, dark backgrounds, electric accents',
    icon: Zap,
    level: 'semi-unleashed',
    designPrinciples: ['Dark bg (near-black)', 'Neon colors', 'Glow effects', 'Cyberpunk aesthetic', 'Electric accents'],
    promptInstructions: `## 🏮 NEON TOKYO NIGHTS - Cyberpunk Aesthetic
**DIRECTIVE**: Build **Blade Runner's vision of Tokyo**. Dark, neon-soaked, cyberpunk future.
**AESTHETIC**: Neon signs, dark streets, electric pink/cyan, dystopian tech vibes.

### 1. 🌃 DARK NEAR-BLACK BACKGROUNDS
Deep dark bases for neon to pop:

\`\`\`css
body {
    background: #0a0a0f; /* Near-black with blue tint */
    color: #e0e0e0;
}

.section-dark {
    background: #111118;
    padding: 80px 60px;
}

/* Gradient dark backgrounds */
.hero-dark {
    background: linear-gradient(
        to bottom,
        #0a0a0f 0%,
        #1a0f2e 100%
    );
}

/* NO bright backgrounds - stay dark */
\`\`\`

### 2. ⚡ NEON GLOW EFFECTS (box-shadow)
Pink, cyan, yellow neon signs:

\`\`\`css
.neon-pink {
    color: #ff006e;
    text-shadow:
        0 0 5px #ff006e,
        0 0 10px #ff006e,
        0 0 20px #ff006e,
        0 0 40px #ff006e;
    font-size: 72px;
    font-weight: 900;
}

.neon-cyan {
    color: #00f5ff;
    text-shadow:
        0 0 5px #00f5ff,
        0 0 10px #00f5ff,
        0 0 20px #00f5ff,
        0 0 40px #00f5ff;
}

.neon-yellow {
    color: #ffed4e;
    text-shadow:
        0 0 5px #ffed4e,
        0 0 10px #ffed4e,
        0 0 20px #ffed4e;
}

/* Neon bordered cards */
.neon-card {
    background: rgba(17, 17, 24, 0.8);
    border: 2px solid #ff006e;
    box-shadow:
        0 0 10px #ff006e,
        inset 0 0 10px rgba(255, 0, 110, 0.2);
    padding: 32px;
}
\`\`\`

### 3. 🎆 ELECTRIC PINK/CYAN/YELLOW PALETTE
The cyberpunk color trinity:

\`\`\`css
:root {
    --neon-pink: #ff006e;
    --neon-cyan: #00f5ff;
    --neon-yellow: #ffed4e;
    --dark-bg: #0a0a0f;
    --dark-surface: #111118;
}

/* Section with all neon colors */
.cyber-section {
    background: var(--dark-bg);
    border-top: 3px solid var(--neon-pink);
    border-bottom: 3px solid var(--neon-cyan);
}

/* Buttons with neon */
.cyber-button {
    background: transparent;
    border: 2px solid var(--neon-cyan);
    color: var(--neon-cyan);
    padding: 16px 40px;
    box-shadow: 0 0 15px var(--neon-cyan);
    transition: all 0.3s ease;
}

.cyber-button:hover {
    background: var(--neon-cyan);
    color: var(--dark-bg);
    box-shadow: 0 0 30px var(--neon-cyan);
}
\`\`\`

### 4. 🌆 CYBERPUNK DETAILS
Grid overlays, scan lines, tech aesthetic:

\`\`\`css
/* Scan line overlay */
body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 245, 255, 0.03) 0px,
        transparent 2px,
        transparent 4px,
        rgba(0, 245, 255, 0.03) 6px
    );
    pointer-events: none;
    z-index: 9999;
}

/* Grid background */
.cyber-grid {
    background-image:
        linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
}

/* Glitch text effect */
@keyframes glitch {
    0%, 100% {
        text-shadow:
            -2px 0 #ff006e,
            2px 0 #00f5ff;
    }
    50% {
        text-shadow:
            2px 0 #ff006e,
            -2px 0 #00f5ff;
    }
}

.glitch-text {
    animation: glitch 0.3s infinite;
}
\`\`\`

**CRITICAL**: Dark mode essential. Neon effects require dark backgrounds. Ensure 4.5:1 contrast on body text. Add prefers-reduced-motion for glitch effects.`,
  },
  {
    id: 'hand-drawn',
    name: 'Hand-Drawn Sketch',
    category: 'semi-unleashed',
    description: 'Rough edges, imperfect lines, human touch, sketch style',
    icon: Type,
    level: 'semi-unleashed',
    designPrinciples: ['Rough edges', 'Imperfect shapes', 'Hand-drawn feel', 'Sketch aesthetics', 'Organic imperfection'],
    promptInstructions: `## ✏️ HAND-DRAWN SKETCH - The Human Touch
**DIRECTIVE**: Make digital feel **hand-drawn**. Embrace imperfection and human touch.
**AESTHETIC**: Rough sketch lines, wobbly shapes, illustrated feel, organic imperfection.

### 1. ✏️ ROUGH SKETCH BORDERS
Imperfect, hand-drawn style borders:

\`\`\`css
.sketch-box {
    border: 3px solid #000;
    position: relative;
    padding: 32px;
    background: white;
}

/* Simulate hand-drawn double line */
.sketch-box::before {
    content: '';
    position: absolute;
    inset: -6px;
    border: 2px solid #000;
    opacity: 0.7;
}

/* Wobbly SVG border */
.wobbly-border {
    border: none;
    background: white;
    padding: 32px;
    position: relative;
    filter: url(#wobble);
}

/* In SVG defs - creates roughness */
<svg style="position: absolute; width: 0; height: 0;">
  <defs>
    <filter id="wobble">
      <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3"/>
    </filter>
  </defs>
</svg>
\`\`\`

### 2. 🎨 IMPERFECT SHAPES
Asymmetric, hand-drawn forms:

\`\`\`css
/* Imperfect circles */
.hand-circle {
    width: 200px;
    height: 200px;
    border-radius: 48% 52% 53% 47% / 51% 49% 51% 49%;
    border: 3px solid #000;
    background: #fff;
}

/* Wobbly rectangles */
.sketch-card {
    clip-path: polygon(
        1% 2%,
        98% 1%,
        99% 98%,
        2% 99%
    );
    border: 3px solid #000;
    background: white;
}

/* Hand-drawn arrows */
.arrow {
    width: 100px;
    height: 3px;
    background: #000;
    position: relative;
    transform: rotate(-2deg); /* Slight wobble */
}

.arrow::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid #000;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    position: absolute;
    right: -10px;
    top: -6px;
    transform: rotate(5deg);
}
\`\`\`

### 3. ✍️ SKETCH-STYLE TEXT
Hand-written feel for headings:

\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Indie+Flower&display=swap');

h1, h2, h3 {
    font-family: 'Caveat', cursive;
    font-weight: 700;
}

h1 {
    font-size: 84px;
    transform: rotate(-1deg);
}

/* Body can be more readable */
p {
    font-family: 'Indie Flower', cursive;
    font-size: 18px;
    line-height: 1.8;
}

/* Underlines that look hand-drawn */
.underline-sketch {
    position: relative;
}

.underline-sketch::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 3px;
    background: #000;
    clip-path: polygon(
        0% 50%,
        5% 45%,
        10% 55%,
        15% 48%,
        20% 52%,
        25% 47%,
        30% 53%,
        35% 49%,
        40% 51%,
        45% 48%,
        50% 52%,
        55% 49%,
        60% 51%,
        65% 48%,
        70% 52%,
        75% 49%,
        80% 51%,
        85% 48%,
        90% 52%,
        95% 49%,
        100% 50%
    );
}
\`\`\`

### 4. 🖍️ ORGANIC IMPERFECTION
Embrace the human hand:

\`\`\`css
/* Scribbled backgrounds */
.scribble-bg {
    background-image: url('data:image/svg+xml;base64,...'); /* hand-drawn texture */
    background-repeat: repeat;
}

/* Rough-edged images */
img.sketched {
    border: 4px solid #000;
    padding: 12px;
    background: white;
    transform: rotate(-0.5deg);
    box-shadow: 2px 2px 0 #000;
}

/* Doodle elements */
.doodle-star {
    width: 60px;
    height: 60px;
    clip-path: polygon(
        50% 0%,
        55% 35%,
        90% 35%,
        60% 57%,
        70% 91%,
        50% 70%,
        30% 91%,
        40% 57%,
        10% 35%,
        45% 35%
    );
    background: #ffed4e;
    border: 2px solid #000;
    transform: rotate(12deg);
}
\`\`\`

**CRITICAL**: Use hand-drawn fonts sparingly for readability. Maintain 4.5:1 contrast. Test imperfect shapes on different screens.`,
  },
  {
    id: 'split-screen',
    name: 'Split Screen Duality',
    category: 'semi-unleashed',
    description: 'Half/half layouts, contrasting sides, visual tension',
    icon: Box,
    level: 'semi-unleashed',
    designPrinciples: ['50/50 split', 'Contrasting sides', 'Dual color schemes', 'Visual tension', 'Mirrored layouts'],
    promptInstructions: `## ⚔️ SPLIT SCREEN DUALITY - Two Worlds Collide
**DIRECTIVE**: Build interfaces that are **two distinct halves**. Light vs dark, left vs right, contrast vs harmony.
**AESTHETIC**: Magazine spreads, comparison layouts, duality, visual tension.

### 1. 📐 50/50 VERTICAL SPLITS
Perfectly balanced halves:

\`\`\`css
.split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    gap: 0;
}

.split-left {
    padding: 80px 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.split-right {
    padding: 80px 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* Divider line */
.split-container::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
        to bottom,
        transparent,
        #000 20%,
        #000 80%,
        transparent
    );
}
\`\`\`

### 2. 🎨 CONTRASTING COLOR SCHEMES
Each side has its own identity:

\`\`\`css
/* Light side */
.split-left {
    background: #ffffff;
    color: #000000;
}

.split-left h1 {
    color: #000000;
}

.split-left button {
    background: #000000;
    color: #ffffff;
}

/* Dark side */
.split-right {
    background: #000000;
    color: #ffffff;
}

.split-right h1 {
    color: #ffffff;
}

.split-right button {
    background: #ffffff;
    color: #000000;
}

/* Alternative: Complementary colors */
.split-warm {
    background: linear-gradient(135deg, #ff6b6b, #feca57);
    color: #000;
}

.split-cool {
    background: linear-gradient(135deg, #48dbfb, #0abde3);
    color: #fff;
}
\`\`\`

### 3. ⚖️ DUAL AESTHETICS
Different design styles per side:

\`\`\`css
/* Left: Minimal */
.split-minimal {
    font-family: 'Helvetica Neue', sans-serif;
    text-align: left;
}

.split-minimal h1 {
    font-size: 72px;
    font-weight: 300;
    line-height: 1.1;
}

/* Right: Bold */
.split-bold {
    font-family: 'Inter', sans-serif;
    text-align: right;
}

.split-bold h1 {
    font-size: 96px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
}

/* Left: Serif */
.split-serif {
    font-family: 'Playfair Display', serif;
}

/* Right: Sans */
.split-sans {
    font-family: 'Inter', sans-serif;
}
\`\`\`

### 4. ⚡ VISUAL TENSION
Create dynamic balance:

\`\`\`css
/* Asymmetric content alignment */
.split-left {
    align-items: flex-start;
    justify-content: flex-end; /* Bottom alignment */
}

.split-right {
    align-items: flex-end;
    justify-content: flex-start; /* Top alignment */
}

/* Overlapping elements across divide */
.cross-element {
    position: absolute;
    left: 45%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10%;
    height: 200px;
    background: #ff006e;
    z-index: 10;
}

/* Mirrored layouts */
.split-left .content {
    margin-left: auto;
    max-width: 500px;
}

.split-right .content {
    margin-right: auto;
    max-width: 500px;
}

/* Contrasting shadows */
.split-left .card {
    box-shadow: 8px 8px 0 #000;
}

.split-right .card {
    box-shadow: -8px 8px 0 #fff;
}
\`\`\`

**CRITICAL**: Ensure both sides are readable. Test responsive breakpoints (stack vertically on mobile). Maintain accessibility on both sides.`,
  },
  {
    id: 'isometric-3d',
    name: 'Isometric 3D',
    category: 'semi-unleashed',
    description: 'Fake 3D, isometric angles, layered depth illusion',
    icon: Box,
    level: 'semi-unleashed',
    designPrinciples: ['Isometric grids', 'Fake 3D shadows', '30° angles', 'Layered depth', 'Axonometric projection'],
    promptInstructions: `## 📦 ISOMETRIC 3D - Fake Depth Illusion
**DIRECTIVE**: Create **fake 3D perspective** using 2D transforms. No real 3D, just clever illusions.
**AESTHETIC**: Video game isometric views, technical drawings, axonometric projection.

### 1. 📐 SKEW TRANSFORMS (30° angles)
Classic isometric projection:

\`\`\`css
.isometric-container {
    transform-style: preserve-3d;
    perspective: 1000px;
}

.iso-box {
    width: 200px;
    height: 200px;
    background: #3498db;
    position: relative;
    transform:
        rotateX(30deg)
        rotateZ(45deg);
}

/* Isometric grid */
.iso-grid {
    display: grid;
    grid-template-columns: repeat(4, 150px);
    gap: 20px;
    transform: skewY(-15deg);
}

.iso-grid-item {
    transform: skewY(15deg); /* Counter-skew content */
    background: white;
    padding: 24px;
    border: 2px solid #000;
}
\`\`\`

### 2. 🎭 FAKE 3D WITH HARD SHADOWS
Simulate depth with shadow layers:

\`\`\`css
.fake-3d {
    position: relative;
    background: #fff;
    padding: 32px;
    border: 2px solid #000;
}

/* Bottom face */
.fake-3d::before {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 10px;
    right: -10px;
    height: 10px;
    background: #666;
    transform: skewX(-45deg);
    z-index: -1;
}

/* Right face */
.fake-3d::after {
    content: '';
    position: absolute;
    top: 10px;
    right: -10px;
    bottom: -10px;
    width: 10px;
    background: #888;
    transform: skewY(-45deg);
    z-index: -1;
}
\`\`\`

### 3. 🎨 LAYERED DEPTH ILLUSION
Stack elements for 3D effect:

\`\`\`css
.iso-stack {
    position: relative;
}

/* Layer 1 (bottom) */
.iso-layer-1 {
    background: #95a5a6;
    padding: 40px;
    transform: translate(20px, 20px);
    z-index: 1;
}

/* Layer 2 (middle) */
.iso-layer-2 {
    background: #7f8c8d;
    padding: 40px;
    transform: translate(10px, 10px);
    z-index: 2;
    margin-top: -150px;
}

/* Layer 3 (top) */
.iso-layer-3 {
    background: #bdc3c7;
    padding: 40px;
    transform: translate(0, 0);
    z-index: 3;
    margin-top: -150px;
}
\`\`\`

### 4. 🎯 AXONOMETRIC PROJECTION
30° angle isometric grid:

\`\`\`css
/* Isometric cube */
.iso-cube {
    width: 100px;
    height: 100px;
    position: relative;
    transform-style: preserve-3d;
}

.iso-face-top {
    width: 100px;
    height: 100px;
    background: #3498db;
    position: absolute;
    transform: rotateX(90deg) translateZ(50px);
}

.iso-face-front {
    width: 100px;
    height: 100px;
    background: #2980b9;
    position: absolute;
    transform: translateZ(50px);
}

.iso-face-right {
    width: 100px;
    height: 100px;
    background: #1a5276;
    position: absolute;
    transform: rotateY(90deg) translateZ(50px);
}

/* Simple 2D isometric */
.iso-simple {
    transform:
        rotateX(60deg)
        rotateZ(-45deg);
    box-shadow:
        10px -10px 0 #666,
        20px -20px 0 #888;
}
\`\`\`

**CRITICAL**: Use overflow: hidden carefully. Test transforms on different browsers. Provide 2D fallback for older browsers.`,
  },
  {
    id: 'gradient-explosion',
    name: 'Gradient Explosion',
    category: 'semi-unleashed',
    description: 'Vibrant multi-stop gradients, color-rich, energetic',
    icon: Palette,
    level: 'semi-unleashed',
    designPrinciples: ['Multi-stop gradients', '5+ color stops', 'Vibrant saturation', 'Overlapping gradients', 'Color energy'],
    promptInstructions: `## 🌈 GRADIENT EXPLOSION - Maximum Color Energy
**DIRECTIVE**: Pack **5+ colors into every gradient**. More is more. Embrace color chaos.
**AESTHETIC**: Rainbow energy, maximum saturation, vibrant overlapping gradients.

### 1. 🎨 MULTI-STOP GRADIENTS (5+ colors)
Complex gradient formulas:

\`\`\`css
.gradient-hero {
    background: linear-gradient(
        135deg,
        #ff0080 0%,
        #ff8c00 20%,
        #40e0d0 40%,
        #7b68ee 60%,
        #ff1493 80%,
        #ffd700 100%
    );
    min-height: 100vh;
}

/* Radial multi-stop */
.gradient-radial {
    background: radial-gradient(
        circle at center,
        #ff006e 0%,
        #fb5607 15%,
        #ffbe0b 30%,
        #8ac926 45%,
        #1982c4 60%,
        #6a4c93 75%,
        #ff006e 100%
    );
}

/* Conic gradient */
.gradient-conic {
    background: conic-gradient(
        from 0deg,
        #ff0080,
        #ff8c00,
        #ffff00,
        #00ff00,
        #00ffff,
        #0080ff,
        #ff00ff,
        #ff0080
    );
}
\`\`\`

### 2. ⚡ HIGH SATURATION
Max vibrant, no pastels:

\`\`\`css
:root {
    --electric-pink: #ff006e;
    --vivid-orange: #fb5607;
    --bright-yellow: #ffbe0b;
    --lime-green: #8ac926;
    --sky-blue: #1982c4;
    --deep-purple: #6a4c93;
}

/* NO desaturated colors */
.vibrant-card {
    background: linear-gradient(
        to bottom right,
        var(--electric-pink),
        var(--vivid-orange),
        var(--bright-yellow)
    );
    filter: saturate(150%); /* Boost saturation */
}

.text-vibrant {
    background: linear-gradient(
        90deg,
        var(--lime-green),
        var(--sky-blue),
        var(--deep-purple)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
\`\`\`

### 3. 🌀 OVERLAPPING GRADIENT LAYERS
Stack gradients for complexity:

\`\`\`css
.layer-gradient {
    position: relative;
    background: linear-gradient(135deg, #ff006e, #fb5607);
}

.layer-gradient::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at top right,
        rgba(138, 201, 38, 0.7),
        transparent 60%
    );
    mix-blend-mode: screen;
}

.layer-gradient::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        225deg,
        rgba(25, 130, 196, 0.5),
        transparent 70%
    );
    mix-blend-mode: multiply;
}

/* Triple gradient overlay */
.triple-gradient {
    background:
        linear-gradient(45deg, rgba(255,0,110,0.8), transparent),
        linear-gradient(135deg, rgba(251,86,7,0.8), transparent),
        linear-gradient(225deg, rgba(138,201,38,0.8), transparent),
        linear-gradient(315deg, rgba(25,130,196,0.8), transparent);
}
\`\`\`

### 4. 💥 COLOR ENERGY
Animated, vibrant, explosive:

\`\`\`css
/* Animated gradient shift */
.energy-gradient {
    background: linear-gradient(
        -45deg,
        #ff006e,
        #fb5607,
        #ffbe0b,
        #8ac926,
        #1982c4,
        #6a4c93
    );
    background-size: 400% 400%;
    animation: gradientShift 8s ease infinite;
}

@keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Pulsing saturation */
.pulse-color {
    animation: saturatePulse 3s ease-in-out infinite;
}

@keyframes saturatePulse {
    0%, 100% { filter: saturate(100%); }
    50% { filter: saturate(200%); }
}

/* Rainbow text */
.rainbow-text {
    background: linear-gradient(
        to right,
        #ff0000,
        #ff7f00,
        #ffff00,
        #00ff00,
        #0000ff,
        #4b0082,
        #9400d3
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 96px;
    font-weight: 900;
}
\`\`\`

**CRITICAL**: Ensure text contrast (4.5:1 minimum). Use white or black text on gradients. Add prefers-reduced-motion for animations.`,
  },
  {
    id: 'minimal-maximalism',
    name: 'Minimal Maximalism',
    category: 'semi-unleashed',
    description: 'Minimal elements but HUGE scale, paradoxical design',
    icon: Sparkles,
    level: 'semi-unleashed',
    designPrinciples: ['Few elements', 'Massive scale', 'Bold simplicity', 'Paradoxical design', 'Statement pieces'],
    promptInstructions: `## ⚡ MINIMAL MAXIMALISM - Less Elements, More Impact
**DIRECTIVE**: Use **3-5 elements maximum** but make them GIGANTIC. Paradoxical simplicity.
**AESTHETIC**: One massive headline, one huge image, maximum impact through minimalism.

### 1. 📏 MASSIVE SCALE (200px+ type)
Impossibly large typography:

\`\`\`css
h1 {
    font-size: clamp(150px, 25vw, 400px);
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.05em;
    margin: 0;
}

/* Single word per viewport */
.word-massive {
    font-size: 320px;
    font-weight: 900;
    line-height: 1;
    text-align: center;
}

/* Numbers as giant design elements */
.number-huge {
    font-size: 600px;
    font-weight: 900;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 4px #000;
}
\`\`\`

### 2. 🎯 VERY FEW ELEMENTS
3-5 elements maximum per screen:

\`\`\`css
.minimal-max-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 80px;
    padding: 80px;
}

/* Screen 1: Just headline */
.screen-1 {
    min-height: 100vh;
    display: grid;
    place-items: center;
}

.screen-1 h1 {
    /* That's it. One element. */
}

/* Screen 2: Headline + subtext */
.screen-2 {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
}

.screen-2 h1 {
    font-size: 240px;
}

.screen-2 p {
    font-size: 24px;
    max-width: 600px;
}
\`\`\`

### 3. 💪 BOLD SIMPLICITY
Maximum impact, minimum complexity:

\`\`\`css
/* Single massive CTA */
.cta-massive {
    font-size: 48px;
    font-weight: 900;
    padding: 60px 120px;
    background: #000;
    color: #fff;
    border: none;
    cursor: pointer;
}

.cta-massive:hover {
    transform: scale(1.05);
}

/* Single huge image */
.image-hero {
    width: 80vw;
    height: 80vh;
    object-fit: cover;
}

/* Massive spacing */
.spacing-huge {
    margin: 200px 0;
}
\`\`\`

### 4. 🎨 STATEMENT DESIGN
Each element makes a statement:

\`\`\`css
/* Monochrome for focus */
body {
    background: #fff;
    color: #000;
}

/* Single accent color used once */
.accent-element {
    background: #ff0000;
    width: 800px;
    height: 800px;
    border-radius: 50%;
    position: fixed;
    top: -400px;
    right: -400px;
    z-index: -1;
}

/* Vertical rhythm with massive gaps */
section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* One element floats alone */
.lone-element {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 280px;
    font-weight: 900;
    opacity: 0.05;
}
\`\`\`

**CRITICAL**: Less is more, but bigger. Each element should command attention. Maintain whitespace. Mobile may need smaller scaling.`,
  },
  {
    id: 'data-visualization',
    name: 'Data Visualization',
    category: 'semi-unleashed',
    description: 'Charts as design, infographic style, quantified aesthetics',
    icon: Grid,
    level: 'semi-unleashed',
    designPrinciples: ['Charts as design', 'Data-driven layouts', 'Infographic style', 'Quantified visuals', 'Graph aesthetics'],
    promptInstructions: `## 📊 DATA VISUALIZATION - Numbers as Design
**DIRECTIVE**: Build interfaces where **charts, graphs, and data ARE the design**. Think Bloomberg meets Tableau.
**AESTHETIC**: Infographic style, quantified everything, data-driven beauty.

### 1. 📈 CHARTS AS PRIMARY DESIGN
Graphs dominate the layout:

\`\`\`css
.chart-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 40px;
    padding: 60px;
}

/* Large chart takes center stage */
.chart-hero {
    width: 100%;
    height: 600px;
    background: linear-gradient(to top, #3498db 60%, transparent 60%);
    position: relative;
}

/* Bar chart visualization */
.bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    height: 400px;
    padding: 40px;
}

.bar {
    flex: 1;
    background: linear-gradient(to top, #2ecc71, #27ae60);
    min-height: 40px;
    position: relative;
    transition: all 0.3s ease;
}

.bar:hover {
    filter: brightness(1.2);
}

.bar-value {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 700;
    font-size: 18px;
}
\`\`\`

### 2. 📊 INFOGRAPHIC LAYOUTS
Data cards and stats everywhere:

\`\`\`css
.stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

.stat-card {
    background: white;
    border: 2px solid #e0e0e0;
    padding: 32px;
    text-align: center;
}

.stat-number {
    font-size: 72px;
    font-weight: 900;
    line-height: 1;
    color: #3498db;
    margin-bottom: 12px;
}

.stat-label {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #666;
}

.stat-change {
    font-size: 18px;
    font-weight: 700;
    margin-top: 8px;
}

.stat-change.positive {
    color: #27ae60;
}

.stat-change.positive::before {
    content: '↑ ';
}

.stat-change.negative {
    color: #e74c3c;
}

.stat-change.negative::before {
    content: '↓ ';
}
\`\`\`

### 3. 📉 QUANTIFIED AESTHETICS
Numbers and data everywhere:

\`\`\`css
/* Progress circles */
.progress-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(
        #3498db 0deg,
        #3498db calc(var(--percentage) * 3.6deg),
        #ecf0f1 calc(var(--percentage) * 3.6deg),
        #ecf0f1 360deg
    );
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-circle::before {
    content: '';
    width: 160px;
    height: 160px;
    background: white;
    border-radius: 50%;
    position: absolute;
}

.progress-value {
    font-size: 48px;
    font-weight: 900;
    z-index: 1;
}

/* Timeline visualization */
.timeline {
    position: relative;
    padding-left: 40px;
}

.timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #3498db;
}

.timeline-item {
    position: relative;
    margin-bottom: 60px;
}

.timeline-item::before {
    content: '';
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3498db;
    position: absolute;
    left: -48px;
    top: 0;
}
\`\`\`

### 4. 🎨 DATA-DRIVEN VISUALS
Let numbers create the design:

\`\`\`css
/* Number backgrounds */
.number-pattern {
    font-size: 240px;
    font-weight: 900;
    position: absolute;
    opacity: 0.03;
    z-index: -1;
}

/* Metric comparison */
.comparison-bars {
    display: flex;
    gap: 24px;
    align-items: flex-end;
    height: 300px;
}

.comparison-bar {
    flex: 1;
    background: linear-gradient(to top, #e74c3c, #c0392b);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
    color: white;
}

.comparison-label {
    font-size: 14px;
    margin-bottom: 8px;
}

.comparison-value {
    font-size: 36px;
    font-weight: 900;
}
\`\`\`

**CRITICAL**: Ensure charts are accessible (provide text alternatives). Use color AND shape to convey information. Maintain readability.`,
  },
  {
    id: 'asymmetric-chaos',
    name: 'Asymmetric Chaos',
    category: 'semi-unleashed',
    description: 'Broken grids, intentional imbalance, controlled randomness',
    icon: Zap,
    level: 'semi-unleashed',
    designPrinciples: ['Broken grids', 'Intentional imbalance', 'Random positioning', 'Controlled chaos', 'No alignment'],
    promptInstructions: `## 💥 ASYMMETRIC CHAOS - Controlled Randomness
**DIRECTIVE**: **Break every grid rule**. Random positioning, no alignment, intentional imbalance.
**AESTHETIC**: David Carson-style chaos, broken layouts, organized disorder.

### 1. 🔥 BROKEN GRIDS
Deliberately destroyed grid systems:

\`\`\`css
.chaos-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 150px);
    gap: 20px;
}

/* Each item breaks the grid differently */
.chaos-item:nth-child(1) {
    grid-column: 1 / 4;
    grid-row: 1 / 2;
    transform: rotate(-3deg);
    margin-top: 20px;
}

.chaos-item:nth-child(2) {
    grid-column: 3 / 6;
    grid-row: 1 / 3;
    transform: rotate(5deg);
    margin-left: -40px; /* Overlaps previous */
}

.chaos-item:nth-child(3) {
    grid-column: 5 / 7;
    grid-row: 2 / 4;
    transform: rotate(-7deg);
    z-index: 10;
}

/* NO perfect alignment */
\`\`\`

### 2. 🎲 RANDOM POSITIONING
Elements scattered intentionally:

\`\`\`css
.random-container {
    position: relative;
    min-height: 100vh;
}

.random-element-1 {
    position: absolute;
    top: 15%;
    left: 12%;
    transform: rotate(-5deg);
}

.random-element-2 {
    position: absolute;
    top: 35%;
    right: 18%;
    transform: rotate(12deg);
}

.random-element-3 {
    position: absolute;
    bottom: 25%;
    left: 45%;
    transform: rotate(-8deg);
}

.random-element-4 {
    position: absolute;
    top: 60%;
    left: 8%;
    transform: rotate(3deg);
}

/* Use different positions for each element */
\`\`\`

### 3. ⚖️ INTENTIONAL IMBALANCE
Deliberately unbalanced layouts:

\`\`\`css
/* Heavy top, light bottom */
.top-heavy {
    display: grid;
    grid-template-rows: 3fr 1fr;
}

/* Asymmetric columns */
.asymmetric-cols {
    display: grid;
    grid-template-columns: 3.2fr 1.3fr 2.1fr; /* Random ratios */
    gap: 15px 35px; /* Different X/Y gaps */
}

/* Off-center content */
.off-center {
    max-width: 800px;
    margin-left: 15%; /* NOT centered */
    margin-right: 25%; /* Different margins */
}

/* Floating elements with random offsets */
.float-chaos {
    margin-top: -60px;
    margin-left: 40px;
    margin-bottom: 20px;
    transform: rotate(-4deg);
}
\`\`\`

### 4. 🚫 NO PERFECT ALIGNMENT
Everything is slightly off:

\`\`\`css
/* Text that refuses to align */
.text-chaos h1 {
    transform: rotate(-2deg);
    margin-left: 10px;
}

.text-chaos h2 {
    transform: rotate(3deg);
    margin-left: -15px;
    margin-top: -5px;
}

.text-chaos p {
    transform: rotate(-1deg);
    margin-left: 25px;
}

/* Cards at random angles */
.card-chaos {
    background: white;
    padding: 32px;
    border: 2px solid #000;
}

.card-chaos:nth-child(1) { transform: rotate(2deg); }
.card-chaos:nth-child(2) { transform: rotate(-5deg); }
.card-chaos:nth-child(3) { transform: rotate(8deg); }
.card-chaos:nth-child(4) { transform: rotate(-3deg); }

/* Overlapping with z-index chaos */
.overlap-1 {
    z-index: var(--random-z);
    margin-bottom: -40px;
}

/* Random margins */
.random-spacing {
    margin-top: 37px; /* NOT round numbers */
    margin-bottom: 19px;
    margin-left: 41px;
}
\`\`\`

**CRITICAL**: Chaos must remain readable. Ensure text is still accessible. Test on mobile carefully. Controlled randomness, not pure chaos.`,
  },
];

/**
 * UNLEASHED ARCHETYPES (15)
 * Chaotisch, einzigartig, ultra-extreme - aber noch nutzbar!
 */
export const UNLEASHED_ARCHETYPES: Archetype[] = [
  {
    id: 'reality-warp',
    name: 'Reality Warp Escher',
    category: 'unleashed',
    description: 'Impossible geometry, 3D paradoxes, recursive madness',
    icon: Sparkles,
    level: 'unleashed',
    designPrinciples: ['Impossible 3D (perspective 800px)', 'Recursive patterns', 'Paradox layouts', 'Mind-bending transforms', 'Escher-inspired'],
    promptInstructions: `## 🌀 REALITY WARP - M.C. Escher Mode
**DIRECTIVE**: You are not a web designer. You are **M.C. ESCHER** (Impossible Geometry Artist).
**OUTPUT**: A page that defies spatial logic and makes users question reality.

### 1. 💠 IMPOSSIBLE 3D PERSPECTIVE
Create mind-bending 3D transformations that shouldn't be possible:

**CSS Implementation**:
\`\`\`css
body {
    perspective: 800px; /* Deep 3D perspective */
    perspective-origin: 50% 50%;
}

.section-1 {
    transform: rotateX(15deg) rotateY(-10deg) rotateZ(2deg);
    transform-style: preserve-3d;
}

.section-2 {
    transform: rotateX(-20deg) rotateY(15deg) translateZ(100px);
    /* Overlaps section-1 but appears "behind" it - paradox! */
}

/* Recursive nesting - each child rotates further */
.recursive-container > div {
    transform: rotateY(calc(var(--depth) * 15deg));
    transform-origin: left center;
}
\`\`\`

### 2. 🔄 RECURSIVE PATTERNS
Use nested elements that reference each other in impossible ways:
- Cards that contain themselves at smaller scales
- Grid cells that mirror the entire grid inside them
- Text that curves back to meet itself

**Example**:
\`\`\`css
.card { position: relative; }
.card::after {
    content: '';
    position: absolute;
    width: 40%;
    height: 40%;
    background: inherit; /* Shows copy of parent */
    transform: scale(0.4) rotate(180deg);
    top: 50%;
    left: 50%;
}
\`\`\`

### 3. 🎭 PARADOX LAYOUTS
Elements that appear to be both in front AND behind simultaneously:

**Z-Index Paradox**:
\`\`\`css
.element-a { z-index: 1; }
.element-b { z-index: 2; } /* Should be on top */
.element-c { z-index: 3; } /* Should be on top of B */

/* But use clip-path to make A appear to overlap C */
.element-a { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
\`\`\`

**CRITICAL**: Maintain overflow-x: hidden on body to prevent layout bugs, but CREATE visual impossibilities within viewport.`,
  },
  {
    id: 'quantum-superposition',
    name: 'Quantum Superposition',
    category: 'unleashed',
    description: 'Multiple states at once, overlapping realities, ambiguity',
    icon: Layers,
    level: 'unleashed',
    designPrinciples: ['Layered opacity (0.4-0.7)', 'Multiple states', 'Ambiguous hierarchy', 'Mix-blend modes', 'Dual existence'],
    promptInstructions: `## ⚛️ QUANTUM SUPERPOSITION - Schrödinger's Web
**DIRECTIVE**: Build a page that exists in **multiple states simultaneously**.
**AESTHETIC**: Everything is both A and B. Neither. Both. Ambiguous hierarchy.

### 1. 🌫️ LAYERED OPACITY STATES
Elements exist in multiple visual states at once:

\`\`\`css
.hero {
    position: relative;
}

.hero::before,
.hero::after {
    content: attr(data-alt-text);
    position: absolute;
    inset: 0;
    opacity: 0.6; /* Semi-transparent existence */
}

.hero::before {
    transform: translateX(-8px) translateY(-8px);
    color: #ff00ff;
    mix-blend-mode: screen;
}

.hero::after {
    transform: translateX(8px) translateY(8px);
    color: #00ffff;
    mix-blend-mode: multiply;
}
\`\`\`

### 2. 🎭 AMBIGUOUS VISUAL HIERARCHY
Is the heading big or small? Both:

\`\`\`css
h1 {
    font-size: 12px; /* Tiny */
    opacity: 0.4;
    position: relative;
}

h1::before {
    content: attr(data-text);
    position: absolute;
    font-size: 120px; /* Massive */
    opacity: 0.3;
    top: -50px;
    left: -20px;
    z-index: -1;
}

/* User can't tell which is the "real" headline */
\`\`\`

### 3. 🔀 MIX-BLEND MODE CHAOS
Layer elements with blend modes to create visual uncertainty:

\`\`\`css
.section:nth-child(1) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    mix-blend-mode: difference;
    opacity: 0.7;
}

.section:nth-child(2) {
    background: linear-gradient(225deg, #f093fb 0%, #f5576c 100%);
    mix-blend-mode: screen;
    opacity: 0.6;
    margin-top: -200px; /* Overlap previous section */
}

/* Sections blend into each other - no clear boundary */
\`\`\`

**CRITICAL**: Keep text readable despite layers - use \`isolation: isolate\` on text containers to prevent blend mode affecting readability.`,
  },
  {
    id: 'glitch-formalism',
    name: 'Glitch Formalism VHS',
    category: 'unleashed',
    description: 'RGB splits, scan lines, digital corruption, embrace errors',
    icon: Zap,
    level: 'unleashed',
    designPrinciples: ['RGB channel splits', 'Scan line overlays', 'Intentional glitches', 'VHS artifacts', 'Digital corruption'],
    promptInstructions: `## 📺 GLITCH FORMALISM - Embrace The Error
**DIRECTIVE**: Build a page that looks like **broken VHS tape** from 1987.
**AESTHETIC**: Data corruption as art. Errors are features.

### 1. 🌈 RGB CHANNEL SEPARATION
Split color channels like analog video corruption:

**Text Glitch Effect**:
\`\`\`css
h1, h2 {
    position: relative;
    text-shadow:
        -3px 0 0 #ff0000,  /* Red channel left */
        3px 0 0 #00ffff;    /* Cyan channel right */
    animation: glitch 3s infinite;
}

@keyframes glitch {
    0%, 100% { text-shadow: -3px 0 #ff0000, 3px 0 #00ffff; }
    33% { text-shadow: 3px 0 #ff0000, -3px 0 #00ffff; }  /* Swap */
    66% { text-shadow: -5px 0 #ff0000, 5px 0 #00ffff; }  /* Intensify */
}
\`\`\`

**Image RGB Split**:
\`\`\`css
img {
    position: relative;
    filter:
        drop-shadow(-4px 0 0 rgba(255,0,0,0.8))
        drop-shadow(4px 0 0 rgba(0,255,255,0.8));
}
\`\`\`

### 2. 📡 SCAN LINE OVERLAY
Add VHS horizontal scan lines across entire page:

\`\`\`css
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.3) 3px,
        rgba(0,0,0,0.3) 4px
    );
    pointer-events: none;
    z-index: 9999;
    animation: scanlines 8s linear infinite;
}

@keyframes scanlines {
    0% { transform: translateY(0); }
    100% { transform: translateY(20px); }
}
\`\`\`

### 3. ⚡ RANDOM CLIP-PATH GLITCHES
Make elements appear corrupted with random rectangular slices:

\`\`\`css
.card:nth-child(2) {
    clip-path: polygon(
        0 0, 100% 0,
        100% 30%, 85% 30%,  /* Horizontal cut */
        85% 70%, 100% 70%,  /* Another cut */
        100% 100%, 0 100%
    );
}

.glitch-text {
    clip-path: inset(0 0 40% 0); /* Cut bottom off */
}
\`\`\`

**CRITICAL**: Keep text readable (4.5:1 contrast) despite glitch effects. Corruption is visual, not functional.`,
  },
  {
    id: 'void-architecture',
    name: 'Void Architecture Zen',
    category: 'unleashed',
    description: '95% emptiness, one element per screen, anti-density',
    icon: Square,
    level: 'unleashed',
    designPrinciples: ['95% whitespace', 'One element/viewport', 'Massive padding (20rem)', 'Anti-density', 'Extreme minimalism'],
    promptInstructions: `## ⬛ VOID ARCHITECTURE - The Anti-Density Manifesto
**DIRECTIVE**: Build the **emptiest possible website**. 95% void, 5% content.
**AESTHETIC**: John Pawson minimalism meets the vacuum of space. Less than less.

### 1. 🌌 EXTREME WHITESPACE (95%+)
One element per viewport - massive emptiness:

\`\`\`css
section {
    min-height: 100vh; /* Full screen per section */
    padding: 20rem 15rem; /* Insane padding */
    display: flex;
    align-items: center;
    justify-content: center;
}

h1 {
    font-size: 48px;
    text-align: center;
    max-width: 600px;
    /* The ONLY element on this screen */
}

/* Next element is 100vh away - extreme scroll */
\`\`\`

### 2. ⚫ ONE ELEMENT PER VIEWPORT
Strict rule: Each screen shows ONLY one thing:

\`\`\`css
.hero-screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
}

.hero-screen > * + * {
    display: none; /* Force single element */
}

/* Screen 1: Just headline */
/* Screen 2: Just subtext (100vh later) */
/* Screen 3: Just CTA button (another 100vh) */
\`\`\`

### 3. 🔲 ANTI-DENSITY SPACING
Massive gaps between everything:

\`\`\`css
p {
    font-size: 16px;
    line-height: 3.5; /* Massive line spacing */
    letter-spacing: 0.5em; /* Massive letter spacing */
    margin-bottom: 10rem; /* Massive margins */
}

button {
    padding: 3rem 6rem; /* Massive button */
    margin: 15rem auto; /* Massive isolation */
    display: block;
}
\`\`\`

**CRITICAL**: This is about negative space as art. Every pixel of whitespace is intentional. Make scrolling feel meditative.`,
  },
  {
    id: 'liquid-mercury',
    name: 'Liquid Mercury Interface',
    category: 'unleashed',
    description: 'Blob morphology, metallic gradients, fluid viscosity',
    icon: Droplet,
    level: 'unleashed',
    designPrinciples: ['Extreme radius (60%+)', 'Metallic gradients', 'Blob shapes', 'Viscous feel', 'Chrome effects'],
    promptInstructions: `## 💧 LIQUID MERCURY - Viscous Blob Interface
**DIRECTIVE**: Build a UI made of **liquid metal**. Everything flows and morphs.
**AESTHETIC**: T-1000 Terminator meets lava lamp. Viscous, metallic, fluid.

### 1. 🫧 EXTREME BLOB MORPHOLOGY
NO straight edges. Everything is an organic blob:

**Asymmetric Border-Radius (The "Blob" Formula)**:
\`\`\`css
.card {
    border-radius: 60% 40% 70% 30% / 40% 60% 30% 70%;
    /* Format: top-left top-right bottom-right bottom-left / vertical radii */
}

.hero {
    border-radius: 73% 27% 48% 52% / 31% 58% 42% 69%;
    /* Each blob is unique - randomize but keep smooth */
}

button {
    border-radius: 40% 60% 50% 50% / 60% 40% 60% 40%;
    padding: 24px 48px; /* Extra padding for blob containment */
}

/* NO rectangles, NO sharp corners anywhere */
.section { border-radius: 50% 50% 0 0 / 20% 20% 0 0; }
\`\`\`

### 2. 🪙 METALLIC CHROME GRADIENTS
Create liquid metal sheen with multi-stop gradients:

**Chrome Effect**:
\`\`\`css
.card {
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 25%,
        #f093fb 50%,
        #4facfe 75%,
        #00f2fe 100%
    );
    position: relative;
}

.card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
        to right,
        rgba(255,255,255,0.3),
        transparent 50%,
        rgba(255,255,255,0.3)
    );
    mix-blend-mode: overlay; /* Creates metallic sheen */
}
\`\`\`

**Mercury Pooling Effect**:
\`\`\`css
.hero {
    background: radial-gradient(
        ellipse at top left,
        #c0c0c0 0%,
        #808080 30%,
        #404040 60%,
        #000000 100%
    );
    box-shadow:
        inset 0 10px 30px rgba(255,255,255,0.5),  /* Top highlight */
        inset 0 -10px 30px rgba(0,0,0,0.5);        /* Bottom shadow */
}
\`\`\`

### 3. 🌊 VISCOUS FLOWING LAYOUT
Elements should feel like they're slowly flowing:

**Overflow Blobs (Safe)**:
\`\`\`css
.container {
    overflow: hidden; /* CRITICAL: Prevent horizontal scroll */
}

.blob-element {
    width: 120%; /* Intentionally oversized */
    margin-left: -10%; /* Pull left to create flow */
    border-radius: 50% 50% 0 0 / 30% 30% 0 0;
}
\`\`\`

**CRITICAL**: All containers MUST have \`overflow-x: hidden\` to prevent layout bugs while maintaining liquid aesthetic.`,
  },
  {
    id: 'dimensional-collapse',
    name: 'Dimensional Collapse',
    category: 'unleashed',
    description: '2D/3D blur, isometric chaos, depth ambiguity',
    icon: Box,
    level: 'unleashed',
    designPrinciples: ['2D/3D mix', 'Isometric violations', 'Fake 3D shadows', 'Depth ambiguity', 'Flat-deep paradox'],
    promptInstructions: `## 🌀 DIMENSIONAL COLLAPSE - 2D/3D Blur
**DIRECTIVE**: **Confuse the eye** by mixing flat 2D with 3D transforms. Is it flat? Is it depth? Both? Neither?
**AESTHETIC**: Isometric meets perspective, dimensional ambiguity, visual paradox.

### 1. 🎭 2D/3D混合 (2D/3D Mix)
Combine flat and dimensional elements:

\`\`\`css
/* Flat element with 3D shadow */
.flat-3d {
    background: #fff;
    padding: 40px;
    border: 3px solid #000;
    /* Flat appearance */

    /* But 3D shadow */
    box-shadow:
        10px 0 0 #666,
        0 10px 0 #888,
        10px 10px 0 #444;
    transform: none; /* Stays flat */
}

/* 3D element that looks flat */
.three-d-flat {
    transform: rotateX(60deg) rotateZ(-45deg);
    /* Looks 3D but no depth cues */
    box-shadow: none; /* NO shadow to confuse eye */
}

/* Mix isometric with perspective */
.dimensional-mix {
    perspective: 1000px;
}

.dimensional-mix .item-1 {
    transform: skewY(-15deg); /* Isometric */
}

.dimensional-mix .item-2 {
    transform: rotateY(30deg); /* 3D perspective */
}
\`\`\`

### 2. ⚡ ISOMETRIC VIOLATIONS
Break isometric rules with 3D:

\`\`\`css
/* Start isometric */
.iso-container {
    transform: rotateX(60deg) rotateZ(-45deg);
}

/* Then violate with real 3D */
.iso-violation {
    transform:
        rotateX(60deg) rotateZ(-45deg) /* Isometric base */
        translateZ(100px); /* 3D depth - breaks iso! */
}

/* Isometric grid with 3D elements */
.iso-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    transform: skewY(-15deg);
}

.iso-grid-item {
    transform: skewY(15deg) rotateX(45deg); /* Counter + 3D */
}
\`\`\`

### 3. 🎨 FAKE VS REAL SHADOWS
Mix flat shadows with realistic blur:

\`\`\`css
/* Hard isometric shadow */
.hard-shadow {
    box-shadow: 10px -10px 0 #000;
}

/* Soft 3D shadow on same page */
.soft-shadow {
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
}

/* Combine both (visual confusion) */
.mixed-shadow {
    box-shadow:
        8px 8px 0 #000, /* Hard isometric */
        0 20px 40px rgba(0,0,0,0.2); /* Soft realistic */
}
\`\`\`

### 4. 🌫️ DEPTH AMBIGUITY
Is it close or far?

\`\`\`css
/* Large but looks distant */
.ambiguous-1 {
    width: 600px;
    height: 600px;
    opacity: 0.3; /* Looks far */
    filter: blur(2px); /* Atmospheric perspective */
    z-index: 1;
}

/* Small but looks close */
.ambiguous-2 {
    width: 200px;
    height: 200px;
    opacity: 1; /* Looks near */
    filter: none;
    box-shadow: 0 30px 60px rgba(0,0,0,0.4); /* Strong shadow */
    z-index: 10;
    transform: scale(0.8) translateZ(100px); /* Confusing! */
}

/* Perspective that contradicts size */
.paradox-depth {
    transform: perspective(500px) rotateY(45deg) scale(1.5);
    /* Huge but rotated away - which wins? */
}
\`\`\`

**CRITICAL**: Intentional confusion, but keep text readable. Use overflow-x: hidden. Test on different devices for transform support.`,
  },
  {
    id: 'algorithmic-fractals',
    name: 'Algorithmic Fractals',
    category: 'unleashed',
    description: 'Fibonacci spirals, golden ratios, recursive grids',
    icon: Grid,
    level: 'unleashed',
    designPrinciples: ['Fibonacci sequences', 'Golden ratio (1.618)', 'Recursive grids', 'Fractal patterns', 'Mathematical beauty'],
    promptInstructions: `## 🌿 ALGORITHMIC FRACTALS - Mathematical Beauty
**DIRECTIVE**: Build layouts using **Fibonacci sequences and golden ratios**. Nature's mathematics.
**AESTHETIC**: Recursive patterns, fractal grids, mathematical harmony, natural proportions.

### 1. 🔢 FIBONACCI SPACING SEQUENCES
Use Fibonacci numbers for all spacing:

\`\`\`css
:root {
    /* Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144... */
    --fib-1: 8px;
    --fib-2: 13px;
    --fib-3: 21px;
    --fib-4: 34px;
    --fib-5: 55px;
    --fib-6: 89px;
    --fib-7: 144px;
}

.spacing-fib-1 { margin: var(--fib-1); }
.spacing-fib-2 { margin: var(--fib-2); }
.spacing-fib-3 { margin: var(--fib-3); }
.spacing-fib-4 { margin: var(--fib-4); }
.spacing-fib-5 { margin: var(--fib-5); }

/* Typography using Fibonacci */
h1 { font-size: 55px; line-height: 89px; } /* Fib numbers */
h2 { font-size: 34px; line-height: 55px; }
h3 { font-size: 21px; line-height: 34px; }
p { font-size: 13px; line-height: 21px; }

/* Padding in Fibonacci */
.card-fib {
    padding: 34px 55px; /* Consecutive Fib numbers */
}
\`\`\`

### 2. 📐 GOLDEN RATIO GRIDS (1:1.618)
Layouts based on φ (phi):

\`\`\`css
:root {
    --phi: 1.618; /* Golden ratio */
}

/* Golden ratio grid */
.golden-grid {
    display: grid;
    grid-template-columns: 1fr var(--phi)fr; /* 1:1.618 */
    gap: 21px;
}

/* Nested golden ratio */
.golden-nested {
    display: grid;
    grid-template-columns: 1fr var(--phi)fr;
}

.golden-nested .left {
    display: grid;
    grid-template-rows: 1fr var(--phi)fr; /* Vertical golden ratio */
}

/* Golden spiral layout */
.golden-spiral {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(5, 1fr);
}

.spiral-1 { grid-column: 1 / 6; grid-row: 1 / 6; } /* 5x5 */
.spiral-2 { grid-column: 6 / 9; grid-row: 1 / 4; } /* 3x3 */
.spiral-3 { grid-column: 6 / 9; grid-row: 4 / 6; } /* 2x2 */
/* Creates Fibonacci spiral */
\`\`\`

### 3. 🔄 RECURSIVE NESTED LAYOUTS
Self-similar patterns at different scales:

\`\`\`css
/* Container with nested children */
.fractal-container {
    padding: 55px;
    border: 2px solid #000;
}

.fractal-container .fractal-child {
    padding: 34px;
    border: 2px solid #666;
    margin: 21px;
}

.fractal-child .fractal-grandchild {
    padding: 21px;
    border: 2px solid #999;
    margin: 13px;
}

.fractal-grandchild .fractal-great-grandchild {
    padding: 13px;
    border: 2px solid #ccc;
    margin: 8px;
}

/* Each level uses next Fibonacci number */
\`\`\`

### 4. 🌀 FRACTAL PATTERNS
Repeating self-similar patterns:

\`\`\`css
/* Fractal grid */
.fractal-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 8px;
}

/* Large square (8x8) */
.fractal-1 { grid-column: 1 / 9; grid-row: 1 / 9; }

/* Contains 5x5 square */
.fractal-2 { grid-column: 1 / 6; grid-row: 1 / 6; }

/* Contains 3x3 square */
.fractal-3 { grid-column: 1 / 4; grid-row: 1 / 4; }

/* Contains 2x2 square */
.fractal-4 { grid-column: 1 / 3; grid-row: 1 / 3; }

/* Fibonacci spiral emerges */

/* Recursive border pattern */
.recursive-border {
    border: 8px solid #000;
    padding: 13px;
}

.recursive-border::before {
    content: '';
    position: absolute;
    inset: 21px;
    border: 5px solid #666;
}

.recursive-border::after {
    content: '';
    position: absolute;
    inset: 34px;
    border: 3px solid #999;
}
\`\`\`

**CRITICAL**: Strict mathematical ratios only. NO arbitrary numbers. Everything is Fibonacci or golden ratio. Maintain harmony through math.`,
  },
  {
    id: 'noise-driven',
    name: 'Noise-Driven Chaos',
    category: 'unleashed',
    description: 'Perlin noise layouts, organic randomness, scattered grids',
    icon: Zap,
    level: 'unleashed',
    designPrinciples: ['Noise-based positioning', 'Organic clustering', 'Random offsets', 'Natural distribution', 'Controlled chaos'],
    promptInstructions: `## 🎲 NOISE-DRIVEN CHAOS - Organic Randomness
**DIRECTIVE**: Use **Perlin noise-style randomness** for positioning. Natural chaos, not mechanical randomness.
**AESTHETIC**: Organic scatter, smooth random offsets, nature's disorder.

### 1. 🌿 ORGANIC CLUSTERING
Elements cluster naturally, not on grid:

\`\`\`css
.noise-container {
    position: relative;
    min-height: 100vh;
}

/* Apply smooth random offsets */
.noise-item-1 {
    position: absolute;
    top: calc(20% + 12px);
    left: calc(15% - 8px);
    transform: translate(-5px, 7px);
}

.noise-item-2 {
    position: absolute;
    top: calc(22% - 5px);
    left: calc(18% + 15px);
    transform: translate(3px, -4px);
}

.noise-item-3 {
    position: absolute;
    top: calc(25% + 8px);
    left: calc(14% + 20px);
    transform: translate(-7px, 2px);
}

/* Items cluster near each other but irregularly */
\`\`\`

### 2. 🎨 RANDOM OFFSETS (5-50px)
Smooth displacement:

\`\`\`css
/* Small noise (5-15px) */
.noise-sm {
    transform: translate(
        calc(var(--noise-x) * 15px),
        calc(var(--noise-y) * 15px)
    );
}

/* Medium noise (15-30px) */
.noise-md {
    transform: translate(
        calc(var(--noise-x) * 30px),
        calc(var(--noise-y) * 30px)
    );
}

/* Large noise (30-50px) */
.noise-lg {
    transform: translate(
        calc(var(--noise-x) * 50px),
        calc(--noise-y) * 50px)
    );
}

/* Grid with noise offset */
.noisy-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
}

.noisy-grid-item:nth-child(1) { transform: translate(12px, -8px); }
.noisy-grid-item:nth-child(2) { transform: translate(-5px, 15px); }
.noisy-grid-item:nth-child(3) { transform: translate(18px, 3px); }
.noisy-grid-item:nth-child(4) { transform: translate(-10px, -12px); }
.noisy-grid-item:nth-child(5) { transform: translate(7px, 20px); }
.noisy-grid-item:nth-child(6) { transform: translate(-15px, -5px); }
/* Each has unique offset */
\`\`\`

### 3. 🌊 PERLIN-LIKE SMOOTH RANDOMNESS
Gradual variation, not jarring jumps:

\`\`\`css
/* Smooth offset curves */
.smooth-noise {
    position: relative;
}

/* Adjacent elements have similar offsets */
.smooth-item-1 { transform: translate(5px, 8px); }
.smooth-item-2 { transform: translate(7px, 10px); } /* Close to prev */
.smooth-item-3 { transform: translate(9px, 7px); } /* Gradual change */
.smooth-item-4 { transform: translate(12px, 5px); }
.smooth-item-5 { transform: translate(8px, 3px); }

/* NO sudden jumps */
/* BAD: translate(5px, 5px) → translate(50px, 50px) */
/* GOOD: translate(5px, 5px) → translate(7px, 8px) → translate(10px, 12px) */

/* Smooth rotation variation */
.rotate-noise:nth-child(1) { transform: rotate(2deg); }
.rotate-noise:nth-child(2) { transform: rotate(4deg); }
.rotate-noise:nth-child(3) { transform: rotate(1deg); }
.rotate-noise:nth-child(4) { transform: rotate(5deg); }
.rotate-noise:nth-child(5) { transform: rotate(3deg); }
/* Gradual angle changes */
\`\`\`

### 4. 🎯 NATURAL DISTRIBUTION
Scatter like nature (not uniform):

\`\`\`css
/* Dense clusters + sparse areas */
.natural-distribution {
    position: relative;
}

/* Cluster 1 (dense) */
.cluster-1-item-1 { top: 20%; left: 30%; }
.cluster-1-item-2 { top: 22%; left: 32%; }
.cluster-1-item-3 { top: 24%; left: 28%; }
.cluster-1-item-4 { top: 21%; left: 35%; }

/* Sparse area (gap) */

/* Cluster 2 (sparse) */
.cluster-2-item-1 { top: 60%; left: 70%; }
.cluster-2-item-2 { top: 65%; left: 75%; }

/* Irregular spacing feels natural */

/* Size variation with position */
.noise-card {
    width: calc(200px + var(--noise-size) * 100px);
    opacity: calc(0.6 + var(--noise-opacity) * 0.4);
}
\`\`\`

**CRITICAL**: Use CSS custom properties for noise values. Pre-calculate smooth random offsets. Keep text readable despite chaos. Test overlap issues.`,
  },
  {
    id: 'gravity-defying',
    name: 'Gravity-Defying Stacks',
    category: 'unleashed',
    description: 'Heavy floats, light sinks, inverted physics, imbalance',
    icon: Zap,
    level: 'unleashed',
    designPrinciples: ['Inverted weight', 'Heavy elements float', 'Top-heavy layouts', 'Impossible balance', 'Visual tension'],
    promptInstructions: `## ⚖️ GRAVITY-DEFYING STACKS - Inverted Physics
**DIRECTIVE**: **Defy visual gravity**. Heavy elements float at top, light elements sink to bottom.
**AESTHETIC**: Impossible balance, visual tension, inverted expectations, top-heavy chaos.

### 1. ⬆️ HEAVY ELEMENTS FLOAT AT TOP
Large, dark, massive elements positioned high:

\`\`\`css
/* Heavy header floats */
.heavy-top {
    width: 100%;
    height: 400px;
    background: #000;
    font-size: 120px;
    font-weight: 900;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5); /* Heavy shadow */
}

/* Massive element at top */
.giant-header {
    width: 90vw;
    height: 600px;
    background: linear-gradient(to bottom, #000, #333);
    margin: 0 auto 40px auto;
    border-radius: 0 0 40px 40px; /* Bottom-heavy shape but positioned top */
}

/* Large dark blocks at top of sections */
.section-heavy-top {
    display: flex;
    flex-direction: column;
}

.section-heavy-top .heavy-block {
    width: 100%;
    height: 300px;
    background: #1a1a1a;
    order: -1; /* Floats to top */
}
\`\`\`

### 2. ⬇️ LIGHT ELEMENTS SINK TO BOTTOM
Small, bright, minimal elements positioned low:

\`\`\`css
/* Tiny footer at bottom */
.light-bottom {
    width: 200px;
    height: 40px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    font-size: 12px;
    margin: 0 auto;
    text-align: center;
}

/* Small bright elements sink */
.floaty-cards {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.light-card {
    width: 150px;
    height: 80px;
    background: #f0f0f0;
    align-self: flex-end;
    margin-top: auto; /* Pushes to bottom */
}

/* Inverted size hierarchy */
.inverted-stack > *:first-child {
    font-size: 96px;
    font-weight: 900;
    color: #000;
}

.inverted-stack > *:last-child {
    font-size: 14px;
    font-weight: 300;
    color: #999;
}
\`\`\`

### 3. ⚡ TOP-HEAVY IMBALANCE
Visually unstable, about to tip:

\`\`\`css
/* Pyramid inverted */
.inverted-pyramid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
}

.inverted-pyramid .level-1 {
    width: 800px;
    height: 200px;
    background: #000;
}

.inverted-pyramid .level-2 {
    width: 600px;
    height: 150px;
    background: #333;
}

.inverted-pyramid .level-3 {
    width: 400px;
    height: 100px;
    background: #666;
}

.inverted-pyramid .level-4 {
    width: 200px;
    height: 50px;
    background: #999;
}

/* Gets smaller as it goes down - unstable! */
\`\`\`

### 4. 🎭 IMPOSSIBLE BALANCE
Visual tension through weight distribution:

\`\`\`css
/* Heavy element balanced on small one */
.impossible-balance {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.small-base {
    width: 100px;
    height: 20px;
    background: #ccc;
    order: 2; /* Bottom */
}

.heavy-top-block {
    width: 600px;
    height: 400px;
    background: #000;
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    order: 1; /* Top */
    /* Physically impossible - big on small */
}

/* Offset weight creates tension */
.offset-heavy {
    width: 500px;
    height: 300px;
    background: #000;
    margin-left: 200px; /* Off-center heavy mass */
}

.offset-light {
    width: 100px;
    height: 50px;
    background: #fff;
    margin-left: -100px; /* Tries to balance */
}

/* Cantilever effect */
.cantilever {
    width: 400px;
    height: 200px;
    background: #1a1a1a;
    position: relative;
    left: 300px; /* Hangs over edge */
}
\`\`\`

**CRITICAL**: Create visual tension without breaking layout. Ensure content remains accessible. Dark elements need sufficient contrast for text.`,
  },
  {
    id: 'mono-element',
    name: 'Mono-Element Design',
    category: 'unleashed',
    description: 'ONE shape for everything (circles OR squares only)',
    icon: Circle,
    level: 'unleashed',
    designPrinciples: ['Single shape', 'All circles (50%) OR all squares (0%)', 'Variation via size/color', 'Strict constraint', 'Discipline'],
    promptInstructions: `## ⭕ MONO-ELEMENT DESIGN - One Shape Only
**DIRECTIVE**: Choose ONE shape (circles OR squares) and use it for **EVERYTHING**. Ultimate constraint.
**AESTHETIC**: Brutalist discipline, radical simplification, obsessive consistency.

### 1. ⭕ ALL CIRCLES (border-radius: 50%)
Everything becomes a circle:

\`\`\`css
/* Global circle enforcement */
* {
    border-radius: 50% !important;
}

/* Buttons are circles */
button {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: #000;
    color: #fff;
    font-size: 18px;
    text-align: center;
}

/* Cards are circles */
.card {
    width: 400px;
    height: 400px;
    border-radius: 50%;
    padding: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: #fff;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

/* Images are circles */
img {
    border-radius: 50%;
    object-fit: cover;
}

/* Inputs are circles */
input {
    border-radius: 50%;
    padding: 20px 40px;
    text-align: center;
}

/* Sections are circles */
.section {
    border-radius: 50%;
    max-width: 800px;
    height: 800px;
    margin: 100px auto;
    padding: 150px 100px;
}
\`\`\`

### 2. ⬛ ALL SQUARES (border-radius: 0%)
OR everything is a perfect square:

\`\`\`css
/* Global square enforcement */
* {
    border-radius: 0 !important;
}

/* Square buttons */
button {
    width: 200px;
    height: 200px;
    background: #000;
    color: #fff;
    border: none;
}

/* Square cards */
.card {
    width: 400px;
    height: 400px;
    background: #fff;
    padding: 60px;
    box-shadow: 8px 8px 0 #000;
}

/* Square images */
img {
    width: 300px;
    height: 300px;
    object-fit: cover;
}

/* Square inputs */
input {
    width: 200px;
    height: 200px;
    padding: 20px;
    text-align: center;
}

/* Square sections */
.section {
    width: 800px;
    height: 800px;
    margin: 80px auto;
    padding: 100px;
}
\`\`\`

### 3. 🎨 VARIATION VIA SIZE ONLY
Same shape, different sizes:

\`\`\`css
/* Circles of varying sizes */
.circle-xs {
    width: 80px;
    height: 80px;
    border-radius: 50%;
}

.circle-sm {
    width: 150px;
    height: 150px;
    border-radius: 50%;
}

.circle-md {
    width: 300px;
    height: 300px;
    border-radius: 50%;
}

.circle-lg {
    width: 500px;
    height: 500px;
    border-radius: 50%;
}

.circle-xl {
    width: 800px;
    height: 800px;
    border-radius: 50%;
}

/* Create hierarchy through size only */
\`\`\`

### 4. 🌈 VARIATION VIA COLOR ONLY
Same shape, different colors:

\`\`\`css
/* Color variation */
.mono-black {
    background: #000;
    color: #fff;
}

.mono-white {
    background: #fff;
    color: #000;
    border: 3px solid #000;
}

.mono-red {
    background: #ff0000;
    color: #fff;
}

.mono-blue {
    background: #0000ff;
    color: #fff;
}

.mono-yellow {
    background: #ffff00;
    color: #000;
}

/* Gradient circles */
.mono-gradient {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
}

/* All same shape, varied color */
.mono-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
}

.mono-grid > * {
    width: 200px;
    height: 200px;
    border-radius: 50%; /* OR 0% for squares */
}
\`\`\`

**CRITICAL**: Strict shape discipline. NO exceptions. If circles, EVERYTHING is 50% radius. If squares, EVERYTHING is 0% radius. Vary only size and color.`,
  },
  {
    id: 'typographic-brutalism',
    name: 'Typographic Brutalism',
    category: 'unleashed',
    description: 'Only text, no graphics, ASCII art, raw HTML aesthetic',
    icon: Type,
    level: 'unleashed',
    designPrinciples: ['Text only', 'No images/graphics', 'Monospace fonts', 'ASCII borders', 'Terminal aesthetic'],
    promptInstructions: `## 📟 TYPOGRAPHIC BRUTALISM - Text-Only Terminal
**DIRECTIVE**: **ZERO images, ZERO graphics**. Only raw text, ASCII art, monospace fonts.
**AESTHETIC**: 1990s terminal, hacker aesthetic, brutalist minimalism, plain text beauty.

### 1. 📝 TEXT ONLY (NO images/graphics)
Pure text interface:

\`\`\`css
/* NO img tags allowed */
img { display: none !important; }

/* NO background images */
* {
    background-image: none !important;
}

/* Everything is text */
body {
    font-family: 'Courier New', 'Courier', monospace;
    background: #000;
    color: #00ff00; /* Terminal green */
    padding: 40px;
    line-height: 1.6;
}

/* Headers are just text */
h1 {
    font-size: 32px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 20px;
}

h1::before {
    content: '>> ';
}

h2::before {
    content: '> ';
}
\`\`\`

### 2. 🔤 MONOSPACE FONTS ONLY
Terminal aesthetic:

\`\`\`css
/* Enforce monospace globally */
* {
    font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace !important;
}

body {
    font-size: 16px;
    line-height: 1.5;
    letter-spacing: 0.05em;
}

/* Code-like formatting */
.terminal {
    background: #000;
    color: #00ff00;
    padding: 20px;
    border: 2px solid #00ff00;
}

.terminal::before {
    content: '$ ';
    color: #00ff00;
}

/* ASCII loading bars */
.progress-ascii::after {
    content: '[##########----------] 50%';
    display: block;
    font-family: monospace;
}
\`\`\`

### 3. 🎨 ASCII ART BORDERS
Text-based decorations:

\`\`\`css
/* ASCII box borders */
.ascii-box {
    border: none;
    position: relative;
    padding: 40px;
}

.ascii-box::before {
    content: '+' var(--repeat-dash) '+\\A'
             '|' '                    ' '|\\A'
             '+' var(--repeat-dash) '+';
    white-space: pre;
    font-family: monospace;
    position: absolute;
    top: 0;
    left: 0;
}

/* Simple border made of characters */
.text-border-top::before {
    content: '=====================================';
    display: block;
    margin-bottom: 16px;
}

.text-border-bottom::after {
    content: '=====================================';
    display: block;
    margin-top: 16px;
}

/* Corner brackets */
.bracket-box::before {
    content: '┌─────────────────────────────────┐';
    display: block;
}

.bracket-box::after {
    content: '└─────────────────────────────────┘';
    display: block;
}

/* ASCII arrows */
.arrow-right::after {
    content: ' ──────▶';
}

.arrow-down::after {
    content: '\\A        │\\A        │\\A        ▼';
    white-space: pre;
}
\`\`\`

### 4. 💻 RAW HTML AESTHETIC
Unstyled, brutalist approach:

\`\`\`css
/* Minimal styling */
body {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    background: #fff;
    color: #000;
    font-family: monospace;
}

/* Plain links */
a {
    color: #0000ff;
    text-decoration: underline;
}

a:visited {
    color: #800080;
}

/* Simple lists */
ul {
    list-style-type: none;
    padding-left: 0;
}

ul li::before {
    content: '* ';
}

ol li::before {
    content: counter(li) '. ';
    counter-increment: li;
}

/* Text-based buttons */
button {
    background: none;
    border: 2px solid #000;
    padding: 10px 20px;
    font-family: monospace;
    cursor: pointer;
}

button::before {
    content: '[ ';
}

button::after {
    content: ' ]';
}

/* Plain tables */
table {
    border-collapse: collapse;
    width: 100%;
}

td, th {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
}

/* Pre-formatted code blocks */
pre {
    background: #f0f0f0;
    padding: 20px;
    overflow-x: auto;
    border-left: 4px solid #000;
}

/* ASCII art logo */
.logo-ascii {
    font-size: 10px;
    line-height: 1;
    white-space: pre;
}

.logo-ascii::before {
    content: '  ___  ___  ___  ___  \\A / _ \\/ _ \\/ _ \\/ _ \\ \\A| | | | | | | | | |\\A| |_| | |_| |_| |_|\\A \\___/\\___/\\___/\\___/';
}
\`\`\`

**CRITICAL**: Absolutely NO images. NO SVGs. NO background images. Only text and ASCII characters. Maintain accessibility with semantic HTML.`,
  },
  {
    id: 'synesthetic-grid',
    name: 'Synesthetic Grid',
    category: 'unleashed',
    description: 'Colors "sound", cross-sensory, unexpected pairings',
    icon: Palette,
    level: 'unleashed',
    designPrinciples: ['Cross-sensory colors', 'Break color psychology', 'Unexpected pairings', 'Sensory confusion', 'Synesthesia'],
    promptInstructions: `## 🌀 SYNESTHETIC GRID - Sensory Cross-Wiring
**DIRECTIVE**: **Break all color psychology rules**. Red = calm, green = danger, blue = warning.
**AESTHETIC**: Intentional confusion, cross-sensory mapping, unexpected pairings.

### 1. 🎨 INVERTED COLOR PSYCHOLOGY
Use colors opposite to their meaning:

\`\`\`css
/* RED for calm/safe (normally danger) */
.success {
    background: #ff0000;
    color: #fff;
}

.calm-section {
    background: linear-gradient(135deg, #ff0000, #ff4444);
}

button.primary {
    background: #ff0000; /* Red for primary action */
}

/* GREEN for danger/stop (normally safe) */
.error {
    background: #00ff00;
    color: #000;
}

.warning {
    background: #00ff00;
    border: 3px solid #00aa00;
}

.stop-button {
    background: #00ff00;
    color: #000;
}

/* BLUE for urgency (normally calm) */
.urgent {
    background: #0000ff;
    color: #fff;
    animation: pulse 0.5s infinite;
}

.alert {
    background: #0080ff;
    box-shadow: 0 0 20px #0080ff;
}
\`\`\`

### 2. ⚡ BREAK COLOR-FUNCTION PAIRINGS
Unexpected associations:

\`\`\`css
/* Links are RED (not blue) */
a {
    color: #ff0000;
    text-decoration: none;
}

a:hover {
    color: #ff6666;
}

/* Positive numbers are GRAY */
.positive {
    color: #808080;
}

/* Negative numbers are YELLOW */
.negative {
    color: #ffff00;
    font-weight: 900;
}

/* Headers use alarm colors */
h1 {
    color: #ff6600; /* Orange alarm */
    background: #000;
    padding: 20px;
}

/* Body text uses attention colors */
p {
    color: #ff00ff; /* Magenta */
}

/* Disabled state is BRIGHT */
button:disabled {
    background: #ffff00;
    color: #ff00ff;
    opacity: 1; /* NOT faded */
}

/* Active state is MUTED */
button:active {
    background: #cccccc;
    color: #666666;
}
\`\`\`

### 3. 🔀 CROSS-SENSORY CONFUSION
Temperature vs color reversed:

\`\`\`css
/* Cold colors for hot things */
.hot-section {
    background: linear-gradient(135deg, #00ffff, #0080ff); /* Cool colors */
}

/* Warm colors for cold things */
.cold-section {
    background: linear-gradient(135deg, #ff6600, #ff0000); /* Warm colors */
}

/* Heavy elements are LIGHT colored */
.heavy-card {
    width: 600px;
    height: 400px;
    background: #f0f0f0; /* Light */
    box-shadow: none; /* No weight */
}

/* Light elements are DARK colored */
.light-badge {
    width: 60px;
    height: 30px;
    background: #000000; /* Dark */
    box-shadow: 0 20px 40px rgba(0,0,0,0.8); /* Heavy shadow */
}

/* Fast is DARK (slow colors) */
.fast-animation {
    animation: move 0.3s ease;
    color: #4a4a4a; /* Muted */
}

/* Slow is BRIGHT (fast colors) */
.slow-animation {
    animation: move 5s ease;
    color: #ff00ff; /* Vibrant */
}
\`\`\`

### 4. 💫 SENSORY CONFUSION
Mix tactile, visual, and emotional cues wrong:

\`\`\`css
/* Soft shapes with hard colors */
.soft {
    border-radius: 50%;
    background: #ff0000; /* Hard, aggressive color */
    box-shadow: 0 0 30px #ff0000;
}

/* Hard shapes with soft colors */
.hard {
    border-radius: 0;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    background: #ffd4e5; /* Soft, gentle color */
}

/* Happy state uses sad colors */
.happy {
    background: #1a1a1a; /* Dark, moody */
    color: #666666; /* Muted gray */
}

/* Sad state uses happy colors */
.sad {
    background: #ffff00; /* Bright yellow */
    color: #ff00ff; /* Vibrant magenta */
}

/* Important uses dismissive styling */
.important {
    font-size: 12px; /* Small */
    opacity: 0.5; /* Faded */
    color: #cccccc; /* Low contrast */
}

/* Dismissive uses important styling */
.dismissive {
    font-size: 48px; /* Large */
    font-weight: 900;
    color: #ff0000; /* Attention color */
    text-transform: uppercase;
}
\`\`\`

**CRITICAL**: This is intentionally confusing. Add ARIA labels for accessibility. Users rely on color psychology - breaking it requires clear text labels. Maintain 4.5:1 contrast.`,
  },
  {
    id: 'crystalline-facets',
    name: 'Crystalline Facets',
    category: 'unleashed',
    description: 'Gem cuts, prismatic refraction, multi-angle gradients',
    icon: Diamond,
    level: 'unleashed',
    designPrinciples: ['Polygonal shapes', 'Faceted surfaces', 'Prismatic gradients', 'Gem aesthetics', 'Light refraction'],
    promptInstructions: `## 💎 CRYSTALLINE FACETS - Gem Cut Geometry
**DIRECTIVE**: Every element is a **cut gemstone**. Polygonal facets, prismatic refraction, diamond aesthetics.
**AESTHETIC**: Jewelry design, gem cuts, prismatic light, faceted surfaces.

### 1. 💠 POLYGONAL CLIP-PATH (Gem Cuts)
Complex polygon shapes:

\`\`\`css
/* Diamond shape */
.diamond {
    clip-path: polygon(
        50% 0%,
        80% 20%,
        100% 50%,
        80% 80%,
        50% 100%,
        20% 80%,
        0% 50%,
        20% 20%
    );
    background: linear-gradient(135deg, #667eea, #764ba2);
}

/* Emerald cut */
.emerald-cut {
    clip-path: polygon(
        25% 0%,
        75% 0%,
        100% 25%,
        100% 75%,
        75% 100%,
        25% 100%,
        0% 75%,
        0% 25%
    );
}

/* Brilliant cut (multi-facet) */
.brilliant {
    clip-path: polygon(
        50% 0%,
        65% 10%,
        80% 15%,
        90% 30%,
        95% 50%,
        90% 70%,
        80% 85%,
        65% 90%,
        50% 100%,
        35% 90%,
        20% 85%,
        10% 70%,
        5% 50%,
        10% 30%,
        20% 15%,
        35% 10%
    );
}

/* Trillion cut */
.trillion {
    clip-path: polygon(
        50% 5%,
        95% 80%,
        5% 80%
    );
}
\`\`\`

### 2. ✨ MULTI-ANGLE GRADIENTS (Facets)
Each face has its own gradient:

\`\`\`css
.faceted-gem {
    position: relative;
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #667eea, #764ba2);
}

/* Top facet */
.faceted-gem::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 50%;
    background: linear-gradient(45deg, rgba(255,255,255,0.4), transparent);
    clip-path: polygon(0 0, 100% 0, 50% 100%);
}

/* Right facet */
.faceted-gem::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 50%;
    background: linear-gradient(135deg, rgba(0,0,0,0.3), transparent);
    clip-path: polygon(100% 0, 100% 100%, 0 50%);
}

/* Multi-facet card */
.gem-card {
    background:
        linear-gradient(30deg, rgba(102,126,234,0.9), transparent 60%),
        linear-gradient(120deg, rgba(118,75,162,0.9), transparent 60%),
        linear-gradient(210deg, rgba(240,147,251,0.9), transparent 60%),
        linear-gradient(300deg, rgba(79,172,254,0.9), transparent 60%);
}
\`\`\`

### 3. 🌈 PRISMATIC COLOR SPLITS
Rainbow refraction effects:

\`\`\`css
/* Prismatic text */
.prism-text {
    font-size: 96px;
    font-weight: 900;
    position: relative;
}

/* Red channel */
.prism-text::before {
    content: attr(data-text);
    position: absolute;
    top: -2px;
    left: -2px;
    color: rgba(255, 0, 0, 0.7);
    z-index: 1;
}

/* Blue channel */
.prism-text::after {
    content: attr(data-text);
    position: absolute;
    top: 2px;
    left: 2px;
    color: rgba(0, 0, 255, 0.7);
    z-index: 1;
}

/* Rainbow gradient */
.prismatic-gradient {
    background: linear-gradient(
        to right,
        #ff0000 0%,
        #ff7f00 14%,
        #ffff00 28%,
        #00ff00 42%,
        #0000ff 57%,
        #4b0082 71%,
        #9400d3 85%,
        #ff0000 100%
    );
}

/* Refraction effect */
.refraction {
    filter: hue-rotate(0deg);
    animation: refract 4s linear infinite;
}

@keyframes refract {
    0%, 100% { filter: hue-rotate(0deg); }
    50% { filter: hue-rotate(180deg); }
}
\`\`\`

### 4. 💎 DIAMOND SHAPES EVERYWHERE
Faceted geometric patterns:

\`\`\`css
/* Diamond grid */
.diamond-grid {
    display: grid;
    grid-template-columns: repeat(4, 200px);
    gap: 40px;
    transform: rotate(45deg);
}

.diamond-grid-item {
    width: 200px;
    height: 200px;
    transform: rotate(-45deg);
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    background: linear-gradient(135deg, #667eea, #764ba2);
}

/* Gem button */
.gem-button {
    clip-path: polygon(
        30% 0%,
        70% 0%,
        100% 30%,
        100% 70%,
        70% 100%,
        30% 100%,
        0% 70%,
        0% 30%
    );
    background: linear-gradient(135deg, #f093fb, #4facfe);
    padding: 40px 60px;
    position: relative;
}

/* Sparkle effect */
.gem-button::before {
    content: '✦';
    position: absolute;
    top: 10%;
    right: 20%;
    font-size: 24px;
    color: rgba(255,255,255,0.8);
    animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
}
\`\`\`

**CRITICAL**: Complex clip-paths require fallbacks. Test on Safari. Use polygon() carefully for cross-browser support. Maintain text readability inside facets.`,
  },
  {
    id: 'spatial-depth-field',
    name: 'Spatial Depth Field',
    category: 'unleashed',
    description: 'Photography blur (f/1.4), extreme focus, bokeh backgrounds',
    icon: Eye,
    level: 'unleashed',
    designPrinciples: ['Depth-of-field blur', 'Focus point sharp', 'Background blur (20px)', 'Bokeh effects', 'F/1.4 aesthetic'],
    promptInstructions: `## 📷 SPATIAL DEPTH FIELD - Photography Blur
**DIRECTIVE**: Simulate **camera depth-of-field** (f/1.4 aperture). Sharp focus point, blurred everything else.
**AESTHETIC**: DSLR photography, bokeh backgrounds, cinematic depth, focal isolation.

### 1. 🎯 SHARP FOCUS POINT
One element in perfect focus:

\`\`\`css
/* Foreground content - SHARP */
.focus-target {
    filter: blur(0px);
    position: relative;
    z-index: 10;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.focus-target h1 {
    font-size: 96px;
    font-weight: 900;
    filter: none;
    /* Crystal clear */
}

/* Everything else fades to blur */
.content-in-focus {
    position: relative;
    filter: blur(0px);
}

.content-in-focus::before,
.content-in-focus::after {
    filter: blur(8px);
}
\`\`\`

### 2. 🌫️ BACKGROUND HEAVILY BLURRED
Blur increases with distance:

\`\`\`css
/* Near background - slight blur */
.depth-near {
    filter: blur(5px);
    opacity: 0.9;
    z-index: 5;
}

/* Mid background - medium blur */
.depth-mid {
    filter: blur(12px);
    opacity: 0.7;
    z-index: 3;
}

/* Far background - heavy blur */
.depth-far {
    filter: blur(20px);
    opacity: 0.5;
    z-index: 1;
}

/* Extreme background - maximum blur */
.depth-extreme {
    filter: blur(30px);
    opacity: 0.3;
    z-index: 0;
}

/* Layered depth */
.depth-scene {
    position: relative;
}

.depth-scene .layer-1 { filter: blur(20px); transform: scale(1.2); }
.depth-scene .layer-2 { filter: blur(12px); transform: scale(1.1); }
.depth-scene .layer-3 { filter: blur(6px); transform: scale(1.05); }
.depth-scene .layer-4 { filter: blur(0px); transform: scale(1); }
\`\`\`

### 3. ✨ BOKEH CIRCLES
Out-of-focus light points become circles:

\`\`\`css
/* Bokeh background */
.bokeh-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    filter: blur(15px);
}

/* Circular light spots */
.bokeh-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(
        circle,
        rgba(255,255,255,0.8) 0%,
        rgba(255,255,255,0.4) 50%,
        transparent 70%
    );
    position: absolute;
    filter: blur(8px);
}

.bokeh-circle-1 {
    top: 10%;
    left: 15%;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(255,200,100,0.6), transparent);
}

.bokeh-circle-2 {
    top: 60%;
    right: 20%;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(100,200,255,0.5), transparent);
}

.bokeh-circle-3 {
    bottom: 20%;
    left: 40%;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(255,150,200,0.4), transparent);
}

/* Multiple bokeh layers */
.bokeh-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    filter: blur(20px);
    opacity: 0.6;
}
\`\`\`

### 4. 📸 F/1.4 AESTHETIC
Shallow depth of field simulation:

\`\`\`css
/* Photography-style layout */
.photo-scene {
    position: relative;
    min-height: 100vh;
}

/* Subject in sharp focus */
.subject {
    position: relative;
    z-index: 10;
    filter: blur(0px);
    transform: translateZ(0); /* Hardware acceleration */
}

/* Foreground blur (closer than subject) */
.foreground-blur {
    position: absolute;
    z-index: 15;
    filter: blur(25px);
    opacity: 0.3;
}

/* Background gradient blur */
.gradient-blur {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom,
        rgba(100,100,150,0.4),
        rgba(200,150,200,0.3)
    );
    filter: blur(30px);
    z-index: -1;
}

/* Vignette effect */
.vignette {
    position: fixed;
    inset: 0;
    background: radial-gradient(
        ellipse at center,
        transparent 0%,
        transparent 50%,
        rgba(0,0,0,0.3) 100%
    );
    pointer-events: none;
    z-index: 20;
}

/* Chromatic aberration (lens effect) */
.chromatic {
    position: relative;
}

.chromatic::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: inherit;
    filter: blur(1px);
    mix-blend-mode: screen;
    opacity: 0.3;
}
\`\`\`

**CRITICAL**: Heavy blur is GPU-intensive. Use will-change: filter carefully. Ensure focused content meets accessibility requirements. Test performance on mobile.`,
  },
  {
    id: 'temporal-glitch',
    name: 'Temporal Glitch Freeze',
    category: 'unleashed',
    description: 'Frozen motion, time slices, multi-frame overlay',
    icon: Zap,
    level: 'unleashed',
    designPrinciples: ['Motion freeze', 'Time slice overlays', 'Multi-frame', 'Temporal artifacts', 'Frozen movement'],
    promptInstructions: `## ⏸️ TEMPORAL GLITCH FREEZE - Frozen Motion
**DIRECTIVE**: Show **multiple frames of time simultaneously**. Motion frozen mid-action, time-slice photography.
**AESTHETIC**: Sports photography freeze-frames, bullet-time Matrix effect, temporal echoes.

### 1. ⏱️ FROZEN MOTION OVERLAY
Multiple copies showing movement trail:

\`\`\`css
/* Base element */
.motion-freeze {
    position: relative;
}

/* Frame 1 (earliest) - most transparent */
.motion-freeze::before {
    content: '';
    position: absolute;
    inset: 0;
    background: inherit;
    opacity: 0.2;
    transform: translateX(-40px);
    z-index: 1;
}

/* Frame 2 */
.motion-freeze::after {
    content: '';
    position: absolute;
    inset: 0;
    background: inherit;
    opacity: 0.4;
    transform: translateX(-20px);
    z-index: 2;
}

/* Frame 3 (current) - fully opaque */
.motion-freeze {
    opacity: 1;
    z-index: 3;
}

/* Creates motion trail effect */
\`\`\`

### 2. 🎬 MULTI-FRAME OVERLAY (3-5 copies)
Stack multiple temporal states:

\`\`\`css
/* Container for temporal layers */
.temporal-stack {
    position: relative;
    width: 400px;
    height: 400px;
}

/* Layer 1 (past) */
.temporal-layer-1 {
    position: absolute;
    inset: 0;
    background: #667eea;
    opacity: 0.15;
    transform: translate(-60px, -60px) rotate(-5deg);
    filter: blur(2px);
}

/* Layer 2 */
.temporal-layer-2 {
    position: absolute;
    inset: 0;
    background: #667eea;
    opacity: 0.3;
    transform: translate(-40px, -40px) rotate(-3deg);
    filter: blur(1px);
}

/* Layer 3 */
.temporal-layer-3 {
    position: absolute;
    inset: 0;
    background: #667eea;
    opacity: 0.5;
    transform: translate(-20px, -20px) rotate(-1deg);
}

/* Layer 4 */
.temporal-layer-4 {
    position: absolute;
    inset: 0;
    background: #667eea;
    opacity: 0.7;
    transform: translate(-10px, -10px) rotate(-0.5deg);
}

/* Layer 5 (present) */
.temporal-layer-5 {
    position: absolute;
    inset: 0;
    background: #667eea;
    opacity: 1;
    transform: translate(0, 0) rotate(0deg);
}
\`\`\`

### 3. ⚡ SLIGHT OFFSETS
Progressive displacement creates motion trail:

\`\`\`css
/* Text with temporal echo */
.temporal-text {
    font-size: 96px;
    font-weight: 900;
    position: relative;
    color: #000;
}

.temporal-text::before {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: -15px;
    color: rgba(102, 126, 234, 0.3);
    z-index: -1;
}

.temporal-text::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: -30px;
    color: rgba(118, 75, 162, 0.2);
    z-index: -2;
}

/* Card stack showing time progression */
.card-temporal {
    position: relative;
}

.card-temporal .frame-1 {
    transform: translate(-30px, -15px);
    opacity: 0.3;
}

.card-temporal .frame-2 {
    transform: translate(-20px, -10px);
    opacity: 0.5;
}

.card-temporal .frame-3 {
    transform: translate(-10px, -5px);
    opacity: 0.7;
}

.card-temporal .frame-4 {
    transform: translate(0, 0);
    opacity: 1;
}
\`\`\`

### 4. 🎥 TIME-SLICE AESTHETICS
Bullet-time Matrix effect:

\`\`\`css
/* Time-slice grid */
.time-slice-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
}

.time-slice-frame {
    opacity: 0.2;
    filter: grayscale(0.8);
}

.time-slice-frame:nth-child(1) {
    opacity: 0.2;
    transform: perspective(800px) rotateY(-30deg);
}

.time-slice-frame:nth-child(2) {
    opacity: 0.4;
    transform: perspective(800px) rotateY(-15deg);
}

.time-slice-frame:nth-child(3) {
    opacity: 0.6;
    transform: perspective(800px) rotateY(0deg);
    filter: grayscale(0);
}

.time-slice-frame:nth-child(4) {
    opacity: 0.8;
    transform: perspective(800px) rotateY(15deg);
}

.time-slice-frame:nth-child(5) {
    opacity: 1;
    transform: perspective(800px) rotateY(30deg);
    filter: grayscale(0);
}

/* Freeze frame effect */
.freeze-frame {
    position: relative;
}

.freeze-frame::before,
.freeze-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: inherit;
    mix-blend-mode: screen;
}

.freeze-frame::before {
    transform: translateX(-8px);
    opacity: 0.5;
    filter: hue-rotate(-30deg);
}

.freeze-frame::after {
    transform: translateX(8px);
    opacity: 0.5;
    filter: hue-rotate(30deg);
}

/* RGB split freeze */
.rgb-freeze {
    position: relative;
}

.rgb-freeze::before {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: -5px;
    color: rgba(255, 0, 0, 0.5);
}

.rgb-freeze::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 5px;
    color: rgba(0, 255, 255, 0.5);
}
\`\`\`

**CRITICAL**: Multiple overlays affect performance. Use transform3d for GPU acceleration. Provide reduced-motion alternatives. Keep current frame fully readable.`,
  },
];

/**
 * Get archetypes by level
 */
export function getArchetypesByLevel(level: 'standard' | 'semi-unleashed' | 'unleashed'): Archetype[] {
  switch (level) {
    case 'standard':
      return STANDARD_ARCHETYPES;
    case 'semi-unleashed':
      return SEMI_UNLEASHED_ARCHETYPES;
    case 'unleashed':
      return UNLEASHED_ARCHETYPES;
    default:
      return STANDARD_ARCHETYPES;
  }
}

/**
 * Get archetype by ID (across all levels)
 */
export function getArchetypeById(id: string): Archetype | undefined {
  return [...STANDARD_ARCHETYPES, ...SEMI_UNLEASHED_ARCHETYPES, ...UNLEASHED_ARCHETYPES].find(
    (a) => a.id === id
  );
}
