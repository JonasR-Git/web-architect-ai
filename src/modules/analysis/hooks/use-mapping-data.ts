import { useMemo } from 'react';
import { SiteStructure, MigrationPlan, ClusterOverrides, SourcePage, TargetSlot } from '@/types';
import { groupSimilarPages } from '@/modules/core/utils/grouping';
import { buildIdLookup, resolveSourceId } from '@/modules/analysis/utils/mapping-ids';
import { ID_PREFIXES } from '@/modules/core/constants/ids';

export interface MappingDataResult {
  mappingSources: SourcePage[];
  mappingTargets: TargetSlot[];
}

/**
 * Hook for computing mapping sources and targets for the Blueprint view
 * Extracts complex mapping logic from page.tsx into a reusable hook
 */
export function useMappingData(
  normalizedStructure: SiteStructure | null,
  migrationPlan: MigrationPlan | null,
  clusterOverrides: ClusterOverrides
): MappingDataResult {
  const mappingSources = useMemo(() => {
    if (!normalizedStructure) return [];

    const grouped = groupSimilarPages(normalizedStructure, 2, 5, clusterOverrides);
    const sources: SourcePage[] = [];

    grouped.groups.forEach((group: any) => {
      sources.push({
        id: group.pattern,
        url: group.pattern,
        title: `Cluster: ${group.pattern}`,
        type: 'cluster',
        count: group.totalCount
      });
    });

    grouped.uniquePages.forEach((node: any) => {
      sources.push({
        id: `${ID_PREFIXES.PAGE}${node.url}`,
        url: node.url,
        title: node.meta?.title || node.title || node.url,
        type: 'page'
      });
    });

    return sources;
  }, [normalizedStructure, clusterOverrides]);

  const mappingTargets = useMemo(() => {
    if (!normalizedStructure || !migrationPlan) return [];

    const grouped = groupSimilarPages(normalizedStructure, 2, 5, clusterOverrides);
    const lookup = buildIdLookup(grouped.groups, grouped.uniquePages);

    const normalizePath = (path: string): string => {
      if (!path || path === '/') return '/';
      return path.replace(/\/$/, '');
    };

    const targetMap = new Map<string, any>();

    const resolveDeduplicatedKey = (rawKey: string): string => {
      const suffixMatch = rawKey.match(/^(.+)-(\d+)$/);
      if (suffixMatch) {
        const basePath = suffixMatch[1];
        if (targetMap.has(basePath)) return basePath;
      }
      return rawKey;
    };

    targetMap.set('layout', {
      id: ID_PREFIXES.LAYOUT,
      path: 'layout',
      label: 'layout',
      type: 'layout',
      action: 'keep',
      sourceIds: [],
    });

    migrationPlan.sitemap?.forEach((s: any) => {
      const rawPath = s.path;
      if (!rawPath) return;

      const key = normalizePath(rawPath);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `${ID_PREFIXES.TARGET}${key}`,
          path: key,
          label: s.label || key,
          type: s.type || 'page',
          action: 'keep',
          sourceIds: [],
        });
      }
    });

    migrationPlan.pattern_mapping?.forEach((pm: any) => {
      const rawPath = pm.target_base;
      if (!rawPath) return;

      const key = normalizePath(rawPath);
      const sourceId = resolveSourceId(pm.pattern, lookup);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `${ID_PREFIXES.TARGET}${key}`,
          path: key,
          label: key,
          type: pm.type || 'page',
          action: pm.action || 'redirect',
          sourceIds: sourceId ? [sourceId] : [],
          description: pm.reason
        });
      } else if (sourceId) {
        const target = targetMap.get(key)!;
        if (!target.sourceIds.includes(sourceId)) {
          target.sourceIds.push(sourceId);
        }
      }
    });

    migrationPlan.page_mapping?.forEach((m: any) => {
      const rawPath = m.new_path || m.old_url;
      if (!rawPath) return;

      let key = normalizePath(rawPath);
      const sourceId = m.old_url ? resolveSourceId(m.old_url, lookup) : null;

      key = resolveDeduplicatedKey(key);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `${ID_PREFIXES.TARGET}${key}`,
          path: key,
          label: key,
          type: m.type || 'page',
          action: m.action || 'keep',
          sourceIds: sourceId ? [sourceId] : [],
          description: m.reason || m.description
        });
      } else if (sourceId) {
        const target = targetMap.get(key)!;
        if (!target.sourceIds.includes(sourceId)) {
          target.sourceIds.push(sourceId);
        }
      }
    });

    return Array.from(targetMap.values());
  }, [normalizedStructure, clusterOverrides, migrationPlan]);

  return {
    mappingSources,
    mappingTargets,
  };
}
