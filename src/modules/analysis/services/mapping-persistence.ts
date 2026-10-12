import { TargetSlot, MigrationPlan } from '@/types';
import { normalizePatternMappingAction } from '@/modules/analysis/utils/mapping-actions';
import { ID_PREFIXES } from '@/modules/core/constants/ids';

export interface MappingPersistenceResult {
  newPageMapping: any[];
  newPatternMapping: any[];
}

/**
 * Service for persisting mapping changes from DualPanelMapper
 * Separates cluster patterns from individual page mappings
 */
export function saveMappingChanges(
  targets: TargetSlot[],
  migrationPlan: MigrationPlan
): MappingPersistenceResult {
  const newPageMapping: any[] = [];
  const newPatternMapping: any[] = [];

  targets.forEach(t => {
    t.sourceIds.forEach((sId: string) => {
      // Check if this is a cluster pattern
      const cluster = migrationPlan.clusters?.find((c: any) => c.pattern === sId);

      if (cluster) {
        // CLUSTER → pattern_mapping (compact storage)
        newPatternMapping.push({
          pattern: sId,
          target_base: t.path,
          action: normalizePatternMappingAction(t.action),
          type: t.type,
          reason: `Cluster with ${cluster.instances?.length || 0} pages`,
          description: t.description,
          content_goals: t.content_goals
        });
      } else if (sId.startsWith(ID_PREFIXES.PAGE)) {
        // INDIVIDUAL PAGE → page_mapping
        const url = sId.substring(ID_PREFIXES.PAGE.length);

        // Find original mapping to preserve metadata
        const original = migrationPlan.page_mapping?.find((m: any) => m.old_url === url);

        if (original) {
          newPageMapping.push({
            ...original,
            new_path: t.path,
            action: t.action,
            type: t.type,
            ...(t.description ? { description: t.description, content_goals: t.content_goals } : {})
          });
        } else {
          // Fallback: create new mapping
          newPageMapping.push({
            old_url: url,
            new_path: t.path,
            action: t.action,
            type: t.type,
            reason: 'Unique page mapping',
            description: t.description,
            content_goals: t.content_goals
          });
        }
      }
    });
  });

  console.log('[Blueprint] Saving:', {
    patterns: newPatternMapping.length,
    pages: newPageMapping.length,
    total: newPatternMapping.length + newPageMapping.length
  });

  return { newPageMapping, newPatternMapping };
}
