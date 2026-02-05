import { MigrationPlan, TargetSlot, PageMapping } from '@/types';

/**
 * Service for merging page specs into migration plan
 * Used when user approves content strategy in ContentReviewEditor
 */
export function mergeSpecsIntoMigrationPlan(
  migrationPlan: MigrationPlan,
  pageSpecs: TargetSlot[]
): MigrationPlan {
  const updatedMapping: PageMapping[] = migrationPlan.page_mapping.map((m: PageMapping) => {
    const target = pageSpecs.find(t => t.path === (m.new_path || m.old_url));
    if (target) {
      return {
        ...m,
        description: target.description,
        content_goals: target.content_goals,
        sections: target.sections
      };
    }
    return m;
  });

  return {
    ...migrationPlan,
    page_mapping: updatedMapping
  };
}
