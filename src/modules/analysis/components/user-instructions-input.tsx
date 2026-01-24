'use client';

import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Palette, Target, Shield } from 'lucide-react';

interface UserInstructionsInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function UserInstructionsInput({ value, onChange, disabled }: UserInstructionsInputProps) {
    const suggestions = [
        { icon: Palette, label: 'Design', example: 'Modernes, minimalistisches Design mit viel Weißraum' },
        { icon: Target, label: 'Fokus', example: 'Conversion-Optimierung für B2B SaaS' },
        { icon: Shield, label: 'Anforderungen', example: 'WCAG 2.1 AAA Konformität erforderlich' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Zusätzliche Anweisungen</h3>
                    <p className="text-sm text-gray-400">
                        Gib der KI Kontext: Design-Leitfaden, besondere Wünsche, Zielgruppe, Einschränkungen...
                    </p>
                </div>
            </div>

            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={`Beispiel:\n- Zielgruppe: Kleine und mittlere Unternehmen\n- Design: Clean, modern, Farben: Blau/Weiß\n- Fokus: Lead-Generierung über Kontaktformular\n- Besonderheiten: Mehrsprachig (DE/EN), DSGVO-konform`}
                className="min-h-[180px] bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-600 resize-none focus:border-amber-500/50 focus:ring-amber-500/20"
            />

            <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(value + (value ? '\n' : '') + `- ${s.label}: ${s.example}`)}
                        disabled={disabled}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <s.icon className="w-3 h-3" />
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
