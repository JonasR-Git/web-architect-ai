'use client';

import { cn } from '@/lib/utils';
import { Shield, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface AuditCriterion {
    id: string;
    category: 'Wahrnehmbar' | 'Bedienbar' | 'Verständlich' | 'Robust' | 'SEO';
    description: string;
    criticality: 'K' | 'E';
    max_points: number;
    achieved: number;
    weighted_score: number;
    status: '✅ Pass' | '⚠️ Partial' | '❌ Fail';
    finding: string;
    recommendation: string;
}

interface AuditSummary {
    total_score: number;
    rating: 'Exzellent' | 'Gut' | 'Befriedigend' | 'Ausreichend' | 'Mangelhaft';
    rating_emoji: string;
    bfsg_compliant: boolean;
    critical_failures: number;
    pass_fail_gate_triggered: boolean;
}

interface BFSGAuditData {
    audit_summary?: AuditSummary;
    accessibility_score?: number;
    seo_score?: number;
    audit_matrix?: AuditCriterion[];
    critical_issues?: string[];
    quick_wins?: string[];
    summary_de?: string;
    // Legacy format support
    seo_score_legacy?: number;
    accessibility_score_legacy?: number;
    summary?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Wahrnehmbar': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Bedienbar': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    'Verständlich': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    'Robust': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    'SEO': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
};

const RATING_COLORS: Record<string, string> = {
    'Exzellent': 'bg-green-500',
    'Gut': 'bg-lime-500',
    'Befriedigend': 'bg-yellow-500',
    'Ausreichend': 'bg-orange-500',
    'Mangelhaft': 'bg-red-500'
};

export function BFSGAuditViewer({ data }: { data: BFSGAuditData }) {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Wahrnehmbar': true,
        'Bedienbar': true,
        'Verständlich': true,
        'Robust': true,
        'SEO': true
    });

    // Check if we have the new BFSG format
    const hasBFSGFormat = !!data.audit_summary;

    if (!hasBFSGFormat) {
        // Render legacy format
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <ScoreCard label="SEO Score" score={data.seo_score ?? 0} />
                    <ScoreCard label="Accessibility Score" score={data.accessibility_score ?? 0} />
                </div>
                {data.summary && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-300 text-sm">{data.summary}</p>
                    </div>
                )}
            </div>
        );
    }

    const { audit_summary, audit_matrix = [], critical_issues = [], quick_wins = [], summary_de } = data;

    // Group criteria by category
    const groupedCriteria = audit_matrix.reduce((acc, criterion) => {
        if (!acc[criterion.category]) acc[criterion.category] = [];
        acc[criterion.category].push(criterion);
        return acc;
    }, {} as Record<string, AuditCriterion[]>);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Hero Summary */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                <div className="relative">
                    {/* Main Score */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={cn(
                                    "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold",
                                    RATING_COLORS[audit_summary?.rating || 'Mangelhaft'],
                                    "text-white shadow-lg"
                                )}>
                                    {audit_summary?.total_score ?? 0}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{audit_summary?.rating}</h2>
                                <p className="text-gray-400 text-sm">
                                    {audit_summary?.bfsg_compliant ? (
                                        <span className="text-green-400">✓ BFSG-konform</span>
                                    ) : (
                                        <span className="text-red-400">✗ Nicht BFSG-konform</span>
                                    )}
                                </p>
                                {audit_summary?.pass_fail_gate_triggered && (
                                    <p className="text-orange-400 text-xs mt-1">
                                        ⚠️ Pass/Fail-Gate ausgelöst ({audit_summary.critical_failures} kritische Fehler)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <ScoreCard label="Accessibility" score={data.accessibility_score ?? 0} small />
                            <ScoreCard label="SEO" score={data.seo_score ?? 0} small />
                        </div>
                    </div>

                    {/* Summary */}
                    {summary_de && (
                        <p className="text-gray-300 text-sm leading-relaxed">{summary_de}</p>
                    )}
                </div>
            </div>

            {/* Critical Issues */}
            {critical_issues.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <h3 className="font-semibold text-red-400">Kritische Probleme ({critical_issues.length})</h3>
                    </div>
                    <ul className="space-y-2">
                        {critical_issues.map((issue, idx) => (
                            <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{issue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quick Wins */}
            {quick_wins.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <h3 className="font-semibold text-green-400">Quick Wins ({quick_wins.length})</h3>
                    </div>
                    <ul className="space-y-2">
                        {quick_wins.map((win, idx) => (
                            <li key={idx} className="text-green-300 text-sm flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{win}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Audit Matrix by Category */}
            <div className="space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    BFSG Audit Matrix
                </h3>

                {Object.entries(groupedCriteria).map(([category, criteria]) => {
                    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['SEO'];
                    const passCount = criteria.filter(c => c.status === '✅ Pass').length;
                    const failCount = criteria.filter(c => c.status === '❌ Fail').length;

                    return (
                        <div key={category} className={cn("border rounded-xl overflow-hidden", colors.border)}>
                            <button
                                onClick={() => toggleCategory(category)}
                                className={cn("w-full flex items-center justify-between p-4", colors.bg)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedCategories[category] ? (
                                        <ChevronDown className={cn("w-4 h-4", colors.text)} />
                                    ) : (
                                        <ChevronRight className={cn("w-4 h-4", colors.text)} />
                                    )}
                                    <span className={cn("font-semibold", colors.text)}>{category}</span>
                                    <span className="text-xs text-gray-500">
                                        {passCount}/{criteria.length} bestanden
                                        {failCount > 0 && <span className="text-red-400 ml-2">({failCount} kritisch)</span>}
                                    </span>
                                </div>
                            </button>

                            {expandedCategories[category] && (
                                <div className="divide-y divide-white/5">
                                    {criteria.map((criterion) => (
                                        <CriterionRow key={criterion.id} criterion={criterion} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ScoreCard({ label, score, small = false }: { label: string; score: number; small?: boolean }) {
    const getColor = (s: number) => {
        if (s >= 90) return 'text-green-400';
        if (s >= 75) return 'text-lime-400';
        if (s >= 50) return 'text-yellow-400';
        if (s >= 25) return 'text-orange-400';
        return 'text-red-400';
    };

    if (small) {
        return (
            <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={cn("text-xl font-bold", getColor(score))}>{score}</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className={cn("text-3xl font-bold", getColor(score))}>{score}</p>
        </div>
    );
}

function CriterionRow({ criterion }: { criterion: AuditCriterion }) {
    const [expanded, setExpanded] = useState(false);

    const statusIcon = {
        '✅ Pass': <CheckCircle2 className="w-4 h-4 text-green-400" />,
        '⚠️ Partial': <AlertTriangle className="w-4 h-4 text-yellow-400" />,
        '❌ Fail': <XCircle className="w-4 h-4 text-red-400" />
    }[criterion.status];

    return (
        <div className="bg-[#0f1117]">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
                {statusIcon}
                <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    criterion.criticality === 'K'
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                )}>
                    {criterion.id}
                </span>
                <span className="text-sm text-gray-300 flex-1">{criterion.description}</span>
                <span className="text-xs text-gray-500">
                    {criterion.weighted_score}/{criterion.max_points}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-1 bg-white/[0.02]">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="text-gray-500 mb-1">Befund:</p>
                            <p className="text-gray-300">{criterion.finding || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">Empfehlung:</p>
                            <p className="text-gray-300">{criterion.recommendation || '-'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
