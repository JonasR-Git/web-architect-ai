/**
 * ID Prefixes and Constants
 * Centralized string constants for IDs and prefixes used throughout the app
 */

export const ID_PREFIXES = {
  SOURCE: 'source-',
  TARGET: 'target-',
  CLUSTER: 'cluster_',
  PAGE: 'page-',
  LAYOUT: 'target-layout',
  VARIANT: 'variant-',
} as const;

export const DEBOUNCE_TIMES = {
  UI_STATE: 8000,
  STRUCTURE: 5000,
  MIGRATION: 5000,
  SPECS: 5000,
  DESIGN: 5000,
  FULL_SAVE: 10000,
} as const;

export const VIEW_MODES = {
  HOME: 'home',
  CRAWL_RESULT: 'crawl_result',
  AI_ANALYSIS: 'ai_analysis',
  AI_RESULT: 'ai_result',
  CONTENT_REVIEW: 'content_review',
  DESIGN_STUDIO: 'design_studio',
  MOCKUP_VIEW: 'mockup_view',
  FINAL_PLAN: 'final_plan',
} as const;
