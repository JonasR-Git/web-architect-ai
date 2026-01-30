import {
    ClusterSpec,
    ClusterTemplate,
    PageInstance,
    TargetSlot
} from '@/types';
import { extractSlugFromUrl } from '@/lib/url-utils';

/**
 * Template Generator Service
 *
 * Generates cluster templates using representative examples selected by the 60th percentile strategy.
 * Creates detailed generation instructions for implementing instances from templates.
 */
export class TemplateGenerator {
    /**
     * Selects a representative example using the 60th percentile strategy
     *
     * Sorts instances by word count and selects the one at the 60th percentile,
     * which represents a "typical" page with moderate content.
     */
    static selectRepresentativeExample(instances: PageInstance[]): PageInstance {
        if (instances.length === 0) {
            throw new Error('Cannot select representative example from empty instances array');
        }

        if (instances.length === 1) {
            return instances[0];
        }

        // Sort by word count (descending)
        const sorted = [...instances].sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));

        // Select 60th percentile
        const targetIndex = Math.floor(sorted.length * 0.6);
        return sorted[targetIndex];
    }

    /**
     * Generates templates for all clusters
     *
     * For each cluster, selects a representative example and creates a template
     * with generation instructions for creating all instances.
     */
    static generateClusterTemplates(
        clusters: ClusterSpec[],
        pageSpecs: TargetSlot[]
    ): ClusterTemplate[] {
        return clusters.map(cluster => {
            const representative = this.selectRepresentativeExample(cluster.instances);

            // Find the corresponding page spec for this cluster
            const templateSpec = pageSpecs.find(spec =>
                spec.sourceIds.includes(cluster.id)
            );

            if (!templateSpec) {
                // Create a default template spec if not found
                const defaultSpec: TargetSlot = {
                    id: `spec-${cluster.id}`,
                    path: cluster.pattern,
                    label: cluster.pattern,
                    action: 'keep',
                    sourceIds: [cluster.id],
                    type: 'page'
                };

                return {
                    clusterId: cluster.id,
                    pattern: cluster.pattern,
                    representativeExample: representative,
                    templateSpec: defaultSpec,
                    instanceCount: cluster.instances.length,
                    generationInstructions: this.buildGenerationInstructions(cluster, defaultSpec)
                };
            }

            return {
                clusterId: cluster.id,
                pattern: cluster.pattern,
                representativeExample: representative,
                templateSpec,
                instanceCount: cluster.instances.length,
                generationInstructions: this.buildGenerationInstructions(cluster, templateSpec)
            };
        });
    }

    /**
     * Builds detailed generation instructions for implementing instances from a template
     */
    private static buildGenerationInstructions(
        cluster: ClusterSpec,
        templateSpec: TargetSlot
    ): string {
        const instanceCount = cluster.instances.length;
        const pattern = cluster.pattern;

        let instructions = `# Cluster Template: ${pattern}\n\n`;
        instructions += `## Überblick\n\n`;
        instructions += `Dieses Template repräsentiert **${instanceCount} Seiten** mit der URL-Struktur \`${pattern}\`.\n\n`;

        instructions += `## Template-Struktur\n\n`;
        instructions += `**Ziel-Pfad:** \`${templateSpec.path}\`\n`;
        instructions += `**Aktion:** ${this.getActionLabel(templateSpec.action || 'keep')}\n`;

        if (templateSpec.description) {
            instructions += `**Beschreibung:** ${templateSpec.description}\n`;
        }

        instructions += `\n## Dynamische Content-Injektion\n\n`;
        instructions += `Für jede Instanz müssen folgende Schritte durchgeführt werden:\n\n`;

        instructions += `### 1. URL-Mapping\n\n`;
        instructions += `- Ersetze \`[slug]\` oder andere Wildcards im Pfad mit dem tatsächlichen Wert aus der Source-URL\n`;
        instructions += `- Beispiel: \`${pattern}\` → Extrahiere den Slug aus der jeweiligen Source-URL\n\n`;

        instructions += `### 2. Content-Mapping\n\n`;
        instructions += `Für jede Instanz sollten folgende Inhalte aus der Source-Seite übernommen werden:\n\n`;
        instructions += `- **Title:** Aus \`source.meta.title\`\n`;
        instructions += `- **Description:** Aus \`source.meta.description\`\n`;
        instructions += `- **Heading (H1):** Aus \`source.content.h1\`\n`;
        instructions += `- **Body Content:** Aus \`source.content.rawText\` oder \`source.content.semanticBlocks\`\n`;
        instructions += `- **Images:** Aus \`source.content.images\` (gefiltert nach Rolle und Relevanz)\n\n`;

        if (templateSpec.sections && templateSpec.sections.length > 0) {
            instructions += `### 3. Section-Structure\n\n`;
            instructions += `Das Template enthält ${templateSpec.sections.length} Sections:\n\n`;

            templateSpec.sections.forEach((section, index) => {
                instructions += `#### Section ${index + 1}: ${section.type}\n\n`;

                if (section.headline) {
                    instructions += `- **Headline:** ${section.headline}\n`;
                }

                if (section.content) {
                    const preview = section.content.substring(0, 100);
                    instructions += `- **Content Preview:** ${preview}${section.content.length > 100 ? '...' : ''}\n`;
                }

                if (section.images && section.images.length > 0) {
                    instructions += `- **Images:** ${section.images.length} Bild(er)\n`;
                }

                instructions += `\n`;
            });
        }

        instructions += `## Instanz-URLs\n\n`;
        instructions += `Die folgenden ${instanceCount} URLs gehören zu diesem Cluster:\n\n`;

        cluster.instances.forEach((instance, index) => {
            const slug = extractSlugFromUrl(instance.url);
            const targetPath = pattern.replace(/\[slug\]/, slug).replace(/\[id\]/, slug).replace(/\[.*?\]/, slug);

            instructions += `${index + 1}. \`${instance.url}\`\n`;
            instructions += `   - Title: ${instance.title}\n`;
            instructions += `   - Target: \`${targetPath}\`\n`;
            instructions += `   - Word Count: ${instance.wordCount || 0}\n`;

            if (index < 5 || index === instanceCount - 1) {
                // Show first 5 and last one
            } else if (index === 5) {
                instructions += `   ...\n`;
            }

            if (index < 5 || index === instanceCount - 1) {
                instructions += `\n`;
            }
        });

        instructions += `\n## Implementation Notes\n\n`;
        instructions += `1. **Template First:** Implementiere zunächst das Master-Template mit Platzhaltern\n`;
        instructions += `2. **Data Mapping:** Erstelle eine Mapping-Funktion, die Source-Daten in Template-Props überführt\n`;
        instructions += `3. **Batch Generation:** Generiere alle Instanzen in einem Durchlauf\n`;
        instructions += `4. **Validation:** Prüfe, ob alle ${instanceCount} Instanzen korrekt generiert wurden\n`;
        instructions += `5. **Content Quality:** Stelle sicher, dass instanz-spezifische Inhalte korrekt injiziert wurden\n\n`;

        instructions += `## Responsive Images\n\n`;
        instructions += `Für alle Bilder sollten responsive Varianten generiert werden:\n`;
        instructions += `- Desktop: 1920px\n`;
        instructions += `- Tablet: 768px\n`;
        instructions += `- Mobile: 480px\n\n`;

        instructions += `## SEO Considerations\n\n`;
        instructions += `- Einzigartige \`<title>\` und \`<meta description>\` für jede Instanz\n`;
        instructions += `- Kanonische URLs korrekt setzen\n`;
        instructions += `- Strukturierte Daten (Schema.org) wenn vorhanden übernehmen\n`;

        return instructions;
    }

    /**
     * Gets a human-readable label for an action
     */
    private static getActionLabel(action: string): string {
        const labels: Record<string, string> = {
            keep: 'Beibehalten',
            redirect: 'Umleiten',
            merge: 'Zusammenführen',
            delete: 'Löschen'
        };
        return labels[action] || action;
    }
}
