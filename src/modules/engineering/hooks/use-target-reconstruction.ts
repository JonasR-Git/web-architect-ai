import { useMemo } from 'react';
import { MigrationPlan, TargetSlot } from '@/types';
import { ID_PREFIXES } from '@/modules/core/constants/ids';

/**
 * Hook for reconstructing target slots from migration plan
 * Used when generating page specs from the migration plan
 */
export function useTargetReconstruction(
  migrationPlan: MigrationPlan | null
): TargetSlot[] {
  return useMemo(() => {
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
          action: (pm.action === 'keep' || pm.action === 'redirect' || pm.action === 'merge' || pm.action === 'delete') ? pm.action : 'redirect',
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
          action: (m.action === 'keep' || m.action === 'redirect' || m.action === 'merge' || m.action === 'delete') ? m.action : 'redirect',
          sourceIds: [],
        });
      }
      const target = targetMap.get(key)!;
      target.sourceIds.push(`source-${i}`);
      if (m.action && (m.action === 'keep' || m.action === 'redirect' || m.action === 'merge' || m.action === 'delete')) target.action = m.action;
      if (m.type && (m.type === 'layout' || m.type === 'page')) target.type = m.type;
    });

    return Array.from(targetMap.values());
  }, [migrationPlan]);
}
