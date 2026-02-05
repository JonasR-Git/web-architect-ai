/**
 * Ultra-Extreme Design Archetypes
 *
 * 15 NEW experimental archetypes across 5 categories
 * Always used at 100% intensity - no slider, no compromise
 *
 * Each archetype defines extreme CSS techniques and design principles
 * that push boundaries and create truly unique, unconventional designs.
 */

import {
  Sparkles, Layers, Box, Grid, Tv, Shuffle,
  Wind, Droplet, ArrowUp, Square, Type, Minus,
  Palette, Diamond, Focus
} from 'lucide-react';

export interface UltraExtremeArchetype {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  cssTechniques: string[];
  designPrinciples: string[];
  promptInstructions: string; // Detailed instructions for Stage 2 prompt
}

/**
 * Category 1: Reality Manipulation
 * Archetypes that break physics and perspective rules
 */
export const REALITY_MANIPULATION_ARCHETYPES: UltraExtremeArchetype[] = [
  {
    id: 'reality-warp',
    name: 'Reality Warp',
    category: 'reality-manipulation',
    description: 'M.C. Escher-inspired impossible perspectives and recursive elements',
    icon: Sparkles,
    cssTechniques: [
      'transform-style: preserve-3d',
      'perspective: 800px',
      'rotateX/Y/Z() for impossible angles',
      'backface-visibility: hidden',
      'Recursive nested elements',
    ],
    designPrinciples: [
      'Elements appear behind themselves',
      'Staircases that loop infinitely',
      'Objects exist in multiple planes simultaneously',
      'Perspective shifts that defy logic',
      'Visual paradoxes everywhere',
    ],
    promptInstructions: `
Apply M.C. Escher-inspired impossible geometry:

1. **3D Perspective Manipulation**:
   - Use \`transform-style: preserve-3d\` on container
   - Apply \`perspective: 800px\` for depth
   - Rotate sections with \`rotateX(45deg) rotateY(30deg)\` for impossible angles
   - Some elements should appear to be behind things that are behind them

2. **Recursive Visual Patterns**:
   - Hero section contains smaller version of itself in background
   - Navigation circles back on itself visually
   - Cards stack in ways that seem physically impossible

3. **Paradoxical Layout**:
   - Top of page connects visually to bottom (infinite loop illusion)
   - Elements cast shadows in impossible directions
   - Grid lines that curve and reconnect unexpectedly

4. **CSS Examples**:
   \`\`\`css
   .escher-container {
     transform-style: preserve-3d;
     perspective: 800px;
   }

   .impossible-card {
     transform: rotateY(45deg) rotateX(-20deg) translateZ(50px);
     backface-visibility: hidden;
   }

   .infinite-stair {
     position: relative;
     clip-path: polygon(0 0, 100% 20%, 80% 100%, 20% 80%);
   }
   \`\`\`

5. **Color & Style**: Monochromatic or limited palette to emphasize geometry over color
`,
  },
  {
    id: 'quantum-superposition',
    name: 'Quantum Superposition',
    category: 'reality-manipulation',
    description: 'Elements exist in multiple states simultaneously (Schrödinger\'s UI)',
    icon: Layers,
    cssTechniques: [
      'Layered opacity (0.3-0.7 range)',
      'mix-blend-mode: difference/exclusion',
      'Multiple absolute positions for same element',
      'filter: blur() + contrast()',
      'Dual color states',
    ],
    designPrinciples: [
      'Every button exists in "clicked" and "unclicked" state at once',
      'Text is both there and not there',
      'Elements occupy multiple positions',
      'Ambiguous visual hierarchy',
      'Observer changes the state',
    ],
    promptInstructions: `
Create quantum uncertainty in the UI:

1. **Dual State Elements**:
   - Each button shows both normal AND hover state simultaneously
   - Use layered divs with opacity 0.5-0.7 to show both states at once
   - Headlines appear in two slightly different positions overlapping

2. **Superposition Technique**:
   - Duplicate critical elements (CTA, navigation, hero text)
   - Position duplicates with slight offsets (5-15px)
   - Apply \`mix-blend-mode: difference\` to create interference patterns
   - One copy at opacity: 0.6, other at opacity: 0.4

3. **Ambiguous Existence**:
   - Is it a button or just text? Both!
   - Cards that are simultaneously expanded and collapsed
   - Navigation that's open and closed at the same time

4. **CSS Examples**:
   \`\`\`css
   .quantum-button {
     position: relative;
   }

   .quantum-button::before {
     content: attr(data-text);
     position: absolute;
     top: 3px;
     left: -3px;
     opacity: 0.6;
     mix-blend-mode: difference;
     background: rgba(255,0,100,0.3);
   }

   .superposition-text {
     position: relative;
     filter: blur(0.5px) contrast(1.2);
   }
   \`\`\`

5. **Color**: Dualistic - use complementary color pairs that create optical interference
`,
  },
  {
    id: 'dimensional-collapse',
    name: 'Dimensional Collapse',
    category: 'reality-manipulation',
    description: '2D/3D boundary dissolution - flat graphics with impossible depth',
    icon: Box,
    cssTechniques: [
      'Aggressive skew() transforms',
      'matrix3d() for complex deformations',
      'Flat colors + extreme fake shadows',
      'z-index chaos',
      'clip-path for sliced geometry',
    ],
    designPrinciples: [
      'Flat images cast 3D shadows',
      '2D text exists in 3D space',
      'Isometric perspective but with violations',
      'Depth is an illusion',
      'Dimensionality is ambiguous',
    ],
    promptInstructions: `
Blur the line between 2D and 3D:

1. **Isometric + Violations**:
   - Base layout in isometric grid (30° angles)
   - Use \`skewX(-30deg) skewY(30deg)\` for isometric cards
   - But then break rules: some elements defy the perspective

2. **Fake 3D from 2D**:
   - Flat colored blocks cast long, dramatic shadows
   - Use \`box-shadow: 20px 20px 0 rgba(0,0,0,0.3)\` for hard-edged shadows
   - Text uses \`text-shadow\` to appear lifted off page
   - But it's all flat - no actual 3D transforms on these elements

3. **Dimensional Ambiguity**:
   - Some cards use 3D transforms, others are completely flat
   - Mix \`transform: perspective()\` sections with flat \`skew()\` sections
   - Create visual confusion about what's in front/behind

4. **CSS Examples**:
   \`\`\`css
   .isometric-card {
     transform: skewX(-30deg) skewY(30deg);
     box-shadow: 20px 20px 0 rgba(0,0,0,0.25);
     clip-path: polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%);
   }

   .collapsed-dimension {
     transform: matrix3d(1,0.2,0,0, -0.2,1,0,0, 0,0,1,0, 0,0,0,1);
     position: relative;
     z-index: var(--chaotic-z);
   }
   \`\`\`

5. **Color**: High contrast flat colors (solid primaries) with deep black shadows
`,
  },
];

/**
 * Category 2: Algorithmic Chaos
 * Archetypes driven by mathematical patterns and controlled randomness
 */
export const ALGORITHMIC_CHAOS_ARCHETYPES: UltraExtremeArchetype[] = [
  {
    id: 'algorithmic-fractals',
    name: 'Algorithmic Fractals',
    category: 'algorithmic-chaos',
    description: 'Recursive self-similar patterns - design repeats at multiple scales',
    icon: Grid,
    cssTechniques: [
      'Nested CSS Grid with repeating patterns',
      'repeating-linear-gradient() / repeating-radial-gradient()',
      'Fibonacci spiral layouts (1.618 ratios)',
      'Golden ratio spacing',
      'Recursive background patterns',
    ],
    designPrinciples: [
      'Each section contains smaller version of overall layout',
      'Infinite zoom effect',
      'Mathematical proportions (golden ratio, Fibonacci)',
      'Self-similarity at all scales',
      'Natural fractal patterns (trees, rivers, crystals)',
    ],
    promptInstructions: `
Create mathematical fractal recursion:

1. **Recursive Layout Structure**:
   - Hero section layout mirrors overall page layout (miniaturized)
   - Each card contains even smaller cards with same proportions
   - Navigation structure repeats in footer
   - Use nested CSS Grid with same template patterns

2. **Fibonacci & Golden Ratio**:
   - Section heights follow Fibonacci sequence (144px, 233px, 377px...)
   - Column widths use golden ratio (1:1.618)
   - Spacing: 8px, 13px, 21px, 34px, 55px (Fibonacci)
   - Font sizes: 13px, 21px, 34px, 55px, 89px

3. **Fractal Backgrounds**:
   - Use \`repeating-radial-gradient()\` for organic fractal patterns
   - Nested circles or spirals that zoom infinitely
   - Koch snowflake-inspired borders

4. **CSS Examples**:
   \`\`\`css
   .fractal-container {
     display: grid;
     grid-template-columns: 1fr 1.618fr; /* Golden ratio */
     gap: 34px; /* Fibonacci */
   }

   .recursive-card {
     background: repeating-radial-gradient(
       circle at 50% 50%,
       transparent 0, transparent 10px,
       rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px
     );
   }

   .spiral-section {
     transform-origin: center;
     transform: rotate(calc(var(--index) * 137.5deg)); /* Golden angle */
   }
   \`\`\`

5. **Color**: Natural fractal-inspired palettes (forest greens, ocean blues, earth tones)
`,
  },
  {
    id: 'glitch-formalism',
    name: 'Glitch Formalism',
    category: 'algorithmic-chaos',
    description: 'Controlled data corruption aesthetics - embrace the digital artifact',
    icon: Tv,
    cssTechniques: [
      'clip-path: polygon() with random points',
      'filter: hue-rotate() + saturate()',
      'RGB channel separation',
      'Scan line overlays',
      'Intentional misalignment',
    ],
    designPrinciples: [
      'Embrace the error',
      'Digital corruption as aesthetic',
      'Intentional data loss',
      'VHS tape glitches',
      'Y2K nostalgia',
    ],
    promptInstructions: `
Apply intentional digital corruption:

1. **RGB Channel Split**:
   - Duplicate text/images 3 times
   - Offset red channel -3px left, blue channel +3px right
   - Use \`mix-blend-mode: screen\` to combine
   - Creates chromatic aberration effect

2. **Glitch Overlays**:
   - Horizontal scan lines with \`repeating-linear-gradient()\`
   - Random \`clip-path: polygon()\` to slice sections
   - Occasional elements shifted vertically (2-5px offsets)

3. **Data Corruption**:
   - Text occasionally "corrupts" - replace some letters with similar Unicode chars
   - Images have visible compression artifacts (chunky blocks)
   - Some colors oversaturated (\`filter: saturate(200%)\`)

4. **CSS Examples**:
   \`\`\`css
   .glitch-text {
     position: relative;
     animation: glitch-anim 2s infinite;
   }

   .glitch-text::before {
     content: attr(data-text);
     position: absolute;
     left: -2px;
     text-shadow: -2px 0 #ff00ff;
     clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
     animation: glitch-anim-2 3s infinite;
   }

   .scanlines {
     background: repeating-linear-gradient(
       0deg,
       rgba(0,0,0,0) 0px,
       rgba(0,0,0,0.3) 1px,
       rgba(0,0,0,0) 2px
     );
   }
   \`\`\`

5. **Color**: Neon pinks, electric blues, toxic greens - hyper-saturated CRT palette
`,
  },
  {
    id: 'noise-driven-layouts',
    name: 'Noise-Driven Layouts',
    category: 'algorithmic-chaos',
    description: 'Perlin/Simplex noise controls positioning - organized chaos',
    icon: Shuffle,
    cssTechniques: [
      'Pseudo-random transforms via calc()',
      'Scattered grid (irregular spacing)',
      'Organic clustering',
      'Natural distribution patterns',
      'Controlled randomness',
    ],
    designPrinciples: [
      'Elements positioned by noise algorithm',
      'Looks random but feels balanced',
      'Natural clustering (like stars, particles)',
      'No perfect alignment anywhere',
      'Organic flow despite chaos',
    ],
    promptInstructions: `
Use algorithmic noise for organic layouts:

1. **Noise-Based Positioning**:
   - Cards scattered across page, not in rigid grid
   - Use \`transform: translate()\` with pseudo-random values
   - Each card offset by (5-50px X, 10-80px Y) irregularly
   - But maintain readable flow - chaos with purpose

2. **Organic Clustering**:
   - Group related elements in loose clusters
   - Spacing between elements varies: 20px, 35px, 12px, 45px (no pattern)
   - Some elements overlap slightly (z-index layers)
   - Mimic natural distribution like stars in sky

3. **Perlin Noise Concept**:
   - Smooth randomness (not harsh jumps)
   - Neighboring elements have similar offsets (gradual change)
   - Create visual "flow" with noise field

4. **CSS Examples**:
   \`\`\`css
   .noise-card:nth-child(1) {
     transform: translate(12px, -8px) rotate(3deg);
   }
   .noise-card:nth-child(2) {
     transform: translate(-18px, 15px) rotate(-2deg);
   }
   .noise-card:nth-child(3) {
     transform: translate(5px, -22px) rotate(1deg);
   }
   /* Continue pattern with varying offsets */

   .scattered-grid {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: clamp(10px, 3vw, 50px);
   }
   \`\`\`

5. **Color**: Natural, earthy tones with organic gradients (not harsh transitions)
`,
  },
];

/**
 * Category 3: Kinetic Expression
 * Archetypes focused on movement, flow, and dynamic form
 */
export const KINETIC_EXPRESSION_ARCHETYPES: UltraExtremeArchetype[] = [
  {
    id: 'kinetic-typography',
    name: 'Kinetic Typography',
    category: 'kinetic-expression',
    description: 'Text as 80%+ of design - words become architecture',
    icon: Wind,
    cssTechniques: [
      'Massive font-size ranges (12px-240px)',
      'letter-spacing extremes (-0.1em to 0.5em)',
      'word-spacing for architectural text',
      'Vertical text (writing-mode: vertical-rl)',
      'Text as background pattern',
    ],
    designPrinciples: [
      'Typography IS the design',
      'Minimal graphics, maximum text',
      'Text forms shapes and structure',
      'Hierarchy through scale only',
      'Words as visual elements',
    ],
    promptInstructions: `
Make typography the dominant visual element:

1. **Text-Dominated Layout**:
   - Hero section: One MASSIVE headline (120-240px font-size) that fills 60% of viewport
   - Body text is architectural, not just informational
   - Navigation uses oversized type (40-60px)
   - Background: Repeating text patterns in low opacity

2. **Extreme Typography Scale**:
   - Headlines: 120-240px
   - Subheadings: 48-72px
   - Body: 16-24px (normal for readability)
   - Use weight variation (100-900) for hierarchy

3. **Typographic Techniques**:
   - \`letter-spacing: -0.05em\` for tight, architectural headlines
   - \`word-spacing: 0.5em\` for spaced-out emphasis
   - \`writing-mode: vertical-rl\` for vertical navigation
   - Text rotations for dynamic angles

4. **CSS Examples**:
   \`\`\`css
   .mega-headline {
     font-size: clamp(80px, 15vw, 240px);
     font-weight: 900;
     letter-spacing: -0.05em;
     line-height: 0.9;
     text-transform: uppercase;
   }

   .architectural-text {
     writing-mode: vertical-rl;
     font-size: 60px;
     letter-spacing: 0.1em;
   }

   .text-background {
     background: repeating-linear-gradient(
       45deg,
       transparent 0, transparent 10px,
       rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px
     );
   }
   \`\`\`

5. **Color**: Monochrome or duotone - let typography shine, not color
`,
  },
  {
    id: 'liquid-mercury',
    name: 'Liquid Mercury Interface',
    category: 'kinetic-expression',
    description: 'Viscous fluid UI - elements melt and flow like mercury',
    icon: Droplet,
    cssTechniques: [
      'Extreme border-radius (50%+)',
      'Blob shapes with multiple radii',
      'filter: blur() + contrast() for metaball effect',
      'Organic, flowing gradients',
      'Asymmetric border-radius',
    ],
    designPrinciples: [
      'No sharp corners anywhere',
      'Elements appear liquid',
      'Sections flow into each other',
      'Metallic sheen aesthetics',
      'Viscous, organic shapes',
    ],
    promptInstructions: `
Create liquid, flowing interface:

1. **Blob Morphology**:
   - Every element has \`border-radius\` of at least 30px
   - Hero section: Asymmetric blob shape \`border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%\`
   - Cards are organic ovals, not rectangles
   - Buttons are pill-shaped (border-radius: 100px)

2. **Metaball Effect**:
   - When elements get close, they appear to "merge"
   - Use \`filter: blur(10px) contrast(20)\` on container for metaball illusion
   - Overlapping elements create unified blob

3. **Mercury Aesthetics**:
   - Metallic gradients (silver, chrome effects)
   - \`background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)\`
   - Reflective sheen with subtle highlights

4. **CSS Examples**:
   \`\`\`css
   .mercury-card {
     border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     filter: drop-shadow(0 10px 30px rgba(0,0,0,0.3));
   }

   .metaball-container {
     filter: blur(10px) contrast(20);
   }

   .liquid-button {
     border-radius: 100px;
     background: linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%);
     padding: 20px 50px;
   }
   \`\`\`

5. **Color**: Iridescent, metallic palettes - silvers, chromes, holographic gradients
`,
  },
  {
    id: 'gravity-defying-stacks',
    name: 'Gravity-Defying Stacks',
    category: 'kinetic-expression',
    description: 'Inverted visual weight - heavy elements float, light elements sink',
    icon: ArrowUp,
    cssTechniques: [
      'Large elements positioned at top',
      'Small elements at bottom',
      'Inverted z-index hierarchy',
      'Top-heavy layouts',
      'Floating heavy blocks',
    ],
    designPrinciples: [
      'Defy visual gravity',
      'Heavy things float',
      'Light things sink',
      'Uncomfortable imbalance',
      'Inverted expectations',
    ],
    promptInstructions: `
Invert visual weight expectations:

1. **Inverted Hierarchy**:
   - Largest, boldest section at TOP of page (hero = massive, heavy visual weight)
   - As you scroll down, elements get lighter, smaller, more delicate
   - Footer is minimal (opposite of normal)

2. **Floating Heavy Elements**:
   - Large images positioned at top with \`position: absolute\` appearing to "hang"
   - Use negative margins to make heavy elements overlap upward
   - Dark, bold sections float above light, airy ones

3. **Uncomfortable Balance**:
   - Stack heavy elements in ways that look unstable
   - Large cards positioned off-center at top, small text centered below
   - Creates visual tension

4. **CSS Examples**:
   \`\`\`css
   .heavy-hero {
     min-height: 80vh;
     background: #000;
     font-size: 120px;
     font-weight: 900;
     position: relative;
     z-index: 10;
   }

   .light-footer {
     min-height: 20vh;
     background: #fff;
     font-size: 12px;
     font-weight: 300;
   }

   .floating-block {
     position: absolute;
     top: -50px; /* Hangs upward */
     width: 80%;
     height: 300px;
     background: #222;
   }
   \`\`\`

5. **Color**: Dark, heavy colors at top (blacks, deep purples) → Light colors below (whites, pastels)
`,
  },
];

/**
 * Category 4: Minimalism Extremes
 * Archetypes that push minimalism to radical extremes
 */
export const MINIMALISM_EXTREMES_ARCHETYPES: UltraExtremeArchetype[] = [
  {
    id: 'void-architecture',
    name: 'Void Architecture',
    category: 'minimalism-extremes',
    description: '95%+ whitespace - extreme negative space, single element per viewport',
    icon: Square,
    cssTechniques: [
      'margin: 40vh 0 for massive spacing',
      'Single element per viewport',
      'min-height: 100vh for sections',
      'Sparse content distribution',
      'Intentional emptiness',
    ],
    designPrinciples: [
      'Embrace the void',
      'One element per screen',
      'Massive whitespace is the design',
      'Anti-density',
      'Zen minimalism taken to extreme',
    ],
    promptInstructions: `
Create extreme negative space:

1. **One Element Per Viewport**:
   - Hero: Single headline centered, 95% empty space around it
   - Each section min-height: 100vh with ONE piece of content (image OR text, not both)
   - Scroll to see next element - no cramming

2. **Massive Spacing**:
   - Vertical margins: 40vh 0 (40% of viewport height top/bottom)
   - Horizontal padding: 20vw (20% of viewport width left/right)
   - Element takes up <10% of viewport area

3. **Intentional Emptiness**:
   - Background is pure white (or pure black for dark mode)
   - NO decorative elements
   - NO background patterns
   - Just pure space

4. **CSS Examples**:
   \`\`\`css
   .void-section {
     min-height: 100vh;
     display: flex;
     align-items: center;
     justify-content: center;
     padding: 40vh 20vw;
   }

   .lone-element {
     max-width: 200px;
     text-align: center;
   }

   .void-headline {
     font-size: 48px;
     margin: 0;
     font-weight: 300;
   }
   \`\`\`

5. **Color**: Extreme - pure white background + pure black text (or inverse). No grays.
`,
  },
  {
    id: 'mono-element-design',
    name: 'Mono-Element Design',
    category: 'minimalism-extremes',
    description: 'Entire page = variations of ONE shape (circles only, or squares only)',
    icon: Type,
    cssTechniques: [
      'All elements same shape (circles: border-radius: 50%)',
      'Or all squares (border-radius: 0)',
      'Or all lines (height: 2px)',
      'Constraint breeds creativity',
      'Variation through size/color only',
    ],
    designPrinciples: [
      'One shape for everything',
      'Creativity through constraint',
      'Variation via scale/color, not form',
      'Visual consistency extreme',
      'Discipline in repetition',
    ],
    promptInstructions: `
Use ONLY one geometric shape:

1. **Choose Your Shape** (pick ONE):
   - **Option A: Circles Only** - Every element is \`border-radius: 50%\`
   - **Option B: Squares Only** - Every element is \`border-radius: 0\`
   - **Option C: Lines Only** - Every element is \`height: 2px; width: Xpx\`

2. **Apply Universally**:
   - Hero image: Clipped to chosen shape
   - Buttons: Your chosen shape
   - Cards: Your chosen shape
   - Navigation items: Your chosen shape
   - Even text containers follow the shape

3. **Variation Through**:
   - SIZE: Range from 10px to 500px versions of your shape
   - COLOR: Different colors for different shapes
   - OPACITY: Layer shapes with varying transparency
   - POSITION: Overlap and arrange creatively

4. **CSS Examples (Circles Option)**:
   \`\`\`css
   * {
     border-radius: 50% !important;
     overflow: hidden;
   }

   .hero-image {
     width: 500px;
     height: 500px;
     border-radius: 50%;
     object-fit: cover;
   }

   .circle-button {
     width: 120px;
     height: 120px;
     border-radius: 50%;
     display: flex;
     align-items: center;
     justify-content: center;
   }
   \`\`\`

5. **Color**: Limited palette (2-3 colors max) to maintain focus on shape
`,
  },
  {
    id: 'typographic-brutalism',
    name: 'Typographic Brutalism',
    category: 'minimalism-extremes',
    description: 'Only typography, zero graphics - raw HTML table aesthetics',
    icon: Minus,
    cssTechniques: [
      'System fonts only (Arial, Courier, Times)',
      'Monospace for everything',
      'ASCII art borders',
      'Text-based UI elements',
      'No images, no graphics',
    ],
    designPrinciples: [
      'Pure text interface',
      'HTML without CSS aesthetic',
      'Terminal/command-line inspiration',
      'Anti-design design',
      'Raw, unpolished',
    ],
    promptInstructions: `
Strip everything except text:

1. **Typography Only**:
   - NO images anywhere (replace with ASCII art or text descriptions)
   - NO background images
   - NO icons (use Unicode characters: ★ ✓ → ⚠ etc.)
   - Buttons are just underlined text

2. **Brutalist Fonts**:
   - Use system fonts: \`font-family: 'Courier New', monospace\`
   - Or \`font-family: Arial, sans-serif\`
   - Or \`font-family: 'Times New Roman', serif\`
   - Monospace preferred for that "code" aesthetic

3. **ASCII Art Decoration**:
   - Use text borders: \`═══════════\` or \`-----------\`
   - Section separators with characters
   - Tables with \`| column | column |\`

4. **CSS Examples**:
   \`\`\`css
   body {
     font-family: 'Courier New', monospace;
     font-size: 16px;
     line-height: 1.6;
     background: #fff;
     color: #000;
     padding: 20px;
   }

   .brutalist-border {
     border: 2px solid #000;
     padding: 20px;
   }

   .text-button {
     text-decoration: underline;
     color: blue;
     cursor: pointer;
   }

   .ascii-divider::before {
     content: '═══════════════════════════════════';
     display: block;
     margin: 20px 0;
   }
   \`\`\`

5. **Color**: Black text on white (or white on black). No other colors.
`,
  },
];

/**
 * Category 5: Sensory Expansion
 * Archetypes that engage unexpected senses and perceptions
 */
export const SENSORY_EXPANSION_ARCHETYPES: UltraExtremeArchetype[] = [
  {
    id: 'synesthetic-grid',
    name: 'Synesthetic Grid',
    category: 'sensory-expansion',
    description: 'Colors "sound", shapes "taste" - cross-sensory mapping',
    icon: Palette,
    cssTechniques: [
      'Unexpected color-function pairings',
      'Warm colors for "technical" content',
      'Cool colors for "emotional" content',
      'Break color psychology rules',
      'Sensory confusion',
    ],
    designPrinciples: [
      'Red for "About" (unexpected)',
      'Yellow for "Contact" (unusual)',
      'Purple for "Products" (unconventional)',
      'Cross-sensory associations',
      'Break expected color meanings',
    ],
    promptInstructions: `
Map senses incorrectly on purpose:

1. **Unconventional Color-Section Pairings**:
   - About Us: Use bright red (usually error color) for welcoming section
   - Contact: Use yellow (usually warning) for calm communication
   - Products: Use purple (usually luxury) for everyday items
   - Blog: Use orange (usually action) for reading content

2. **Sensory Metaphors**:
   - "Loud" colors for quiet sections
   - "Soft" colors for technical content
   - "Cold" colors for warm messaging

3. **Break Color Psychology**:
   - Green for stop actions
   - Red for success messages
   - Blue for urgent CTAs

4. **CSS Examples**:
   \`\`\`css
   .about-section {
     background: #ff3366; /* Unexpected red for welcoming */
     color: white;
   }

   .contact-section {
     background: #ffcc00; /* Unusual yellow for calm */
     color: #333;
   }

   .product-card {
     background: #9b59b6; /* Purple for everyday items */
   }

   .success-message {
     background: #e74c3c; /* Red for success (inverted) */
   }
   \`\`\`

5. **Color**: Highly saturated, unexpected pairings that create cognitive dissonance
`,
  },
  {
    id: 'crystalline-structures',
    name: 'Crystalline Structures',
    category: 'sensory-expansion',
    description: 'Geometric facets, light refraction - jewelry-inspired UI',
    icon: Diamond,
    cssTechniques: [
      'clip-path: polygon() for sharp angles',
      'Multiple gradients for facets',
      'Prismatic color shifts',
      'Angular, faceted shapes',
      'Gem-cut aesthetics',
    ],
    designPrinciples: [
      'Sharp, angular geometry',
      'Faceted surfaces',
      'Light refraction effects',
      'Prism-like color splits',
      'Crystalline clarity',
    ],
    promptInstructions: `
Create gem-cut, faceted interface:

1. **Faceted Shapes**:
   - Every element has angular, multi-faceted appearance
   - Use \`clip-path: polygon()\` to create gem cuts:
   - Example: \`clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)\` for hexagon
   - Cards look like cut gemstones

2. **Prismatic Gradients**:
   - Multiple gradient layers to simulate light refraction
   - Each "facet" has slightly different gradient direction
   - Iridescent color shifts (rainbow spectrum)

3. **Light Beams**:
   - Diagonal gradient "beams" that look like refracted light
   - Use \`linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)\`

4. **CSS Examples**:
   \`\`\`css
   .crystal-card {
     clip-path: polygon(50% 0%, 90% 25%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 25%);
     background:
       linear-gradient(135deg, #667eea 0%, #764ba2 50%, transparent 50%),
       linear-gradient(225deg, #f093fb 0%, #f5576c 50%, transparent 50%);
     position: relative;
   }

   .light-refraction {
     background: linear-gradient(45deg,
       transparent 0%, rgba(255,255,255,0.2) 30%,
       transparent 50%, rgba(255,255,255,0.2) 70%,
       transparent 100%
     );
   }

   .faceted-button {
     clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
     background: linear-gradient(135deg, #00f5ff, #0066ff, #6600ff);
   }
   \`\`\`

5. **Color**: Prismatic - full rainbow spectrum, holographic effects, gem tones
`,
  },
  {
    id: 'spatial-depth-field',
    name: 'Spatial Depth Field',
    category: 'sensory-expansion',
    description: 'Photography depth-of-field in UI - extreme blur for depth',
    icon: Focus,
    cssTechniques: [
      'filter: blur(20px) for backgrounds',
      'Sharp foreground focus',
      'Depth layers (blur increases with z-distance)',
      'Bokeh effects',
      'f/1.4 photography look',
    ],
    designPrinciples: [
      'Foreground razor-sharp',
      'Background heavily blurred',
      'Simulates camera depth-of-field',
      'Focus guides attention',
      'Layered depth perception',
    ],
    promptInstructions: `
Simulate photography depth-of-field:

1. **Three Depth Layers**:
   - **Foreground** (z-index: 30): Completely sharp, high contrast
   - **Midground** (z-index: 20): Slightly blurred (\`filter: blur(2px)\`)
   - **Background** (z-index: 10): Heavily blurred (\`filter: blur(20px)\`)

2. **Focus Point**:
   - Main CTA or hero text is the "focus point" - completely sharp
   - Everything else progressively blurs based on distance from focus
   - Creates visual hierarchy through blur

3. **Bokeh Effects**:
   - Background has large, soft circles (out-of-focus lights)
   - Use radial gradients with heavy blur for bokeh simulation

4. **CSS Examples**:
   \`\`\`css
   .background-layer {
     position: absolute;
     z-index: 10;
     filter: blur(25px);
     opacity: 0.7;
   }

   .midground-layer {
     position: relative;
     z-index: 20;
     filter: blur(3px);
   }

   .foreground-focus {
     position: relative;
     z-index: 30;
     filter: blur(0);
     font-weight: 700;
   }

   .bokeh-circle {
     position: absolute;
     width: 100px;
     height: 100px;
     border-radius: 50%;
     background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
     filter: blur(10px);
   }
   \`\`\`

5. **Color**: Muted backgrounds (low saturation), vibrant focus point (high saturation)
`,
  },
];

/**
 * All archetypes combined by category
 */
export const ULTRA_EXTREME_ARCHETYPES = {
  'reality-manipulation': REALITY_MANIPULATION_ARCHETYPES,
  'algorithmic-chaos': ALGORITHMIC_CHAOS_ARCHETYPES,
  'kinetic-expression': KINETIC_EXPRESSION_ARCHETYPES,
  'minimalism-extremes': MINIMALISM_EXTREMES_ARCHETYPES,
  'sensory-expansion': SENSORY_EXPANSION_ARCHETYPES,
};

/**
 * All archetypes flattened
 */
export const ALL_ULTRA_EXTREME_ARCHETYPES = [
  ...REALITY_MANIPULATION_ARCHETYPES,
  ...ALGORITHMIC_CHAOS_ARCHETYPES,
  ...KINETIC_EXPRESSION_ARCHETYPES,
  ...MINIMALISM_EXTREMES_ARCHETYPES,
  ...SENSORY_EXPANSION_ARCHETYPES,
];

/**
 * Check if an archetype ID is valid
 */
export function isUltraExtremeArchetype(id: string): boolean {
  return ALL_ULTRA_EXTREME_ARCHETYPES.some(arch => arch.id === id);
}

/**
 * Get archetype by ID
 */
export function getArchetypeById(id: string): UltraExtremeArchetype | undefined {
  return ALL_ULTRA_EXTREME_ARCHETYPES.find(arch => arch.id === id);
}

/**
 * Category metadata
 */
export const ARCHETYPE_CATEGORIES = [
  {
    id: 'reality-manipulation',
    name: 'Reality Manipulation',
    description: 'Break physics and perspective rules',
    icon: Sparkles,
  },
  {
    id: 'algorithmic-chaos',
    name: 'Algorithmic Chaos',
    description: 'Mathematical patterns and controlled randomness',
    icon: Grid,
  },
  {
    id: 'kinetic-expression',
    name: 'Kinetic Expression',
    description: 'Movement, flow, and dynamic form',
    icon: Wind,
  },
  {
    id: 'minimalism-extremes',
    name: 'Minimalism Extremes',
    description: 'Radical minimalism pushed to limits',
    icon: Square,
  },
  {
    id: 'sensory-expansion',
    name: 'Sensory Expansion',
    description: 'Engage unexpected senses and perceptions',
    icon: Palette,
  },
];
