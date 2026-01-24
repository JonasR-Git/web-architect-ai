'use client';

import JSZip from 'jszip';

export interface ContentFile {
    path: string; // e.g., "content/home.md"
    content: string;
}

export interface OptimizedPageData {
    page_title: string;
    meta_description: string;
    h1?: string;
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
    let md = `# ${data.h1 || data.page_title}\n\n`;
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
    mockupHtml?: string
): Promise<Blob> {
    const zip = new JSZip();

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

    // Add content folder
    const contentFolder = zip.folder('content');
    if (contentFolder) {
        contentFiles.forEach((file) => {
            // Normalize path (remove leading slashes, use .md extension)
            let filename = file.path.replace(/^\//, '').replace(/\//g, '_');
            if (filename.length === 0) filename = 'landingpage'; // Default for root path
            contentFolder.file(filename + '.md', file.content);
        });
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
