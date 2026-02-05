import { useState, useCallback, useEffect } from 'react';
import { LogEntry, TokenStats, AIResponseMetadata } from '@/types';
import { ViewMode } from './use-ui-state';

export interface LoggingState {
  logs: LogEntry[];
  tokenStats: TokenStats;
  addLog: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error',
    meta?: AIResponseMetadata
  ) => void;
  clearLogs: () => void;
}

export interface ProgressMessagesConfig {
  isGeneratingMockup: boolean;
  isProcessing: boolean;
  view: ViewMode;
}

/**
 * Hook for managing application logs and AI token tracking
 * Includes automatic progress messages for long-running operations
 */
export function useLogging(progressConfig?: ProgressMessagesConfig): LoggingState {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    totalIn: 0,
    totalOut: 0,
  });

  const addLog = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
      meta?: AIResponseMetadata
    ) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
        meta,
      };

      setLogs((prev) => [...prev, newLog]);

      // Update token stats if meta is provided
      if (meta?.tokensIn || meta?.tokensOut) {
        setTokenStats((prev) => ({
          totalIn: prev.totalIn + (meta.tokensIn || 0),
          totalOut: prev.totalOut + (meta.tokensOut || 0),
        }));
      }
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
    setTokenStats({ totalIn: 0, totalOut: 0 });
  }, []);

  // Progress messages for long-running operations
  useEffect(() => {
    if (!progressConfig) return;

    let interval: NodeJS.Timeout;
    const isLongRunning = progressConfig.isGeneratingMockup || (progressConfig.isProcessing && progressConfig.view === 'ai_analysis');

    if (isLongRunning) {
      let elapsed = 0;
      const messages = [
        "AI is analyzing your site structure...",
        "Generating accessibility audit...",
        "Developing migration strategy...",
        "Extracting component patterns...",
        "Processing... larger sites take longer.",
        "Almost there, synthesizing results..."
      ];
      interval = setInterval(() => {
        elapsed += 15;
        const msgIndex = Math.floor(elapsed / 15) % messages.length;
        addLog(`INFO: ${messages[msgIndex]} (${elapsed}s elapsed)`, 'info');
      }, 15000); // 15 seconds
    }
    return () => clearInterval(interval);
  }, [progressConfig?.isGeneratingMockup, progressConfig?.isProcessing, progressConfig?.view, addLog]);

  return {
    logs,
    tokenStats,
    addLog,
    clearLogs,
  };
}
