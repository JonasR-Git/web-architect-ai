'use client';

import { useState } from 'react';
import { StackConfig } from '@/types';
import { Layers, Database, Lock, Globe, Code2, Paintbrush, ArrowRight, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConfigFormProps {
    initialConfig?: StackConfig;
    onSubmit: (config: StackConfig) => void;
    isSubmitting?: boolean;
}

export function ConfigForm({ initialConfig, onSubmit, isSubmitting }: ConfigFormProps) {
    const [config, setConfig] = useState<StackConfig>(initialConfig || {
        framework: 'nextjs',
        css: 'tailwind',
        uiLibrary: 'shadcn',
        cms: 'none',
        database: 'none',
        auth: 'none',
        deployment: 'vercel',
    });

    const handleChange = (key: keyof StackConfig, value: string) => {
        setConfig((prev) => {
            const next = { ...prev, [key]: value };

            // Smart Dependency Logic
            if (key === 'framework' && value === 'vue' && prev.uiLibrary === 'shadcn') {
                next.uiLibrary = 'headless-ui'; // React-only library
            }

            if (key === 'uiLibrary') {
                if (value === 'shadcn') {
                    next.framework = 'nextjs';
                    next.css = 'tailwind';
                } else if (value === 'headless-ui' && prev.css !== 'tailwind') {
                    next.css = 'tailwind';
                }
            }

            return next;
        });
    };

    const OptionGroup = ({ label, icon: Icon, options, value, onChange }: any) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Icon className="w-4 h-4 text-blue-400" />
                {label}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "relative px-4 py-3 rounded-lg text-left transition-all duration-200 border",
                            value === opt.value
                                ? "bg-blue-500/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="text-sm font-semibold">{opt.label}</div>
                        {opt.desc && <div className="text-[10px] opacity-60 mt-0.5">{opt.desc}</div>}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto backdrop-blur-md bg-black/40 border border-white/10 rounded-xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-8 text-center space-y-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Stack Configuration
                </h2>
                <p className="text-sm text-gray-400">Define the technology DNA for the V3 migration.</p>
            </div>

            <div className="space-y-8">
                {/* Core Tech */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <OptionGroup
                        label="Frontend Framework"
                        icon={Code2}
                        value={config.framework}
                        onChange={(v: string) => handleChange('framework', v)}
                        options={[
                            { value: 'nextjs', label: 'Next.js 15', desc: 'App Router (React)' },
                            { value: 'vue', label: 'Nuxt 3', desc: 'Vue.js Composition' }
                        ]}
                    />

                    <OptionGroup
                        label="Styling System"
                        icon={Paintbrush}
                        value={config.css}
                        onChange={(v: string) => handleChange('css', v)}
                        options={[
                            { value: 'tailwind', label: 'Tailwind CSS', desc: 'Utility-First' },
                            { value: 'scss-modules', label: 'SCSS Modules', desc: 'Modular & Structured' }
                        ]}
                    />
                </div>

                {/* UI Library */}
                <OptionGroup
                    label="UI Component Library"
                    icon={Box}
                    value={config.uiLibrary}
                    onChange={(v: string) => handleChange('uiLibrary', v)}
                    options={[
                        { value: 'shadcn', label: 'shadcn/ui', desc: 'Radix + Tailwind (Copy-Paste)' },
                        { value: 'radix', label: 'Radix UI', desc: 'Unstyled Primitives' },
                        { value: 'headless-ui', label: 'Headless UI', desc: 'Tailwind Labs' },
                        { value: 'none', label: 'Custom', desc: 'Build from Scratch' }
                    ]}
                />

                {/* Backend / Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <OptionGroup
                        label="CMS / Content"
                        icon={Layers}
                        value={config.cms}
                        onChange={(v: string) => handleChange('cms', v)}
                        options={[
                            { value: 'none', label: 'Hardcoded', desc: 'No CMS' },
                            { value: 'strapi', label: 'Strapi', desc: 'Headless CMS ' }
                        ]}
                    />

                    <OptionGroup
                        label="Authentication"
                        icon={Lock}
                        value={config.auth}
                        onChange={(v: string) => handleChange('auth', v)}
                        options={[
                            { value: 'none', label: 'No Auth', desc: 'Public Access' },
                            { value: 'clerk', label: 'Clerk', desc: 'Modern Auth' }
                        ]}
                    />
                </div>

                <div className="pt-4">
                    <Button
                        onClick={() => onSubmit(config)}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">Generating Plan...</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Generate Implementation Plan <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
