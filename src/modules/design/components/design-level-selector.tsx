/**
 * Design Level Selector
 *
 * Allows users to choose between:
 * - Standard: Ordentlich/Strukturiert (3-stage, classic design)
 * - Semi-Unleashed: Zwischending (4-stage, creative but controlled)
 * - Unleashed: Chaotisch/Einzigartig (5-stage ultra-extreme with archetypes)
 */

'use client';

import { cn } from '@/lib/utils';
import { Sparkles, Zap, Flame } from 'lucide-react';

export type DesignLevel = 'standard' | 'semi-unleashed' | 'unleashed';

interface DesignLevelSelectorProps {
  selected?: DesignLevel;
  onChange: (level: DesignLevel) => void;
  className?: string;
}

const DESIGN_LEVELS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    icon: Sparkles,
    description: 'Ordentlich & Strukturiert',
    details: '5-Stage Generation • Klassisches Design • Professionell',
    stages: 5,
    cost: '~$0.10',
    time: '~5min',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-300',
  },
  {
    id: 'semi-unleashed' as const,
    name: 'Semi-Unleashed',
    icon: Zap,
    description: 'Kreativ & Ausgewogen',
    details: '5-Stage Generation • Experimentell aber kontrolliert',
    stages: 5,
    cost: '~$0.10',
    time: '~5min',
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-300',
  },
  {
    id: 'unleashed' as const,
    name: 'Unleashed',
    icon: Flame,
    description: 'Chaotisch & Einzigartig',
    details: '5-Stage Generation • Grenzenlos experimentell',
    stages: 5,
    cost: '~$0.10',
    time: '~5min',
    gradient: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-300',
  },
];

export function DesignLevelSelector({
  selected = 'standard',
  onChange,
  className,
}: DesignLevelSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Design Level</h3>
        <span className="text-xs text-gray-500">
          Wähle deine Kreativitätsstufe
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DESIGN_LEVELS.map((level) => {
          const Icon = level.icon;
          const isSelected = selected === level.id;

          return (
            <button
              key={level.id}
              onClick={() => onChange(level.id)}
              className={cn(
                'group relative p-4 rounded-xl border transition-all',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? `bg-gradient-to-br ${level.gradient} ${level.border}`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              {/* Icon & Badge */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                    isSelected
                      ? `bg-gradient-to-br ${level.gradient.replace('/20', '/40')}`
                      : 'bg-white/10'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isSelected ? level.iconColor : 'text-gray-400')} />
                </div>

                {/* Stage Badge */}
                <span
                  className={cn(
                    'px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider',
                    isSelected
                      ? `${level.textColor} bg-white/20 border ${level.border}`
                      : 'text-gray-500 bg-white/5 border border-white/10'
                  )}
                >
                  {level.stages}-Stage
                </span>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4
                  className={cn(
                    'text-sm font-bold transition-colors',
                    isSelected ? 'text-white' : 'text-gray-300'
                  )}
                >
                  {level.name}
                </h4>

                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isSelected ? level.textColor : 'text-gray-400'
                  )}
                >
                  {level.description}
                </p>

                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {level.details}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 pt-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    ⏱️ {level.time}
                  </span>
                  <span className="flex items-center gap-1">
                    💰 {level.cost}
                  </span>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={cn('w-3 h-3 rounded-full', level.iconColor.replace('text-', 'bg-'))} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Text based on selection */}
      {selected === 'standard' && (
        <div className="text-xs text-gray-500 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <span className="font-medium text-blue-400">Standard:</span> Professionelle, strukturierte Designs
          mit bewährten Layouts und klassischer Ästhetik.
        </div>
      )}

      {selected === 'semi-unleashed' && (
        <div className="text-xs text-gray-500 bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          <span className="font-medium text-purple-400">Semi-Unleashed:</span> Kreative Designs mit
          experimentellen Elementen, aber kontrolliert und professionell.
        </div>
      )}

      {selected === 'unleashed' && (
        <div className="text-xs text-gray-500 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
          <span className="font-medium text-red-400">Unleashed:</span> Ultra-extreme, grenzenlose Designs!
          Wähle einen Archetype unten für maximale Kreativität.
        </div>
      )}
    </div>
  );
}
