import { describe, expect, it } from 'vitest';

import { requireSuccessfulAIStageResult } from '../ai-stage-result';

describe('requireSuccessfulAIStageResult', () => {
  it('returns provider data for an explicit success', () => {
    const data = { source: 'provider' };

    expect(requireSuccessfulAIStageResult('Audit', { success: true, data })).toBe(data);
  });

  it('accepts a successful built-in sample result', () => {
    const data = { source: 'sample' };

    expect(requireSuccessfulAIStageResult('Audit', {
      success: true,
      data,
      isMock: true,
    })).toBe(data);
  });

  it('rejects an error response even when fallback data is present', () => {
    expect(() => requireSuccessfulAIStageResult('Migration', {
      success: false,
      data: { source: 'fallback' },
      error: 'provider unavailable',
      isFallback: true,
    })).toThrow('Migration failed: provider unavailable');
  });

  it('rejects fallback data even if a caller marks the result successful', () => {
    expect(() => requireSuccessfulAIStageResult('Component extraction', {
      success: true,
      data: { source: 'fallback' },
      isFallback: true,
    })).toThrow('Component extraction failed: fallback data was returned');
  });

  it('rejects a success without data', () => {
    expect(() => requireSuccessfulAIStageResult('Audit', {
      success: true,
    })).toThrow('Audit failed: no result data was returned');
  });
});
