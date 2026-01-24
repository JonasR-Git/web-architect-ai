'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
    id: string;
    title: string;
    description: string;
    details?: string;
    type?: 'command' | 'code' | 'manual';
    command?: string;
    code_snippet?: string;
    file_path?: string;
    rules?: string[];
    validation?: string;
    instructions?: string[]; // Detailed instructions list
}

interface Phase {
    id: string;
    title: string;
    description: string;
    steps: Step[];
}

interface AnalysisSummary {
    entities: { name: string; attributes: string[] }[];
    ui_features: string[];
}

interface PlanViewerProps {
    spec: any; // The JSON Spec
    plan: string | {
        title?: string;
        analysis_summary?: AnalysisSummary;
        file_structure?: string; // ASCII tree (new format)
        project_structure?: { path: string; description: string }[]; // Array (old format)
        dependencies?: string[] | { name: string; version: string; purpose: string }[];
        content_files?: { path: string; sections?: string[]; used_in?: string[] }[];
        phases?: Phase[];
        steps?: Step[]; // Legacy fallback
    };
}

export function PlanViewer({ plan }: PlanViewerProps) {
    // Generate Markdown if object, or use directly if string
    const markdownContent = typeof plan === 'string' ? plan : generateMarkdown(plan);

    // Calculate stats
    const stats = typeof plan === 'string' ? {
        steps: (plan.match(/\*\*Step \d+\.\d+/g) || []).length,
        files: (plan.match(/- \*\*File\*\*: `/g) || []).length,
        phases: (plan.match(/## Phase \d+/g) || []).length
    } : {
        steps: plan.phases ? plan.phases.reduce((acc: any, p: any) => acc + (p.steps?.length || 0), 0) : plan.steps?.length || 0,
        files: plan.project_structure?.length || plan.content_files?.length || 0,
        phases: plan.phases?.length || 0
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center bg-black/40 backdrop-blur border border-white/10 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <FileJson className="w-8 h-8 text-blue-500" />
                    <div>
                        <h2 className="text-xl font-bold text-white">Implementation Guide</h2>
                        <p className="text-sm text-gray-400">Generated Implementation Plan (.md)</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="bg-blue-600 hover:bg-blue-500 border-transparent text-white shadow-lg shadow-blue-900/20"
                    onClick={() => navigator.clipboard.writeText(markdownContent)}
                >
                    <Copy className="w-4 h-4 mr-2" /> Copy Markdown
                </Button>
            </div>

            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden relative group/md shadow-2xl">
                <ScrollArea className="h-[750px] w-full p-8">
                    <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed select-text">
                        {markdownContent}
                    </pre>
                </ScrollArea>
            </div>

            <div className="flex justify-center gap-8 opacity-40 hover:opacity-80 transition-opacity text-xs text-gray-500">
                <span>Steps: {stats.steps}</span>
                <span>Files: {stats.files}</span>
                <span>Phases: {stats.phases}</span>
            </div>
        </div>
    );
}

// Utility to generate the Markdown string
function generateMarkdown(plan: any): string {
    // Use the title from the plan if available
    let md = `# ${plan.title || 'Technical Implementation Guide'}\n\n`;

    // 1. Analysis Summary
    if (plan.analysis_summary) {
        md += `## 1. Analysis Summary\n\n`;

        if (plan.analysis_summary.entities && plan.analysis_summary.entities.length > 0) {
            md += `### Core Business Entities\n`;
            plan.analysis_summary.entities.forEach((e: any) => {
                md += `\n**${e.name}**\n`;
                if (e.attributes && Array.isArray(e.attributes)) {
                    md += `| Attribute | Type | Description |\n|-----------|------|-------------|\n`;
                    e.attributes.forEach((attr: any) => {
                        if (typeof attr === 'string') {
                            md += `| ${attr} | - | - |\n`;
                        } else {
                            md += `| ${attr.name || '-'} | ${attr.type || '-'} | ${attr.description || '-'} |\n`;
                        }
                    });
                }
                if (e.relationships && e.relationships.length > 0) {
                    md += `\nRelationships: ${e.relationships.join(', ')}\n`;
                }
            });
            md += `\n`;
        }

        if (plan.analysis_summary.ui_features && plan.analysis_summary.ui_features.length > 0) {
            md += `### UI Features Identified\n`;
            plan.analysis_summary.ui_features.forEach((f: string) => {
                md += `- ${f}\n`;
            });
            md += `\n`;
        }

        if (plan.analysis_summary.stack_notes) {
            md += `### Stack Impact Notes\n${plan.analysis_summary.stack_notes}\n\n`;
        }
    }

    // 2. File Structure (supports both array and ASCII tree string)
    md += `## 2. File Structure\n\n`;
    if (plan.file_structure && typeof plan.file_structure === 'string') {
        md += `\`\`\`\n${plan.file_structure}\n\`\`\`\n\n`;
    } else if (plan.project_structure && Array.isArray(plan.project_structure)) {
        plan.project_structure.forEach((f: any) => {
            md += `- \`${f.path}\`: ${f.description}\n`;
        });
        md += `\n`;
    }

    // 3. Content Files
    if (plan.content_files && plan.content_files.length > 0) {
        md += `## 3. Content Files\n\n`;
        plan.content_files.forEach((cf: any) => {
            md += `- **${cf.path}**\n`;
            if (cf.sections) md += `  - Sections: ${cf.sections.join(', ')}\n`;
            if (cf.used_in) md += `  - Used in: ${cf.used_in.join(', ')}\n`;
        });
        md += `\n`;
    }

    // 4. Implementation Steps
    md += `## ${plan.content_files ? '4' : '3'}. Implementation Steps (Phased)\n\n`;
    if (plan.phases) {
        plan.phases.forEach((phase: any) => {
            md += `### ${phase.title}\n`;
            if (phase.description) md += `${phase.description}\n`;
            if (phase.estimated_time) md += `*Estimated time: ${phase.estimated_time}*\n`;
            md += `\n`;

            phase.steps.forEach((step: any) => {
                md += `#### ${step.title}\n`;
                if (step.file_path) md += `**File**: \`${step.file_path}\`\n`;
                if (step.action) md += `**Action**: ${step.action.charAt(0).toUpperCase() + step.action.slice(1)}\n`;
                md += `\n`;

                if (step.instructions && step.instructions.length > 0) {
                    md += `**Instructions**:\n`;
                    step.instructions.forEach((inst: string, idx: number) => {
                        md += `${idx + 1}. ${inst}\n`;
                    });
                    md += `\n`;
                }

                if (step.content_reference) {
                    md += `**Content Reference**: ${step.content_reference}\n\n`;
                }

                if (step.validation) {
                    md += `**Validation**: ${step.validation}\n\n`;
                }

                md += `---\n\n`;
            });
        });
    } else if (plan.steps) {
        // Fallback for legacy
        plan.steps.forEach((step: any) => {
            md += `- [ ] **${step.title}**\n`;
            if (step.description) md += `  - ${step.description}\n`;
        });
    }

    return md;
}
