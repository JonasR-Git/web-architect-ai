/**
 * Archetype Selector Component
 *
 * Shows archetypes based on selected design level:
 * - Standard: 10-15 professional archetypes
 * - Semi-Unleashed: 10-15 creative archetypes
 * - Unleashed: 15 ultra-extreme archetypes
 */

'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { getArchetypesByLevel, type Archetype } from '@/modules/design/data/all-archetypes';

interface ArchetypeSelectorProps {
  selected?: string; // Archetype ID
  designLevel: 'standard' | 'semi-unleashed' | 'unleashed';
  onChange: (archetypeId: string) => void;
  className?: string;
}

const LEVEL_LABELS = {
  standard: {
    title: 'Professional Archetypes',
    description: 'Klassische, strukturierte Design-Stile',
    badge: 'Ordentlich',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  'semi-unleashed': {
    title: 'Creative Archetypes',
    description: 'Experimentell aber kontrolliert',
    badge: 'Kreativ',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  unleashed: {
    title: 'Ultra-Extreme Archetypes',
    description: 'Grenzenlos experimentell & einzigartig',
    badge: 'Chaotisch',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

export function ArchetypeSelector({
  selected,
  designLevel,
  onChange,
  className,
}: ArchetypeSelectorProps) {
  const archetypes = getArchetypesByLevel(designLevel);
  const levelInfo = LEVEL_LABELS[designLevel];

  const handleArchetypeSelect = (archetype: Archetype) => {
    onChange(archetype.id);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          {levelInfo.title}
          <span className="text-[10px] text-red-400 font-normal">(Required)</span>
        </h3>
        <span className={cn('px-2 py-1 text-[9px] font-bold border rounded-full uppercase tracking-wider', levelInfo.badgeColor)}>
          {levelInfo.badge}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400">{levelInfo.description}</p>

      {/* Archetype Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {archetypes.map((archetype) => {
          const Icon = archetype.icon;
          const isSelected = selected === archetype.id;

          return (
            <button
              key={archetype.id}
              onClick={() => handleArchetypeSelect(archetype)}
              className={cn(
                'group relative p-4 rounded-xl border transition-all text-left',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 ring-2 ring-purple-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              {/* Icon & Check */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                    isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isSelected ? 'text-purple-300' : 'text-gray-400')} />
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4
                  className={cn(
                    'text-sm font-bold transition-colors',
                    isSelected ? 'text-white' : 'text-gray-300'
                  )}
                >
                  {archetype.name}
                </h4>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                  {archetype.description}
                </p>

                {/* Design Principles (show on hover or selection) */}
                {isSelected && (
                  <ul className="text-[10px] text-gray-500 space-y-1 mt-2 pt-2 border-t border-white/10">
                    {archetype.designPrinciples.slice(0, 3).map((principle, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-purple-400">•</span>
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg p-3">
        <span className="font-medium text-white">💡 Tipp:</span> Jeder Archetype verwendet 5-Stage
        Generation (~5min, ~$0.10) für maximale Qualität.
      </div>
    </div>
  );
}
