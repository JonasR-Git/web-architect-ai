import { SiteStructure, SiteNode } from '@/types';

const createMockNode = (url: string, title: string): SiteNode => ({
    url,
    depth: 0,
    type: 'landing',
    meta: {
        title,
        description: 'Mock description',
        social: { ogTitle: title },
        schemaMarkup: [],
        viewport: 'width=device-width, initial-scale=1',
        geoSignals: {
            hasCitations: true,
            hasEvidence: true,
            hasAuthorInfo: true
        }
    },
    content: {
        h1: title,
        headings: [{ level: 1, text: title }],
        wordCount: 500,
        images: [{ src: '/img/mock.jpg', alt: 'Mock' }],
        links: [{ text: 'Home', href: '/' }],
        forms: [],
        landmarks: [{ tag: 'MAIN' }],
        hasSkipLink: true,
        hasLegalAccessibilityLink: true
    },
    tech: {
        detectedFrameworks: ['Next.js'],
        duplicateIds: []
    },
    score: {
        seo: 85,
        accessibility: 90,
        breakdown: {
            seo: [
                { label: 'Metadaten', score: 30, max: 35 },
                { label: 'GEO-Signale', score: 25, max: 30 },
                { label: 'Semantik', score: 15, max: 20 },
                { label: 'Social', score: 15, max: 15 }
            ],
            accessibility: [
                { label: 'Rechtlich', score: 40, max: 40 },
                { label: 'Interaktion', score: 30, max: 40 },
                { label: 'Technik', score: 20, max: 20 }
            ]
        },
        issues: []
    }
});

export const MOCK_SITE_STRUCTURE: SiteStructure = {
    rootUrl: 'https://example.com',
    nodes: [
        createMockNode('https://example.com', 'Example Domain'),
        createMockNode('https://example.com/about', 'About Us'),
        createMockNode('https://example.com/contact', 'Contact'),
    ],
    crawledAt: '2025-01-01T00:00:00.000Z'
};

export const MOCK_CRITIQUE = {
    audit_summary: {
        total_score: 72,
        rating: "Befriedigend",
        rating_emoji: "🟠",
        bfsg_compliant: false,
        critical_failures: 2,
        pass_fail_gate_triggered: true
    },
    accessibility_score: 68,
    seo_score: 85,
    audit_matrix: [
        {
            id: "W1",
            category: "Wahrnehmbar",
            description: "Alt-Texte für alle informativen Bilder",
            criticality: "K",
            max_points: 3,
            achieved: 0.5,
            weighted_score: 1.5,
            status: "⚠️ Partial",
            finding: "5 von 12 Bildern haben keine Alt-Texte im Hero-Bereich",
            recommendation: "Alle img-Tags mit beschreibenden alt-Attributen versehen"
        },
        {
            id: "W2",
            category: "Wahrnehmbar",
            description: "Farbkontrast Text ≥ 4.5:1",
            criticality: "K",
            max_points: 3,
            achieved: 0,
            weighted_score: 0,
            status: "❌ Fail",
            finding: "Sekundäre Buttons haben Kontrastverhältnis 3.2:1",
            recommendation: "Textfarbe oder Hintergrundfarbe anpassen für ≥4.5:1"
        },
        {
            id: "B1",
            category: "Bedienbar",
            description: "Vollständige Tastaturbedienung",
            criticality: "K",
            max_points: 3,
            achieved: 1,
            weighted_score: 3,
            status: "✅ Pass",
            finding: "Alle interaktiven Elemente sind per Tab erreichbar",
            recommendation: "-"
        },
        {
            id: "B3",
            category: "Bedienbar",
            description: "Sichtbarer Fokusindikator",
            criticality: "K",
            max_points: 3,
            achieved: 0,
            weighted_score: 0,
            status: "❌ Fail",
            finding: "Fokusring ist mit outline:none deaktiviert",
            recommendation: "CSS outline:none entfernen oder :focus-visible Styling hinzufügen"
        },
        {
            id: "V1",
            category: "Verständlich",
            description: "Sprache im HTML definiert (lang)",
            criticality: "K",
            max_points: 3,
            achieved: 1,
            weighted_score: 3,
            status: "✅ Pass",
            finding: "lang='de' korrekt im html-Tag gesetzt",
            recommendation: "-"
        },
        {
            id: "S1",
            category: "SEO",
            description: "Meta-Title vorhanden & optimal",
            criticality: "E",
            max_points: 1,
            achieved: 1,
            weighted_score: 1,
            status: "✅ Pass",
            finding: "Title 55 Zeichen, optimal",
            recommendation: "-"
        }
    ],
    critical_issues: [
        "Farbkontrast auf Buttons zu niedrig (3.2:1 statt 4.5:1)",
        "Fokusindikator ist deaktiviert - keine Tastatur-Navigation sichtbar"
    ],
    quick_wins: [
        "Alt-Texte für die 5 fehlenden Bilder ergänzen",
        "CSS outline:none durch focus-visible ersetzen"
    ],
    summary_de: "Die Website erfüllt 72% der BFSG-Anforderungen. Zwei kritische Probleme (Farbkontrast, Fokusindikator) blockieren die BFSG-Konformität. Nach Behebung dieser Punkte kann die Bewertung auf 'Gut' steigen.",
    // Legacy format support
    seo_score_legacy: 85,
    accessibility_score_legacy: 68,
    summary: "Die Website erfüllt 72% der BFSG-Anforderungen."
};

export const MOCK_MIGRATION_PLAN = {
    rationale: "The current structure is flat. We will group marketing pages and move the dashboard to a protected route.",
    sitemap: [
        { path: "/", label: "Home", type: "page" },
        { path: "/about", label: "About", type: "page" },
        { path: "/contact", label: "Contact", type: "page" },
        { path: "/app", label: "Dashboard Layout", type: "layout" },
        { path: "/app/dashboard", label: "Dashboard", type: "page" },
    ],
    page_mapping: [
        { old_url: "https://example.com", new_path: "/", action: "keep" },
        { old_url: "https://example.com/about", new_path: "/about", action: "keep" },
        { old_url: "https://example.com/contact", new_path: "/contact", action: "keep" },
        { old_url: "https://example.com/login", new_path: "/auth/login", action: "split" }
    ]
};

export const MOCK_COMPONENT_SPEC = {
    groups: [
        {
            name: "Navigation",
            components: [
                { name: "Navbar", description: "Main navigation bar with logo and links", usage: ["All Pages"], props: ["links", "user"] },
                { name: "Footer", description: "Site footer with legal links", usage: ["All Pages"], props: ["links"] }
            ]
        },
        {
            name: "Forms",
            components: [
                { name: "Input", description: "Standard text input field", usage: ["Contact", "Login"], props: ["label", "error", "value", "onChange"] },
                { name: "Button", description: "Primary and secondary buttons", usage: ["All Pages"], props: ["variant", "size", "onClick"] }
            ]
        },
        {
            name: "Layout",
            components: [
                { name: "HeroSection", description: "Large header area for landing pages", usage: ["Home"], props: ["title", "subtitle", "cta"] },
                { name: "Card", description: "Container for content items", usage: ["Blog", "Features"], props: ["title", "image"] }
            ]
        }
    ]
};

export const MOCK_IMPLEMENTATION_PLAN = {
    analysis_summary: {
        entities: [
            { name: "Task", attributes: ["id (string)", "text (string)", "completed (boolean)", "createdAt (Date)"] }
        ],
        ui_features: [
            "Input field for new tasks",
            "Statistics badges (Total, Done, Open)",
            "List with delete/toggle actions"
        ]
    },
    project_structure: [
        { path: "src/app/page.tsx", description: "Main Task View" },
        { path: "src/components/features/task-input.tsx", description: "Input component" },
        { path: "src/components/features/task-list.tsx", description: "List component" },
        { path: "src/lib/store.ts", description: "State management" }
    ],
    dependencies: ["lucide-react", "clsx", "tailwind-merge", "zustand"],
    phases: [
        {
            id: "p1",
            title: "Phase 1: Foundation & State",
            description: "Setting up the project structure and state management.",
            steps: [
                {
                    id: "1.1",
                    title: "State Management Setup",
                    description: "Create the Zustand store for tasks.",
                    file_path: "src/lib/store.ts",
                    instructions: [
                        "Define Task interface with id, text, completed",
                        "Create store with `tasks` array",
                        "Implement `addTask(text)`: Generate ID, add to beginning of array",
                        "Implement `toggleTask(id)`: Find task, flip completion status",
                        "Implement `deleteTask(id)`: Filter out task by ID"
                    ],
                    rules: ["Use strict TypeScript types", "Persist to localStorage if possible (middleware)"],
                    validation: "Create a test file or log the store to console to verify actions."
                }
            ]
        },
        {
            id: "p2",
            title: "Phase 2: UI Components",
            description: "Building the visual components.",
            steps: [
                {
                    id: "2.1",
                    title: "Task Input Component",
                    description: "Input field with add button.",
                    file_path: "src/components/features/task-input.tsx",
                    instructions: [
                        "Create component accepting no props (connects to store)",
                        "Use <form> for submit handling",
                        "Input element: value bound to local state, placeholder 'New Task...'",
                        "Button: Icon + Text 'Add'",
                        "OnSubmit: preventDefault, check if empty, call store.addTask, clear input"
                    ],
                    rules: ["Ensure accessibility (label/aria)", "Use tailwind for styling"],
                    validation: "Render component and check if addTask log appears."
                }
            ]
        }
    ]
};

export const MOCK_SPECIFICATION = {
    overview: "<h2>🎯 Project Goal</h2><p>Modernize the legacy example.com into a high-performance Next.js application.</p>",
    requirements: "<h2>✅ Requirements</h2><ul><li>Fast load times</li><li>SEO Optimized</li></ul>",
    user_stories: "<h2>👤 User Stories</h2><ul><li>As a user, I want to login quickly.</li></ul>",
    ui_components: "<h2>🧩 Components</h2><p>Design system based on Shadcn UI.</p>",
    data_model: "<h2>💾 Data Model</h2><p>User, Post, Comment entities.</p>",
    api_endpoints: "<h2>🔌 API</h2><p>GET /api/users, POST /api/auth/login</p>"
};

export const MOCK_OPTIMIZED_CONTENT = {
    page_title: "Optimierter Seitentitel",
    meta_description: "Eine prägnante Beschreibung der Seite für Suchmaschinen.",
    h1: "Hauptüberschrift",
    keywords: { primary: "Keyword", secondary: ["SEO"], long_tail: ["Optimierung"] },
    sections: [
        { id: "hero", component: "HeroSection", heading: "Willkommen", subheading: null, content: "Optimierter Hero-Text hier.", bullet_points: null, cta: { text: "Jetzt starten", action: "scroll", target: "#contact" }, image_suggestion: "Professional team photo" },
        { id: "features", component: "FeatureCard", heading: "Unsere Vorteile", subheading: null, content: "Feature-Beschreibung.", bullet_points: ["Vorteil 1", "Vorteil 2"], cta: null, image_suggestion: null }
    ],
    internal_links: [],
    schema_type: "WebPage"
};

export const MOCK_COMPONENT_LIBRARY = MOCK_COMPONENT_SPEC;
