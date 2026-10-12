import type { MappingAction, PatternMappingAction } from '@/types';

export const MAPPING_ACTIONS = [
    'keep',
    'redirect',
    'merge',
    'split',
    'delete',
] as const satisfies readonly MappingAction[];

const mappingActions = new Set<string>(MAPPING_ACTIONS);

export function isMappingAction(value: unknown): value is MappingAction {
    return typeof value === 'string' && mappingActions.has(value);
}

export function normalizeMappingAction(
    value: unknown,
    fallback: MappingAction = 'redirect',
): MappingAction {
    return isMappingAction(value) ? value : fallback;
}

export function normalizePatternMappingAction(
    value: unknown,
    fallback: PatternMappingAction = 'redirect',
): PatternMappingAction {
    const normalized = normalizeMappingAction(value, fallback);
    return normalized === 'split' ? fallback : normalized;
}
