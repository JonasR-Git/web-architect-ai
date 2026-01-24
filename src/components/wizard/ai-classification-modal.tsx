'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, Coins, Image, CheckCircle, X, Loader2 } from 'lucide-react';

interface AIClassificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    onSkip: () => void;
    imageCount: number;
    tokenEstimate: number;
    estimatedCost: number;
    isClassifying?: boolean;
}

export function AIClassificationModal({
    isOpen,
    onClose,
    onApprove,
    onSkip,
    imageCount,
    tokenEstimate,
    estimatedCost,
    isClassifying = false
}: AIClassificationModalProps) {
    if (!isOpen) return null;

    const formatCost = (cost: number) => {
        if (cost < 0.01) return '< $0.01';
        return `~$${cost.toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isClassifying ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">AI Image Classification</h3>
                            <p className="text-zinc-400 text-sm">Additional analysis required</p>
                        </div>
                    </div>
                    {!isClassifying && (
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Warning Notice */}
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-amber-200 text-sm">
                                The system couldn't classify some images using heuristics.
                                AI analysis is recommended for better mockup results.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {/* Image Count */}
                        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Image className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">{imageCount}</div>
                            <div className="text-xs text-zinc-500">Unclassified</div>
                        </div>

                        {/* Token Estimate */}
                        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Coins className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {tokenEstimate > 1000 ? `${(tokenEstimate / 1000).toFixed(1)}k` : tokenEstimate}
                            </div>
                            <div className="text-xs text-zinc-500">Tokens</div>
                        </div>

                        {/* Cost */}
                        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <span className="text-green-400 font-bold text-sm">$</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{formatCost(estimatedCost)}</div>
                            <div className="text-xs text-zinc-500">Est. Cost</div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <p className="text-zinc-400 text-sm text-center mb-6">
                        This exceeds the auto-approve limit of 15,000 tokens.
                        Your approval is required to proceed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 border-t border-zinc-700 bg-zinc-800/30">
                    <button
                        onClick={onSkip}
                        disabled={isClassifying}
                        className="flex-1 px-4 py-3 rounded-xl border border-zinc-600 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Skip Classification
                    </button>
                    <button
                        onClick={onApprove}
                        disabled={isClassifying}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isClassifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Classifying...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Approve Analysis
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPACT INLINE VERSION (for embedding in other UIs)
// ============================================================================

interface AIClassificationBannerProps {
    imageCount: number;
    tokenEstimate: number;
    estimatedCost: number;
    onApprove: () => void;
    onSkip: () => void;
    isClassifying?: boolean;
}

export function AIClassificationBanner({
    imageCount,
    tokenEstimate,
    estimatedCost,
    onApprove,
    onSkip,
    isClassifying = false
}: AIClassificationBannerProps) {
    return (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <div>
                        <span className="text-white font-medium">AI Classification Available</span>
                        <span className="text-zinc-400 text-sm ml-2">
                            {imageCount} images • {tokenEstimate > 1000 ? `${(tokenEstimate / 1000).toFixed(1)}k` : tokenEstimate} tokens • {estimatedCost < 0.01 ? '< $0.01' : `~$${estimatedCost.toFixed(2)}`}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onSkip}
                        disabled={isClassifying}
                        className="px-3 py-1.5 text-sm rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        Skip
                    </button>
                    <button
                        onClick={onApprove}
                        disabled={isClassifying}
                        className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isClassifying ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Running...
                            </>
                        ) : (
                            'Classify with AI'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
