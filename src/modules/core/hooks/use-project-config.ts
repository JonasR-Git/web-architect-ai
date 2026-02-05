import { useState } from 'react';

export interface ProjectConfigState {
  url: string;
  setUrl: (url: string) => void;
  userInstructions: string;
  setUserInstructions: (instructions: string) => void;
}

/**
 * Hook for managing project configuration (URL, user instructions)
 */
export function useProjectConfig(): ProjectConfigState {
  const [url, setUrl] = useState('');
  const [userInstructions, setUserInstructions] = useState('');

  return {
    url,
    setUrl,
    userInstructions,
    setUserInstructions,
  };
}
