/**
 * Style Preset Selector Component
 *
 * Allows users to select from 5 premium design presets for mockup generation
 */

'use client';

import { cn } from '@/lib/utils';
import { Check, Sparkles, Zap, Heart, Crown, Grid } from 'lucide-react';

export type StylePreset = 'minimal' | 'bold' | 'playful' | 'elegant' | 'brutalist' | 'custom';

interface StylePresetOption {
  id: StylePreset;
  name: string;
  description: string;
  icon: React.ElementType;
  characteristics: string[];
  references: string[];
  gradient: string;
  textColor: string;
  borderColor: string;
}

const STYLE_PRESETS: StylePresetOption[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, lots of whitespace, subtle accents',
    icon: Sparkles,
    characteristics: [
      '1.8x spacing (extra generous whitespace)',
      '90% neutral, 10% color palette',
      'Tight typography (48px headlines)',
      'Subtle shadows (max 0.1 opacity)',
    ],
    references: ['Apple.com', 'Stripe.com', 'Linear.app'],
    gradient: 'from-gray-500 to-gray-700',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-500',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Large typography, vibrant colors, high contrast',
    icon: Zap,
    characteristics: [
      '1.4x spacing multiplier',
      '60% color, 40% neutral',
      'Expanded typography (72px headlines)',
      'Vibrant gradients & bold colors',
    ],
    references: ['Spotify.com', 'Discord.com', 'Vercel.com'],
    gradient: 'from-orange-500 to-red-600',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Rounded corners, bright colors, friendly',
    icon: Heart,
    characteristics: [
      '1.5x spacing multiplier',
      'Generous bright colors',
      'Friendly typography (56px headlines)',
      'Rounded corners (min 16px)',
    ],
    references: ['Mailchimp.com', 'Slack.com', 'Notion.so'],
    gradient: 'from-pink-500 to-purple-600',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Serif fonts, luxury feel, sophisticated',
    icon: Crown,
    characteristics: [
      '2.0x spacing (maximum whitespace)',
      'Muted, sophisticated palette',
      'Classic typography (64px headlines)',
      'Gold/black or muted colors',
    ],
    references: ['Luxury brands', 'High-end portfolios'],
    gradient: 'from-amber-600 to-yellow-700',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-600',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw, grid-based, unconventional',
    icon: Grid,
    characteristics: [
      '1.0x spacing (tight, raw)',
      'Black/white + single accent',
      'Monospace typography (42px headlines)',
      'Visible grid, hard shadows',
    ],
    references: ['Bloomberg.com', 'Gumroad.com'],
    gradient: 'from-slate-700 to-slate-900',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-600',
  },
];

interface StylePresetSelectorProps {
  selected: StylePreset | undefined;
  onChange: (preset: StylePreset) => void;
  className?: string;
}

export function StylePresetSelector({
  selected,
  onChange,
  className,
}: StylePresetSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Optional Style Preset
          <span className="text-[10px] text-gray-500 font-normal">(Foundation Layer)</span>
        </h3>
        <span className="px-2 py-1 text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded-full uppercase tracking-wider">
          Foundation Only
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Optionally select a preset to set the foundation (spacing, colors, typography). Your archetype will then be applied on top of this base.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STYLE_PRESETS.map((preset) => {
          const isSelected = selected === preset.id;
          const Icon = preset.icon;

          return (
            <button
              key={preset.id}
              onClick={() => onChange(preset.id)}
              className={cn(
                'relative p-4 rounded-xl border text-left transition-all hover:scale-[1.02] group',
                isSelected
                  ? `bg-gradient-to-br ${preset.gradient} bg-opacity-20 ${preset.borderColor} ring-2 ring-offset-2 ring-offset-[#050505]`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}

              {/* Icon & Name */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isSelected
                      ? `bg-gradient-to-br ${preset.gradient}`
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
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Characteristics */}
              <div className="space-y-1.5 mb-3">
                {preset.characteristics.slice(0, 3).map((char, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 text-[10px] text-gray-400"
                  >
                    <span className="text-gray-600">•</span>
                    <span>{char}</span>
                  </div>
                ))}
              </div>

              {/* References */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
                  References
                </div>
                <div className="flex flex-wrap gap-1">
                  {preset.references.map((ref, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[9px] font-medium',
                        isSelected
                          ? `${preset.textColor} bg-white/10`
                          : 'text-gray-500 bg-white/5'
                      )}
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-300">
            <span className="font-semibold text-purple-300">Foundation Layer:</span>{' '}
            Presets provide a starting point for spacing, colors & typography. Your selected ultra-extreme archetype will be applied on top, creating unique experimental designs.{' '}
            <span className="text-gray-500">Skip this if you want the archetype to have full creative freedom.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
