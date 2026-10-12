import { useMemo } from 'react';
import { MigrationPlan, TargetSlot } from '@/types';
import { normalizeMappingAction, normalizePatternMappingAction } from '@/modules/analysis/utils/mapping-actions';
import { ID_PREFIXES } from '@/modules/core/constants/ids';

export function reconstructTargets(
  migrationPlan: MigrationPlan | null
): TargetSlot[] {
  if (!migrationPlan?.page_mapping && !migrationPlan?.pattern_mapping) {
    return [];
  }

  const targetMap = new Map<string, TargetSlot>();

    // 1. Initialize from sitemap to catch all structural targets (including layout)
    migrationPlan.sitemap?.forEach((s: any) => {
      const key = s.path;
      targetMap.set(key, {
        id: `${ID_PREFIXES.TARGET}${key}`,
        path: s.path,
        label: s.label || s.path,
        type: (s.type === 'layout' || s.type === 'page') ? s.type : 'page',
        action: 'keep', // Default, will be updated by mapping
        sourceIds: [],
      });
    });

    // 2a. Map sources from pattern_mapping (cluster mappings)
    migrationPlan.pattern_mapping?.forEach((pm: any) => {
      const key = pm.target_base;
      if (!key) return;
      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `${ID_PREFIXES.TARGET}${key}`,
          path: key,
          label: key,
          type: (pm.type === 'layout' || pm.type === 'page') ? pm.type : 'page',
          action: normalizePatternMappingAction(pm.action),
          sourceIds: [],
        });
      }
    });

    // 2b. Map sources from page_mapping
    migrationPlan.page_mapping?.forEach((m: any, i: number) => {
      const key = m.new_path || m.old_url;
      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `${ID_PREFIXES.TARGET}${key}`,
          path: m.new_path,
          label: m.new_path,
          type: (m.type === 'layout' || m.type === 'page') ? m.type : 'page',
          action: normalizeMappingAction(m.action),
          sourceIds: [],
        });
      }
      const target = targetMap.get(key)!;
      target.sourceIds.push(`source-${i}`);
      target.action = normalizeMappingAction(m.action, target.action);
      if (m.type && (m.type === 'layout' || m.type === 'page')) target.type = m.type;
    });

  return Array.from(targetMap.values());
}

/**
 * Hook for reconstructing target slots from migration plan
 * Used when generating page specs from the migration plan
 */
export function useTargetReconstruction(
  migrationPlan: MigrationPlan | null
): TargetSlot[] {
  return useMemo(() => reconstructTargets(migrationPlan), [migrationPlan]);
}
