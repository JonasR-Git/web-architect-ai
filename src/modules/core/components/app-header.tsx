import React from 'react';
import { Hexagon, ArrowRight, Zap, LayoutTemplate, BrainCircuit, Layers, FileText, Palette, Eye, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from '../hooks/use-ui-state';
import { SiteStructure, MigrationPlan, DesignConfig, TargetSlot, FinalOutput } from '@/types';

interface NavItemProps {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ id, label, icon: Icon, disabled, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all relative rounded-md",
      active ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300",
      disabled && "opacity-30 cursor-not-allowed"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

interface AppHeaderProps {
  currentView: ViewMode;
  structure: SiteStructure | null;
  migrationPlan: MigrationPlan | null;
  pageSpecs: TargetSlot[] | null;
  designConfig: DesignConfig;
  finalOutput: FinalOutput | null;
  onNavigate: (view: ViewMode) => void;
}

/**
 * Main application header with navigation
 * Extracted from page.tsx for better organization
 */
export function AppHeader({
  currentView,
  structure,
  migrationPlan,
  pageSpecs,
  designConfig,
  finalOutput,
  onNavigate,
}: AppHeaderProps) {
  return (
    <header className="relative z-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">WebArchitect <span className="text-blue-500">AI</span></h1>
          </div>
        </div>

        <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5 overflow-x-auto max-w-full scrollbar-none">
          <NavItem id="home" label="Start" icon={Zap} active={currentView === 'home'} onClick={() => onNavigate('home')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="crawl_result" label="Structure" icon={LayoutTemplate} disabled={!structure} active={currentView === 'crawl_result'} onClick={() => onNavigate('crawl_result')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="ai_analysis" label="Analysis" icon={BrainCircuit} disabled={!structure} active={currentView === 'ai_analysis'} onClick={() => onNavigate('ai_analysis')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="ai_result" label="Blueprint" icon={Layers} disabled={!migrationPlan} active={currentView === 'ai_result'} onClick={() => onNavigate('ai_result')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="content_review" label="Review" icon={FileText} disabled={!pageSpecs} active={currentView === 'content_review'} onClick={() => onNavigate('content_review')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="design_studio" label="Design" icon={Palette} disabled={!migrationPlan} active={currentView === 'design_studio'} onClick={() => onNavigate('design_studio')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="mockup_view" label="Preview" icon={Eye} disabled={!designConfig.mockupHtml} active={currentView === 'mockup_view'} onClick={() => onNavigate('mockup_view')} />
          <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
          <NavItem id="final_plan" label="Master Plan" icon={Terminal} disabled={!finalOutput} active={currentView === 'final_plan'} onClick={() => onNavigate('final_plan')} />
        </div>
      </div>
    </header>
  );
}
