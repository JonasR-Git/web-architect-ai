
export type DesignStyle = 'modern' | 'minimalist' | 'glassmorphism' | 'brutalist' | 'luxury' | 'playful' | 'cyberpunk' | 'nature' | 'corporate' | 'retro';

export interface DesignPreset {
    id: DesignStyle;
    name: string;
    description: string;
    icon: string; // Emoji
    promptInjection: string;
}

export const DESIGN_PRESETS: DesignPreset[] = [
    {
        id: 'modern',
        name: 'Modern Clean',
        description: 'Clean SaaS aesthetic. Trustworthy & airy.',
        icon: '💎',
        promptInjection: `
        ## STYLE: MODERN SAAS (Clean & Trustworthy)
        - **COLORS**: strict adherence to User Palette. Backgrounds should be clean (light user BG).
        - **CARDS**: Use white/surface color with subtle shadows: \`shadow-sm border border-slate-200 hover:shadow-md transition-all\`.
        - **BUTTONS**: Use User Primary Color. \`font-medium px-6 py-2.5 rounded-lg shadow-sm\`.
        - **LAYOUT**: Spacious sections (\`py-20\`). Use 12-column grid.
        - **TYPOGRAPHY**: User defined Sans-serif. Clear hierarchy. Bold H1.
        - **KEY**: Avoid clutter. Use abundance of white space.
        `
    },
    {
        id: 'minimalist',
        name: 'Swiss Minimalist',
        description: 'Strict grid & bold type. Editorial feel.',
        icon: '⚪',
        promptInjection: `
        ## STYLE: SWISS MINIMALISM (Grid & Type)
        - **COLORS**: High contrast. If user colors are provided, use them in highest contrast pairings. Default to Black & White.
        - **CARDS**: No shadows. Use borders: \`border border-current rounded-none\`.
        - **BUTTONS**: Outline style: \`border-2 border-current hover:bg-current hover:text-white uppercase tracking-widest text-xs px-8 py-3 rounded-none\`.
        - **LAYOUT**: Visible grid lines or strong alignment. \`gap-0\` or \`gap-12\`.
        - **TYPOGRAPHY**: User defined (preferably Grotesk). Massive headings.
        - **KEY**: Content is king. No decorative fluff.
        `
    },
    {
        id: 'glassmorphism',
        name: 'Glassmorphism',
        description: 'Frosted glass depth & vivid gradients.',
        icon: '🧊',
        promptInjection: `
        ## STYLE: GLASSMORPHISM PURE (Premium Depth)
        - **BACKGROUND**: Use vivid mesh gradients based on User Primary/Secondary colors.
        - **CARDS**: Frosted glass: \`backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl\`.
        - **TEXT**: High contrast against gradients.
        - **BUTTONS**: Glassy buttons: \`bg-white/20 hover:bg-white/30 border border-white/40 backdrop-blur-md px-8 py-3 shadow-[0_0_20px_rgba(255,255,255,0.3)]\`.
        - **DECOR**: Floating blobs using User Colors behind content.
        - **KEY**: Layering is essential. Use z-index.
        `
    },
    {
        id: 'brutalist',
        name: 'Neo-Brutalism',
        description: 'Raw, unpolished, bold shadows & borders.',
        icon: '🏗️',
        promptInjection: `
        ## STYLE: NEO-BRUTALISM (Bold & Weird)
        - **COLORS**: High saturation versions of User Colors.
        - **SHADOWS**: Hard offset shadows: \`shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]\`.
        - **BORDERS**: Thick black borders everywhere: \`border-2 border-black\`.
        - **BUTTONS**: \`bg-white border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all\`.
        - **TYPOGRAPHY**: User defined (preferably Monospace/Bold). Uppercase headings.
        - **KEY**: Raw, unpolished, high energy.
        `
    },
    {
        id: 'luxury',
        name: 'Luxury / Elegant',
        description: 'Sophisticated serif type & plenty of space.',
        icon: '👑',
        promptInjection: `
        ## STYLE: HIGH-END LUXURY (Timeless)
        - **COLORS**: Deep rich tones or creamy whites from User Palette.
        - **ACCENT**: Use User Accent or Gold/Bronze for subtle details.
        - **TYPOGRAPHY**: Serif headings (Playfair/Cinzel). Light Sans body.
        - **BUTTONS**: Minimal ghost buttons or thin borders. \`border border-current uppercase tracking-[0.2em] text-xs px-10 py-4 hover:bg-current hover:text-white\`.
        - **SPACING**: Massive whitespace. \`py-32\`.
        - **KEY**: Sophistication through restraint.
        `
    },
    {
        id: 'playful',
        name: 'Playful / Pop',
        description: 'Bouncy, rounded, and friendly interaction.',
        icon: '🎈',
        promptInjection: `
        ## STYLE: PLAYFUL POP (Friendly & Bouncy)
        - **SHAPES**: Fully rounded. \`rounded-3xl\` cards. \`rounded-full\` buttons.
        - **COLORS**: Vibrant pastel/gummy versions of User Palette.
        - **BUTTONS**: Gradient using User Colors. \`shadow-lg hover:scale-110 transition-transform duration-300 rounded-full\`.
        - **TYPOGRAPHY**: Rounded Sans. Large line-height.
        - **IMAGES**: Use emojis or cut-out images.
        - **KEY**: Fun, approachable, safe.
        `
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk / Dark',
        description: 'Glowing neon, dark mode, high tech.',
        icon: '🌃',
        promptInjection: `
        ## STYLE: CYBERPUNK (Glitch & Glow)
        - **BACKGROUND**: Dark (User BG or \`bg-zinc-950\`). Grid lines overlay.
        - **COLORS**: Neon versions of User Colors (\`text-cyan-400\`, \`text-fuchsia-500\`).
        - **EFFECTS**: Text shadows (Glow).
        - **BORDERS**: Colored borders with opacity.
        - **BUTTONS**: Clip-path angles. High contrast uppercase tracking-widest.
        - **KEY**: High contrast, tech-focused, aggressive.
        `
    },
    {
        id: 'nature',
        name: 'Organic / Nature',
        description: 'Organic shapes, earthy tones, paper texture.',
        icon: '🌿',
        promptInjection: `
        ## STYLE: ORGANIC NATURE (Calm & Grounded)
        - **COLORS**: Earthy tones based on User Palette.
        - **SHAPES**: Organic, imperfect rounding if possible. \`rounded-2xl\`.
        - **BUTTONS**: Pill shaped. Earthy/mute colors.
        - **TYPOGRAPHY**: Humanist Sans or Serif.
        - **TEXTURE**: Noise overlays or paper grain.
        - **KEY**: Warmth, texture, sustainability.
        `
    },
    {
        id: 'corporate',
        name: 'Corporate / Enterprise',
        description: 'Data-dense, reliable, serious business.',
        icon: '🏢',
        promptInjection: `
        ## STYLE: CORPORATE ENTERPRISE (Scale & Reliability)
        - **COLORS**: Use User Palette but lean towards Trustworthy shades (Navy/Dark Blue/Grey).
        - **LAYOUT**: Information dense. defined Headers/Footers.
        - **CARDS**: Very subtle borders. \`bg-white border border-slate-200 rounded-lg shadow-sm\`.
        - **BUTTONS**: Rectangular with small radius (\`rounded\`). Standard User Primary Color.
        - **TYPOGRAPHY**: Legibility first.
        - **KEY**: Professionalism, data-focused, no surprises.
        `
    },
    {
        id: 'retro',
        name: 'Retro / 90s',
        description: 'Nostalgic pixels, vibrant neon, raw HTML.',
        icon: '💾',
        promptInjection: `
        ## STYLE: RETRO VAPORWAVE (Nostalgia)
        - **BACKGROUND**: Windows 95 blue (\`bg-blue-800\`) or Black.
        - **FONTS**: Monospace.
        - **ELEMENTS**: Marquee text. Blink tags.
        - **BUTTONS**: Beveled edges. 3D Borders.
        - **COLORS**: ALIEN Colors. Convert User's Palette to NEON equivalents (e.g. Navy->Cyan, DarkRed->HotPink).
        - **KEY**: Intentionally dated, geeky charm.
        `
    }
];
