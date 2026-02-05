/**
 * Content Optimizer Panel UI
 *
 * UI for analyzing and optimizing content
 */

'use client';

import { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useContentOptimizer } from '../hooks/use-content-optimizer';
import type { ContentIssue, ContentRecommendation } from '../services/content-optimizer';
import { toast } from 'sonner';

interface ContentOptimizerPanelProps {
  content: string;
  context?: {
    targetKeywords?: string[];
    targetWordCount?: number;
    targetAudience?: 'general' | 'professional' | 'technical';
  };
}

export function ContentOptimizerPanel({
  content,
  context,
}: ContentOptimizerPanelProps) {
  const {
    isAnalyzing,
    analysis,
    error,
    analyze,
    getOptimizationPrompt,
    clear,
  } = useContentOptimizer();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['issues', 'recommendations'])
  );
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleAnalyze = () => {
    try {
      analyze(content, context);
      toast.success('Content analyzed successfully');
    } catch (err) {
      toast.error('Failed to analyze content');
      console.error(err);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      const prompt = getOptimizationPrompt(content);
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      toast.success('Optimization prompt copied to clipboard');
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      toast.error('Failed to copy prompt');
      console.error(err);
    }
  };

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    setExpandedSections(next);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score: number): string => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getSeverityColor = (severity: string): string => {
    if (severity === 'high') return 'text-red-400';
    if (severity === 'medium') return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getPriorityColor = (priority: string): string => {
    if (priority === 'high') return 'text-emerald-400';
    if (priority === 'medium') return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Smart Content Optimizer
        </h3>
        <p className="text-sm text-gray-400">
          AI-powered analysis for headlines, CTAs, readability, and SEO
        </p>
      </div>

      {!analysis ? (
        /* Analyze Button */
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !content}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing Content...' : 'Analyze Content'}
        </button>
      ) : (
        <>
          {/* Overall Score */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(analysis.score)}`}
                  style={{
                    background: `conic-gradient(${
                      analysis.score >= 80
                        ? 'rgb(52 211 153)'
                        : analysis.score >= 60
                        ? 'rgb(251 191 36)'
                        : 'rgb(239 68 68)'
                    } ${analysis.score}%, rgb(31 41 55) 0)`,
                  }}
                >
                  <div className="w-14 h-14 bg-[#050505] rounded-full flex items-center justify-center">
                    {analysis.score}
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold text-white">
                    Content Quality Score
                  </div>
                  <div className="text-sm text-gray-400">
                    {analysis.score >= 80
                      ? 'Excellent - Ready to publish'
                      : analysis.score >= 60
                      ? 'Good - Minor improvements needed'
                      : 'Needs Work - Follow recommendations'}
                  </div>
                </div>
              </div>

              <button
                onClick={clear}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-gray-300 transition-all"
              >
                Clear
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Word Count
                </div>
                <div className="text-lg font-bold text-white">
                  {analysis.metrics.wordCount}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Reading Level
                </div>
                <div className="text-lg font-bold text-white">
                  Grade {analysis.metrics.readingLevel.toFixed(1)}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  CTAs
                </div>
                <div className="text-lg font-bold text-white">
                  {analysis.metrics.ctaCount}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Headline Power
                </div>
                <div className="text-lg font-bold text-white">
                  {analysis.metrics.headlineStrength.toFixed(0)}/100
                </div>
              </div>
            </div>
          </div>

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('issues')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  {expandedSections.has('issues') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-semibold text-white">
                    Issues Found
                  </span>
                  <span className="text-xs text-gray-500">
                    ({analysis.issues.length})
                  </span>
                </div>
              </button>

              {expandedSections.has('issues') && (
                <div className="border-t border-white/10 p-4 space-y-2">
                  {analysis.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-black/30 rounded-lg"
                    >
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getSeverityColor(issue.severity)}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wider">
                            {issue.type}
                          </span>
                          <span
                            className={`text-xs font-semibold ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <div className="text-sm text-white">{issue.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Location: {issue.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  {expandedSections.has('recommendations') ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">
                    Recommendations
                  </span>
                  <span className="text-xs text-gray-500">
                    ({analysis.recommendations.length})
                  </span>
                </div>
              </button>

              {expandedSections.has('recommendations') && (
                <div className="border-t border-white/10 p-4 space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 bg-black/30 rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          {rec.type}
                        </span>
                        <span
                          className={`text-xs font-semibold ${getPriorityColor(rec.priority)}`}
                        >
                          {rec.priority} priority
                        </span>
                      </div>

                      <div className="text-sm text-white">{rec.suggestion}</div>

                      {rec.before && rec.after && (
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 flex-shrink-0">Before:</span>
                            <span className="text-gray-400">{rec.before}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 flex-shrink-0">After:</span>
                            <span className="text-gray-300">{rec.after}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{rec.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Copy Optimization Prompt */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400">
                  AI Optimization Prompt
                </span>
              </div>

              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-gray-300 transition-all"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Copy this prompt to use with ChatGPT, Claude, or any AI assistant to get
              optimized content that implements all recommendations.
            </p>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
