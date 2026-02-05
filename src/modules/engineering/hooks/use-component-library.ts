/**
 * Component Library Hook
 *
 * Provides methods to extract and generate component libraries from mockup HTML
 */

import { useState } from 'react';
import {
  extractComponents,
  generateComponentLibrary,
  type ExtractedComponent,
  type ComponentLibrary,
} from '../services/component-extractor';

export function useComponentLibrary() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [library, setLibrary] = useState<ComponentLibrary | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate component library from HTML
   */
  const generateFromHTML = async (html: string): Promise<ComponentLibrary> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Extract components
      const components = extractComponents(html);

      if (components.length === 0) {
        throw new Error('No components found in HTML');
      }

      // Generate library files
      const lib = generateComponentLibrary(components);

      setLibrary(lib);
      return lib;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download component library as ZIP
   */
  const downloadAsZip = async (library: ComponentLibrary): Promise<void> => {
    // @ts-ignore - Dynamic import
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add component files
    library.components.forEach((component) => {
      zip.file(`${component.name}.tsx`, component.tsx);
    });

    // Add index file
    zip.file('index.ts', library.index);

    // Add README
    zip.file('README.md', library.readme);

    // Add package.json
    zip.file('package.json', library.packageJson);

    // Generate ZIP
    const blob = await zip.generateAsync({ type: 'blob' });

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'component-library.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Download single component
   */
  const downloadComponent = (component: ExtractedComponent): void => {
    const blob = new Blob([component.tsx], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${component.name}.tsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Copy component code to clipboard
   */
  const copyComponent = async (component: ExtractedComponent): Promise<void> => {
    await navigator.clipboard.writeText(component.tsx);
  };

  return {
    isGenerating,
    library,
    error,
    generateFromHTML,
    downloadAsZip,
    downloadComponent,
    copyComponent,
  };
}
