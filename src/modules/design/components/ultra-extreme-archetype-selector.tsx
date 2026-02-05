/**
 * Ultra-Extreme Archetype Selector Component
 *
 * Allows users to select from 15 ultra-extreme design archetypes across 5 categories
 * Always uses 5-stage premium generation (Foundation → Archetype → Experimental Push → Critique → Polish)
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Skull } from 'lucide-react';
import {
  ULTRA_EXTREME_ARCHETYPES,
  UltraExtremeArchetype,
} from '@/modules/design/data/ultra-extreme-archetypes';

interface UltraExtremeArchetypeSelectorProps {
  selected?: string; // Archetype ID
  category?: string; // Category name
  onChange: (archetypeId: string, category: string) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'reality-manipulation': '🌀 Reality Manipulation',
  'algorithmic-chaos': '🔢 Algorithmic Chaos',
  'kinetic-expression': '💨 Kinetic Expression',
  'minimalism-extremes': '⬛ Minimalism Extremes',
  'sensory-expansion': '🎨 Sensory Expansion',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'reality-manipulation': 'Impossible geometry, recursive patterns, dimensional shifts',
  'algorithmic-chaos': 'Fractals, glitch aesthetics, noise-driven layouts',
  'kinetic-expression': 'Dynamic typography, fluid interfaces, gravity-defying stacks',
  'minimalism-extremes': 'Extreme whitespace, mono-element designs, typographic brutalism',
  'sensory-expansion': 'Synesthetic colors, crystalline structures, spatial depth',
};

export function UltraExtremeArchetypeSelector({
  selected,
  category,
  onChange,
  className,
}: UltraExtremeArchetypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    category || 'reality-manipulation'
  );

  const currentArchetypes = ULTRA_EXTREME_ARCHETYPES[selectedCategory as keyof typeof ULTRA_EXTREME_ARCHETYPES] || [];

  const handleArchetypeSelect = (archetype: UltraExtremeArchetype) => {
    onChange(archetype.id, selectedCategory);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          Ultra-Extreme Archetype
          <span className="text-[10px] text-red-400 font-normal">(Required)</span>
        </h3>
        <span className="px-2 py-1 text-[9px] font-bold text-red-300 bg-red-500/20 border border-red-500/30 rounded-full uppercase tracking-wider">
          5-Stage Generation
        </span>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Select Category</label>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-all text-left',
                  isSelected
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-300'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 italic">
          {CATEGORY_DESCRIPTIONS[selectedCategory]}
        </p>
      </div>

      {/* Archetype Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {currentArchetypes.map((archetype) => {
          const isSelected = selected === archetype.id;
          const Icon = archetype.icon;

          return (
            <button
              key={archetype.id}
              onClick={() => handleArchetypeSelect(archetype)}
              className={cn(
                'relative p-4 rounded-xl border text-left transition-all hover:scale-[1.02] group',
                isSelected
                  ? 'bg-gradient-to-br from-red-500/20 to-purple-500/20 border-red-500 ring-2 ring-offset-2 ring-offset-[#050505] ring-red-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected
                      ? 'bg-gradient-to-br from-red-500 to-purple-600'
                      : 'bg-white/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isSelected ? 'text-white' : 'text-gray-400'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={cn(
                      'font-semibold text-sm',
                      isSelected ? 'text-white' : 'text-gray-300'
                    )}
                  >
                    {archetype.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {archetype.description}
                  </p>
                </div>
              </div>

              {/* CSS Techniques */}
              <div className="space-y-1.5 mb-3">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
                  CSS Techniques
                </div>
                {archetype.cssTechniques.slice(0, 3).map((technique, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 text-[10px] text-gray-400"
                  >
                    <span className="text-gray-600">•</span>
                    <span className="font-mono">{technique}</span>
                  </div>
                ))}
              </div>

              {/* Design Principles Preview */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
                  Key Principles
                </div>
                <div className="flex flex-wrap gap-1">
                  {archetype.designPrinciples.slice(0, 2).map((principle, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-medium',
                        isSelected
                          ? 'text-red-300 bg-white/10'
                          : 'text-gray-500 bg-white/5'
                      )}
                    >
                      {principle.length > 40
                        ? principle.substring(0, 37) + '...'
                        : principle}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Skull className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-300">
            <span className="font-semibold text-purple-300">5-Stage Process:</span>{' '}
            Foundation → Archetype Application → Experimental Push → Self-Critique → Extreme Polish.{' '}
            <span className="text-gray-500">
              Expect quality scores 60-85 (experimental designs by nature).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
