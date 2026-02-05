import { useState, useEffect } from 'react';
import { usePersistence } from '@/hooks/use-persistence';
import {
  MigrationPlan,
  ComponentSpecification,
  TargetSlot,
} from '@/types';

export interface MigrationState {
  migrationPlan: MigrationPlan | null;
  setMigrationPlan: (plan: MigrationPlan | null | ((prev: MigrationPlan | null) => MigrationPlan | null)) => void;
  pageSpecs: TargetSlot[] | null;
  setPageSpecs: (specs: TargetSlot[] | null | ((prev: TargetSlot[] | null) => TargetSlot[] | null)) => void;
  componentSpec: ComponentSpecification | null;
  setComponentSpec: (spec: ComponentSpecification | null | ((prev: ComponentSpecification | null) => ComponentSpecification | null)) => void;
}

/**
 * Hook for managing migration-related state (migration plan, page specs, component spec)
 * Includes automatic persistence with 5s debounce
 */
export function useMigrationState(sessionId: string | null): MigrationState {
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);
  const [pageSpecs, setPageSpecs] = useState<TargetSlot[] | null>(null);
  const [componentSpec, setComponentSpec] = useState<ComponentSpecification | null>(null);

  const { saveMigration, saveSpecs } = usePersistence();

  // Auto-save migration plan (5s debounce)
  useEffect(() => {
    if (!migrationPlan || !sessionId) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving migration plan...');
      await saveMigration(sessionId, migrationPlan);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [migrationPlan, sessionId, saveMigration]);

  // Auto-save specs (5s debounce)
  useEffect(() => {
    if (!sessionId) return;
    if (!pageSpecs && !componentSpec) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving specs...');
      await saveSpecs(sessionId, {
        pageSpecs: pageSpecs || undefined,
        componentSpec: componentSpec || undefined,
      });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [pageSpecs, componentSpec, sessionId, saveSpecs]);

  return {
    migrationPlan,
    setMigrationPlan,
    pageSpecs,
    setPageSpecs,
    componentSpec,
    setComponentSpec,
  };
}
