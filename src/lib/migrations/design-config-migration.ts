/**
 * Design Config Migration Logic
 *
 * Handles migration from old design config structure to new "Always Tier 3" architecture
 * - Removes obsolete fields (unleashedMode, creativityTier, archetypeIntensity, coreAesthetics)
 * - Resets archetype selection if it's not one of the 15 NEW ultra-extreme archetypes
 * - Preserves valid fields (stylePreset, colors, etc.)
 */

import { DesignConfig } from '@/types';
import { isUltraExtremeArchetype } from '@/modules/design/data/ultra-extreme-archetypes';

/**
 * List of obsolete fields that should be removed during migration
 */
const OBSOLETE_FIELDS = [
  'unleashedMode',
  'unleashedArchetype',
  'creativityTier',
  'archetypeIntensity',
  'coreAesthetics',
] as const;

/**
 * Migrates a design config from old structure to new structure
 *
 * @param oldConfig - Old design config object (potentially with obsolete fields)
 * @returns Cleaned design config with obsolete fields removed and invalid archetypes reset
 */
export function migrateDesignConfig(oldConfig: any): DesignConfig {
  // Create a copy to avoid mutating original
  const cleaned = { ...oldConfig };

  // Remove all obsolete fields
  OBSOLETE_FIELDS.forEach((field) => {
    if (field in cleaned) {
      delete cleaned[field];
    }
  });

  // Check if selectedArchetype is valid (one of the 15 NEW ultra-extreme archetypes)
  if (cleaned.selectedArchetype && !isUltraExtremeArchetype(cleaned.selectedArchetype)) {
    // Old archetype detected - reset to undefined so user must select a new one
    cleaned.selectedArchetype = undefined;
    cleaned.archetypeCategory = undefined;
  }

  // If archetype is valid but category is missing, we can't fix it here
  // (would need to import all archetypes to look up category)
  // Better to let the UI handle this edge case

  return cleaned as DesignConfig;
}

/**
 * Checks if a design config needs migration
 *
 * @param config - Design config to check
 * @returns true if config contains any obsolete fields
 */
export function needsMigration(config: any): boolean {
  return OBSOLETE_FIELDS.some((field) => field in config);
}

/**
 * Batch migration for multiple configs (e.g., mockup history)
 *
 * @param configs - Array of design configs
 * @returns Array of migrated configs
 */
export function batchMigrateDesignConfigs(configs: any[]): DesignConfig[] {
  return configs.map(migrateDesignConfig);
}

/**
 * Migration summary for logging/debugging
 *
 * @param oldConfig - Original config
 * @param newConfig - Migrated config
 * @returns Object describing what changed
 */
export function getMigrationSummary(oldConfig: any, newConfig: DesignConfig): {
  removedFields: string[];
  resetArchetype: boolean;
  wasModified: boolean;
} {
  const removedFields = OBSOLETE_FIELDS.filter((field) => field in oldConfig);
  const resetArchetype =
    oldConfig.selectedArchetype !== undefined &&
    newConfig.selectedArchetype === undefined;

  return {
    removedFields: Array.from(removedFields),
    resetArchetype,
    wasModified: removedFields.length > 0 || resetArchetype,
  };
}
