import { SiteNode } from '@/types';

export interface AuditResult {
    seo: number;
    accessibility: number;
    breakdown: {
        seo: { label: string; score: number; max: number; details: string }[];
        accessibility: { label: string; score: number; max: number; details: string }[];
    };
    issues: { category: 'SEO' | 'ACC' | 'TECH'; severity: 'CRITICAL' | 'WARNING' | 'NOTICE'; message: string }[];
}

export function auditPage(node: SiteNode): AuditResult {
    const issues: AuditResult['issues'] = [];
    const breakdown: AuditResult['breakdown'] = {
        seo: [],
        accessibility: []
    };

    // --- 🔍 ADVANCED SEO AUDIT 2025 ---

    // 1. Metadaten (Max 35)
    let metaScore = 0;
    if (node.meta.title && node.meta.title.length >= 30 && node.meta.title.length <= 60) metaScore += 15;
    else if (node.meta.title) {
        metaScore += 5;
        issues.push({ category: 'SEO', severity: 'WARNING', message: `Title-Tag Länge (${node.meta.title.length}) sub-optimal für 2025.` });
    } else issues.push({ category: 'SEO', severity: 'CRITICAL', message: "Fehlendes Title-Tag" });

    if (node.meta.description && node.meta.description.length >= 70 && node.meta.description.length <= 160) metaScore += 10;
    else if (node.meta.description) {
        metaScore += 2;
        issues.push({ category: 'SEO', severity: 'WARNING', message: "Meta-Description Länge sub-optimal für 2025 SERPs." });
    } else issues.push({ category: 'SEO', severity: 'CRITICAL', message: "Fehlende Meta-Description" });

    if (node.meta.canonical) metaScore += 5;
    if (node.meta.viewport) metaScore += 5;
    breakdown.seo.push({
        label: 'Metadaten & Indexierbarkeit',
        score: metaScore,
        max: 35,
        details: 'Prüft Title, Description, Canonical und Viewport-Tags (Mobile-readiness).'
    });

    // 2. GEO & Struktur (Max 30)
    let structureScore = 0;
    if (node.content.h1) structureScore += 10;
    if (node.meta.geoSignals.hasCitations) structureScore += 5;
    if (node.meta.geoSignals.hasEvidence) structureScore += 5;
    if (node.content.wordCount > 600) structureScore += 10;
    else if (node.content.wordCount > 300) structureScore += 5;
    breakdown.seo.push({
        label: 'GEO-Signale & Struktur',
        score: structureScore,
        max: 30,
        details: 'H1-Präsenz, Textlänge und GEO-Signale (Zitate/Belege für KI-Suche).'
    });

    // 3. Semantik (Max 20)
    let semScore = 0;
    if (node.meta.schemaMarkup.length > 0) semScore += 10;
    if (node.meta.schemaMarkup.some(s => s.toLowerCase().includes('breadcrumb'))) semScore += 5;
    if (node.meta.geoSignals.hasAuthorInfo) semScore += 5;
    breakdown.seo.push({
        label: 'Fortgeschrittene Semantik',
        score: semScore,
        max: 20,
        details: 'JSON-LD / Schema.org Integration (Breadcrumbs, Author-Info für E-E-A-T).'
    });

    // 4. Social & Media (Max 15)
    let socialScore = 0;
    if (node.meta.social.ogTitle && node.meta.ogImage) socialScore += 10;
    const withAlt = node.content.images.filter(i => i.alt).length;
    if (node.content.images.length > 0 && withAlt === node.content.images.length) socialScore += 5;
    breakdown.seo.push({
        label: 'Social & Media',
        score: socialScore,
        max: 15,
        details: 'OpenGraph Tags für Social Media Sharing und Alt-Texte für Bild-SEO.'
    });

    // --- ♿ BFSG & ACCESSIBILITY AUDIT ---

    // 1. Legal (Max 40)
    let legalScore = 0;
    if (node.meta.lang) legalScore += 10;
    if (node.content.hasLegalAccessibilityLink) legalScore += 20;
    if (node.content.hasSkipLink) legalScore += 10;
    breakdown.accessibility.push({
        label: 'Rechtliche Konformität (BFSG)',
        score: legalScore,
        max: 40,
        details: 'Pflichtelemente nach BFSG 2025: Sprache, Barrierefreiheitserklärung, Skip-Links.'
    });

    // 2. Interaction (Max 40)
    let intScore = 0;
    const accTotalImgs = node.content.images.length;
    const invalidImgs = node.content.images.filter(img => !img.alt && !img.hasAriaHidden).length;
    if (accTotalImgs === 0 || invalidImgs === 0) intScore += 20;
    else intScore += Math.max(0, 20 - (invalidImgs * 5));

    const accTotalForms = node.content.forms.length;
    // Check if forms have fields without labels
    const invalidForms = node.content.forms.filter(f =>
        f.fields && f.fields.some(field => !field.label && field.required)
    ).length;
    if (accTotalForms === 0 || invalidForms === 0) intScore += 20;
    else intScore -= 10; // Penalty for forms

    breakdown.accessibility.push({
        label: 'Wahrnehmbarkeit & Bedienung',
        score: Math.max(0, intScore),
        max: 40,
        details: 'WCAG Kriterien: Alternativtexte für Bilder und Beschriftung von Formularen.'
    });

    // 3. Semantics & Tech (Max 20)
    let techScore = 0;
    if (node.content.landmarks.length >= 3) techScore += 10;
    if (node.tech.duplicateIds.length === 0) techScore += 10;
    breakdown.accessibility.push({
        label: 'Technische Robustheit',
        score: techScore,
        max: 20,
        details: 'ARIA Landmarks für Navigation und Vermeidung doppelter IDs im DOM.'
    });

    return {
        seo: breakdown.seo.reduce((a, b) => a + b.score, 0),
        accessibility: breakdown.accessibility.reduce((a, b) => a + b.score, 0),
        breakdown,
        issues
    };
}
