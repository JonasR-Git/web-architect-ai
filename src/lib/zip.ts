'use client';

import JSZip from 'jszip';
import { TemplateGenerator } from '@/modules/engineering/services/template-generator';
import type { ClusterSpec, TargetSlot, SiteStructure, SiteNode } from '@/types';
import { extractSlugFromUrl } from '@/lib/url-utils';

export interface ContentFile {
    path: string; // e.g., "content/home.md"
    content: string;
}

export interface OptimizedPageData {
    page_title: string;
    meta_description: string;
    h1?: string;
    url?: string;
    language?: string; // New: Language code (e.g., 'en', 'de')
    canonical?: string;
    hreflangs?: { lang: string; url: string }[];
    keywords: string[] | { primary?: string; secondary?: string[]; long_tail?: string[] };
    sections: {
        id: string;
        component: string;
        heading: string;
        subheading?: string | null;
        content: string;
        bullet_points?: string[] | null;
        cta?: string | { text: string; action?: string; target?: string } | null;
        image_suggestions?: { src: string; status: 'mandatory' | 'optional'; localPath?: string }[];
    }[];
    internal_links?: string[];
    schema_type?: string;
}

/**
 * Converts OptimizedPageData to a Markdown string.
 */
export function pageDataToMarkdown(path: string, data: OptimizedPageData): string {
    let md = `---\n`;
    if (data.language) md += `language: ${data.language}\n`;
    md += `original_url: ${data.url || ''}\n`;

    // SEO Fields
    if (data.canonical) md += `canonical: ${data.canonical}\n`;
    if (data.hreflangs && data.hreflangs.length > 0) {
        md += `hreflangs:\n`;
        data.hreflangs.forEach((h: any) => {
            md += `  - lang: ${h.lang}\n    url: ${h.url}\n`;
        });
    }

    md += `---\n\n`;

    md += `# ${data.h1 || data.page_title}\n\n`;
    md += `> ${data.meta_description}\n\n`;

    // Handle both old (array) and new (object) keywords format
    if (data.keywords) {
        if (Array.isArray(data.keywords)) {
            md += `**Keywords**: ${data.keywords.join(', ')}\n\n`;
        } else {
            const kw = data.keywords;
            md += `**Keywords**:\n`;
            if (kw.primary) md += `- Primary: ${kw.primary}\n`;
            if (kw.secondary?.length) md += `- Secondary: ${kw.secondary.join(', ')}\n`;
            if (kw.long_tail?.length) md += `- Long-tail: ${kw.long_tail.join(', ')}\n`;
            md += `\n`;
        }
    }

    if (data.schema_type) {
        md += `**Schema**: ${data.schema_type}\n\n`;
    }

    md += `---\n\n`;

    data.sections.forEach((section) => {
        md += `## ${section.heading}\n`;
        if (section.subheading) md += `*${section.subheading}*\n\n`;
        md += `*Component: \`${section.component}\`*\n\n`;
        md += `${section.content}\n\n`;

        if (section.bullet_points?.length) {
            section.bullet_points.forEach(bp => md += `- ${bp}\n`);
            md += `\n`;
        }

        if (section.cta) {
            if (typeof section.cta === 'string') {
                md += `**CTA**: ${section.cta}\n\n`;
            } else {
                md += `**CTA**: ${section.cta.text}`;
                if (section.cta.target) md += ` → ${section.cta.target}`;
                md += `\n\n`;
            }
        }

        if (section.image_suggestions?.length) {
            md += `### Visual Assets\n`;
            section.image_suggestions.forEach(img => {
                const badge = img.status === 'mandatory' ? ' [REQUIRED]' : ' [OPTIONAL]';
                const path = img.localPath ? `assets/images/${img.localPath}` : img.src;
                md += `- !${badge}(${path}) *${img.status.toUpperCase()}*\n`;
            });
            md += `\n`;
        }
    });

    if (data.internal_links?.length) {
        md += `---\n\n**Internal Links**: ${data.internal_links.join(', ')}\n`;
    }

    return md;
}

/**
 * Generates a ZIP file containing the Implementation Plan and all content files.
 */
export async function generateProjectZip(
    implementationPlanMd: string,
    contentFiles: ContentFile[],
    images?: Record<string, string>, // filename -> base64
    assetsMap?: Record<string, string>, // url -> filename
    mockupHtml?: string,
    clusters?: ClusterSpec[],
    pageSpecs?: TargetSlot[], // Page specifications for template generation
    structure?: SiteStructure // SiteStructure for language detection
): Promise<Blob> {
    const zip = new JSZip();

    // 🌍 LANGUAGE-AWARE: Detect and organize by language
    let languageInfo: { languages: string[]; distribution: Record<string, number> } | null = null;
    if (structure && Array.isArray(structure.nodes) && structure.nodes.length > 0) {
        try {
            const { LanguageDetector } = await import('@/modules/analysis/services/language-detector');
            const languages = LanguageDetector.getDetectedLanguages(structure.nodes);
            const distribution: Record<string, number> = {};

            structure.nodes.forEach((node: SiteNode) => {
                const lang = LanguageDetector.detectLanguageFromUrl(node.url) || 'default';
                distribution[lang] = (distribution[lang] || 0) + 1;
            });

            if (languages.length > 0) {
                languageInfo = { languages, distribution };
                console.log(`🌍 [ZIP Export] Multi-language site detected: ${languages.join(', ')}`);

                // Add language_info.md
                let langInfoMd = `# Language Structure\n\n`;
                langInfoMd += `This is a multi-language website.\n\n`;
                langInfoMd += `## Detected Languages\n\n`;
                languages.forEach(lang => {
                    const count = distribution[lang] || 0;
                    const percent = Math.round((count / structure.nodes.length) * 100);
                    langInfoMd += `- **${lang.toUpperCase()}**: ${count} pages (${percent}%)\n`;
                });
                langInfoMd += `\n## Content Organization\n\n`;
                langInfoMd += `Content is organized in language-specific folders:\n\n`;
                languages.forEach(lang => {
                    langInfoMd += `- \`content/${lang}/\` - ${lang.toUpperCase()} content\n`;
                });
                langInfoMd += `\n**Note:** During implementation, you can use i18n libraries to manage translations.\n`;

                zip.file('language_info.md', langInfoMd);
            }
        } catch (error) {
            console.error('🌍 [ZIP Export] Language detection failed, using flat structure:', error);
            languageInfo = null; // Fallback to single-language structure
        }
    }

    // Add Cluster Export (JSON)
    if (clusters && clusters.length > 0) {
        zip.file('content_export.json', JSON.stringify({
            version: "1.0",
            export_date: new Date().toISOString(),
            clusters
        }, null, 2));

        // Generate Cluster Templates if pageSpecs provided
        if (pageSpecs && pageSpecs.length > 0) {
            try {
                const templates = TemplateGenerator.generateClusterTemplates(clusters, pageSpecs);

                // Add cluster_templates.json
                zip.file('cluster_templates.json', JSON.stringify({
                    version: "1.0",
                    generated_at: new Date().toISOString(),
                    templates: templates
                }, null, 2));

                // Add template instructions
                const templatesFolder = zip.folder('templates');
                if (templatesFolder) {
                    templates.forEach(template => {
                        const safeName = template.pattern.replace(/[\/\[\]]/g, '_');
                        templatesFolder.file(
                            `${safeName}_instructions.md`,
                            template.generationInstructions
                        );
                    });
                }

                // Add mapping_report.md
                const mappingReport = generateMappingReport(clusters, templates);
                zip.file('mapping_report.md', mappingReport);

            } catch (error) {
                console.error('Error generating cluster templates:', error);
            }
        }

        // Add Cluster Export (Markdown) - Human Readable
        let clustersMd = `# Cluster Architecture\n\n`;
        clustersMd += `> Generated on ${new Date().toLocaleDateString()}\n\n`;

        clusters.forEach(cluster => {
            clustersMd += `## ${cluster.id} (${cluster.pattern})\n`;
            clustersMd += `**Total Pages**: ${cluster.instances.length}\n\n`;

            if (cluster.instances.length > 0) {
                clustersMd += `### Pages:\n`;
                cluster.instances.forEach((inst: any) => {
                    clustersMd += `- ${inst.url} (${inst.title || 'No Title'})\n`;
                });
                clustersMd += `\n`;
            }
            clustersMd += `---\n\n`;
        });

        zip.file('clusters.md', clustersMd);
    }

    // Add Mockup as Visual Reference if available
    if (mockupHtml) {
        zip.file('visual_reference/reference_design.html', mockupHtml);
    }

    // Split Implementation Plan if Design System is present
    const delimiter = '<<<DESIGN_SYSTEM_END>>>';
    if (implementationPlanMd.includes(delimiter)) {
        const parts = implementationPlanMd.split(delimiter);
        zip.file('Design_System.md', parts[0].trim());
        zip.file('Implementation_Plan.md', parts[1].trim());
    } else {
        zip.file('Implementation_Plan.md', implementationPlanMd);
    }

    // Add content folder - 🌍 LANGUAGE-AWARE ORGANIZATION
    const contentFolder = zip.folder('content');
    if (contentFolder) {
        // Group files by language if multi-language site detected
        if (languageInfo && languageInfo.languages.length > 0) {
            try {
                const { LanguageDetector } = await import('@/modules/analysis/services/language-detector');

                // Create language subfolders
                languageInfo.languages.forEach(lang => {
                    contentFolder.folder(lang);
                });

                contentFiles.forEach((file) => {
                    // Detect language from file path
                    const lang = LanguageDetector.detectLanguageFromUrl(`https://dummy.com${file.path}`) || 'default';

                    // Normalize filename (remove language prefix, use .md extension)
                    let conceptPath = LanguageDetector.extractConceptPath(`https://dummy.com${file.path}`);
                    let filename = conceptPath.replace(/^\//, '').replace(/\//g, '_');
                    if (filename.length === 0) filename = 'landingpage';

                    // Store in language-specific folder
                    const langFolder = contentFolder.folder(lang);
                    if (langFolder) {
                        langFolder.file(filename + '.md', file.content);
                    }
                });
            } catch (error) {
                console.error('🌍 [ZIP Export] Language organization failed, using flat structure:', error);
                // Fallback to flat structure
                contentFiles.forEach((file) => {
                    let filename = file.path.replace(/^\//, '').replace(/\//g, '_');
                    if (filename.length === 0) filename = 'landingpage';
                    contentFolder.file(filename + '.md', file.content);
                });
            }
        } else {
            // Single-language or no language detection - flat structure
            contentFiles.forEach((file) => {
                let filename = file.path.replace(/^\//, '').replace(/\//g, '_');
                if (filename.length === 0) filename = 'landingpage';
                contentFolder.file(filename + '.md', file.content);
            });
        }
    }

    // Add Images
    if (images) {
        const imgFolder = zip.folder('assets/images');
        if (imgFolder) {
            Object.entries(images).forEach(([filename, base64]) => {
                imgFolder.file(filename, base64, { base64: true });
            });
        }
    }

    // Add Assets Map
    if (assetsMap) {
        zip.file('assets_map.json', JSON.stringify(assetsMap, null, 2));
    }

    // Generate ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
}

/**
 * Triggers download of a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generates a detailed mapping report showing source → target relationships
 */
function generateMappingReport(
    clusters: ClusterSpec[],
    templates: any[]
): string {
    let report = `# Source → Target Mapping Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    report += `---\n\n`;

    // Summary
    const totalPages = clusters.reduce((sum, c) => sum + c.instances.length, 0);
    report += `## Summary\n\n`;
    report += `- **Total Clusters:** ${clusters.length}\n`;
    report += `- **Total Pages:** ${totalPages}\n`;
    report += `- **Templates Generated:** ${templates.length}\n\n`;
    report += `---\n\n`;

    // Cluster Mappings
    report += `## Cluster Mappings\n\n`;

    templates.forEach(template => {
        const cluster = clusters.find(c => c.id === template.clusterId);
        if (!cluster) return;

        report += `### ${template.pattern}\n\n`;
        report += `**Target:** \`${template.templateSpec.path}\`\n`;
        report += `**Action:** ${getActionLabel(template.templateSpec.action)}\n`;
        report += `**Instance Count:** ${template.instanceCount}\n\n`;

        if (template.templateSpec.description) {
            report += `**Description:** ${template.templateSpec.description}\n\n`;
        }

        report += `#### Instance Mappings\n\n`;
        report += `| # | Source URL | Target Path | Status |\n`;
        report += `|---|------------|-------------|--------|\n`;

        cluster.instances.forEach((inst: any, index: number) => {
            const slug = extractSlugFromUrl(inst.url);
            const targetPath = template.templateSpec.path
                .replace(/\[slug\]/g, slug)
                .replace(/\[id\]/g, slug)
                .replace(/\[.*?\]/g, slug);

            report += `| ${index + 1} | \`${inst.url}\` | \`${targetPath}\` | Planned |\n`;
        });

        report += `\n`;

        // Template Info
        report += `**Representative Example (60th Percentile):**\n`;
        report += `- URL: \`${template.representativeExample.url}\`\n`;
        report += `- Title: ${template.representativeExample.title}\n`;
        report += `- Word Count: ${template.representativeExample.wordCount || 0}\n\n`;

        report += `---\n\n`;
    });

    // Implementation Checklist
    report += `## Implementation Checklist\n\n`;
    report += `- [ ] Review all cluster templates\n`;
    report += `- [ ] Verify representative examples\n`;
    report += `- [ ] Implement master templates\n`;
    report += `- [ ] Create data mapping functions\n`;
    report += `- [ ] Generate all ${totalPages} instances\n`;
    report += `- [ ] Validate generated pages\n`;
    report += `- [ ] Test responsive images\n`;
    report += `- [ ] Verify SEO metadata\n`;
    report += `- [ ] Test internal links\n`;
    report += `- [ ] Deploy and test\n\n`;

    return report;
}

/**
 * Helper: Gets human-readable action label
 */
function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
        keep: 'Beibehalten',
        redirect: 'Umleiten',
        merge: 'Zusammenführen',
        delete: 'Löschen'
    };
    return labels[action] || action;
}
