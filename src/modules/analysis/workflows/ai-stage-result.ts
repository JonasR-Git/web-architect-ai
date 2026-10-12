export interface AIStageResult<T> {
  success: boolean;
  data?: T | null;
  error?: string;
  isFallback?: boolean;
  isMock?: boolean;
}

/**
 * Returns data only for an explicit, non-fallback stage success.
 * Successful built-in sample results remain valid workflow inputs.
 */
export function requireSuccessfulAIStageResult<T>(
  stage: string,
  result: AIStageResult<T>
): T {
  if (!result.success || result.isFallback) {
    const reason = result.error?.trim()
      || (result.isFallback ? 'fallback data was returned' : 'the stage did not succeed');
    throw new Error(`${stage} failed: ${reason}`);
  }

  if (result.data === undefined || result.data === null) {
    throw new Error(`${stage} failed: no result data was returned`);
  }

  return result.data;
}
