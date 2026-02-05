import { BlueprintTabs, BlueprintTab } from '@/modules/analysis/components/visualization/BlueprintTabs';
import { BFSGAuditViewer } from '@/modules/analysis/components/visualization/bfsg-audit-viewer';
import { ComponentSpecViewer } from '@/modules/analysis/components/visualization/component-spec-viewer';
import { DualPanelMapper } from '@/modules/analysis/components/visualization/dual-panel-mapper';
import { Button } from '@/components/ui/button';
import { saveMappingChanges } from '@/modules/analysis/services/mapping-persistence';
import { toast } from 'sonner';
import {
  SiteStructure,
  MigrationPlan,
  ComponentSpecification,
  CritiqueResult,
  SourcePage,
  TargetSlot,
  PageMapping,
} from '@/types';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface BlueprintViewProps {
  structure: SiteStructure | null;
  migrationPlan: MigrationPlan;
  componentSpec: ComponentSpecification | null;
  critique: CritiqueResult | null;
  mappingSources: SourcePage[];
  mappingTargets: TargetSlot[];
  blueprintTab: BlueprintTab;
  pageSpecs: TargetSlot[] | null;
  reconstructedTargets: TargetSlot[];
  isProcessing: boolean;
  onTabChange: (tab: BlueprintTab) => void;
  onGenerateSpecs: (targets: TargetSlot[]) => Promise<TargetSlot[]>;
  onNavigateToContentReview: () => void;
  onSaveMappingChanges: (newPageMapping: any[], newPatternMapping: any[]) => void;
}

/**
 * Blueprint view - displays AI analysis results with tabs
 * Includes Overview (Stats, BFSG Audit), Components, and Mapping
 */
export function BlueprintView({
  structure,
  migrationPlan,
  componentSpec,
  critique,
  mappingSources,
  mappingTargets,
  blueprintTab,
  pageSpecs,
  reconstructedTargets,
  isProcessing,
  onTabChange,
  onGenerateSpecs,
  onNavigateToContentReview,
  onSaveMappingChanges,
}: BlueprintViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Proposed Architecture (V3)</h2>
            <p className="text-gray-400 text-sm">Review and edit the new sitemap structure.</p>
          </div>
          <div className="flex items-center gap-3">
            {!pageSpecs ? (
              <Button
                onClick={() => onGenerateSpecs(reconstructedTargets)}
                className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                disabled={reconstructedTargets.length === 0}
              >
                <Sparkles size={14} className="mr-2" /> AI Plan Generieren
              </Button>
            ) : (
              <Button
                onClick={onNavigateToContentReview}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg"
              >
                Next: Review Content <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <BlueprintTabs
          activeTab={blueprintTab}
          onTabChange={onTabChange}
          mappingCount={(migrationPlan.page_mapping?.length || 0) + (migrationPlan.pattern_mapping?.length || 0)}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {/* OVERVIEW TAB */}
        {blueprintTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* BFSG Audit Viewer */}
            {critique && (
              <BFSGAuditViewer data={critique} />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">{structure?.nodes?.length || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Original Seiten</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-white">{migrationPlan.sitemap?.length || 0}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Neue Struktur</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-emerald-400">
                  {migrationPlan.page_mapping?.filter((m: PageMapping) => m.action === 'keep').length || 0}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Beibehalten</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="text-2xl font-bold text-amber-400">
                  {migrationPlan.page_mapping?.filter((m: PageMapping) => m.action === 'merge' || m.action === 'redirect').length || 0}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Geändert</div>
              </div>
            </div>

            {/* Rationale */}
            {migrationPlan.rationale && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Migration Strategie</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{migrationPlan.rationale}</p>
              </div>
            )}
          </div>
        )}

        {/* COMPONENTS TAB */}
        {blueprintTab === 'components' && (
          <div className="h-[600px] overflow-y-auto custom-scrollbar animate-in fade-in pr-2">
            <ComponentSpecViewer spec={componentSpec} isLoading={isProcessing} />
          </div>
        )}

        {/* MAPPING TAB */}
        {blueprintTab === 'mapping' && (
          <div className="animate-in fade-in h-[800px]">
            {((migrationPlan.page_mapping?.length ?? 0) > 0 || (migrationPlan.pattern_mapping?.length ?? 0) > 0 || mappingSources.length > 0) ? (
              <DualPanelMapper
                sources={mappingSources}
                initialTargets={mappingTargets}
                onSave={(targets) => {
                  const { newPageMapping, newPatternMapping } = saveMappingChanges(targets, migrationPlan);
                  onSaveMappingChanges(newPageMapping, newPatternMapping);
                  toast.success(`Gespeichert: ${newPatternMapping.length} Cluster + ${newPageMapping.length} Seiten`);
                }}
                onGenerateSpecs={onGenerateSpecs}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Keine Seitenübertragung verfügbar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
