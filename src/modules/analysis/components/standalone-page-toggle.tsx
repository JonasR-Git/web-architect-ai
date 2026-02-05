/**
 * Standalone Page Toggle Component
 *
 * Allows users to mark pages as standalone (excluded from automatic clustering).
 * Pages marked as standalone will NOT be merged with similar pages.
 */

'use client';

import { useState } from 'react';
import { SiteNode } from '@/types';
import { cn } from '@/lib/utils';
import { Lock, Unlock, Info } from 'lucide-react';

interface StandalonePageToggleProps {
  page: SiteNode;
  onToggle: (url: string, isStandalone: boolean, reason?: string) => void;
  compact?: boolean; // Show compact button instead of full UI
  className?: string;
}

export function StandalonePageToggle({
  page,
  onToggle,
  compact = false,
  className
}: StandalonePageToggleProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState(page.clusterExclusionReason || '');

  const isStandalone = page.excludeFromClustering === true;

  const handleToggle = () => {
    if (isStandalone) {
      // Remove standalone flag
      onToggle(page.url, false);
      setShowReasonInput(false);
    } else {
      // Add standalone flag - show reason input
      setShowReasonInput(true);
    }
  };

  const handleConfirmStandalone = () => {
    onToggle(page.url, true, reason || 'Manually marked as standalone');
    setShowReasonInput(false);
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          'p-1.5 rounded transition-colors',
          isStandalone
            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
            : 'bg-white/5 text-gray-400 hover:bg-white/10',
          className
        )}
        title={isStandalone ? `Standalone: ${page.clusterExclusionReason}` : 'Mark as standalone (exclude from clustering)'}
      >
        {isStandalone ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          isStandalone
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
        )}
      >
        {isStandalone ? (
          <>
            <Lock className="w-4 h-4" />
            <span className="flex-1 text-left">Standalone Page</span>
            <span className="text-[10px] text-purple-400">Click to allow clustering</span>
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4" />
            <span className="flex-1 text-left">Allow Clustering</span>
            <span className="text-[10px] text-gray-500">Click to mark as standalone</span>
          </>
        )}
      </button>

      {/* Standalone Info */}
      {isStandalone && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-xs text-purple-300 font-medium">
                This page is marked as standalone
              </p>
              <p className="text-[10px] text-gray-400">
                {page.clusterExclusionReason || 'No reason provided'}
              </p>
              {page.clusterExclusionTimestamp && (
                <p className="text-[9px] text-gray-500">
                  Marked on {new Date(page.clusterExclusionTimestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reason Input (when marking as standalone) */}
      {showReasonInput && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Why is this page standalone?
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Landing page, Contact form, Special layout..."
            className="w-full h-16 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirmStandalone}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors"
            >
              Confirm Standalone
            </button>
            <button
              onClick={() => setShowReasonInput(false)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bulk Standalone Toggle - Mark multiple pages at once
 */
interface BulkStandaloneToggleProps {
  selectedPages: SiteNode[];
  onToggle: (urls: string[], isStandalone: boolean, reason?: string) => void;
  className?: string;
}

export function BulkStandaloneToggle({
  selectedPages,
  onToggle,
  className
}: BulkStandaloneToggleProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const allStandalone = selectedPages.every(p => p.excludeFromClustering === true);
  const someStandalone = selectedPages.some(p => p.excludeFromClustering === true);

  const handleToggle = () => {
    if (allStandalone) {
      // All are standalone - remove flags
      onToggle(selectedPages.map(p => p.url), false);
    } else {
      // Mark all as standalone
      setShowReasonInput(true);
    }
  };

  const handleConfirm = () => {
    onToggle(
      selectedPages.map(p => p.url),
      true,
      reason || 'Bulk marked as standalone'
    );
    setShowReasonInput(false);
    setReason('');
  };

  if (selectedPages.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          allStandalone
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            : someStandalone
            ? 'bg-purple-500/10 text-purple-200 border border-purple-500/20 hover:bg-purple-500/20'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
        )}
      >
        {allStandalone ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        <span className="flex-1 text-left">
          {allStandalone
            ? `Remove Standalone (${selectedPages.length} pages)`
            : someStandalone
            ? `Mark All Standalone (${selectedPages.length} pages, ${selectedPages.filter(p => p.excludeFromClustering).length} already marked)`
            : `Mark as Standalone (${selectedPages.length} pages)`}
        </span>
      </button>

      {showReasonInput && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
          <label className="text-xs font-medium text-gray-300">
            Why are these pages standalone?
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., All landing pages, Special layouts..."
            className="w-full h-16 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors"
            >
              Confirm ({selectedPages.length} pages)
            </button>
            <button
              onClick={() => setShowReasonInput(false)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Stats Display
 */
interface StandaloneStatsProps {
  totalPages: number;
  standalonePages: number;
  className?: string;
}

export function StandaloneStats({
  totalPages,
  standalonePages,
  className
}: StandaloneStatsProps) {
  if (standalonePages === 0) {
    return null;
  }

  const percentage = Math.round((standalonePages / totalPages) * 100);

  return (
    <div className={cn('flex items-center gap-2 text-xs text-gray-400', className)}>
      <Lock className="w-3.5 h-3.5 text-purple-400" />
      <span>
        {standalonePages} of {totalPages} pages marked as standalone ({percentage}%)
      </span>
    </div>
  );
}
