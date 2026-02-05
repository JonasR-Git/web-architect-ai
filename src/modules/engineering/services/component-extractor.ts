/**
 * Component Library Generator
 *
 * Extracts reusable React components from mockup HTML
 * and generates TypeScript interfaces for props
 */

export interface ExtractedComponent {
  name: string;
  description: string;
  category: 'layout' | 'ui' | 'content' | 'form' | 'navigation';
  html: string;
  tsx: string;
  props: ComponentProp[];
  variants?: ComponentVariant[];
  usage: string;
  dependencies: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
}

export interface ComponentLibrary {
  components: ExtractedComponent[];
  index: string;
  readme: string;
  packageJson: string;
}

/**
 * Patterns for identifying reusable components
 */
const COMPONENT_PATTERNS = [
  {
    selector: 'button:not([type="submit"]):not([type="button"])',
    name: 'Button',
    category: 'ui' as const,
    description: 'Primary button component',
  },
  {
    selector: 'header',
    name: 'Header',
    category: 'layout' as const,
    description: 'Site header with navigation',
  },
  {
    selector: 'footer',
    name: 'Footer',
    category: 'layout' as const,
    description: 'Site footer',
  },
  {
    selector: 'nav',
    name: 'Navigation',
    category: 'navigation' as const,
    description: 'Main navigation menu',
  },
  {
    selector: '.card',
    name: 'Card',
    category: 'ui' as const,
    description: 'Card container component',
  },
  {
    selector: 'form',
    name: 'Form',
    category: 'form' as const,
    description: 'Form component',
  },
  {
    selector: 'input[type="text"], input[type="email"], input[type="password"]',
    name: 'Input',
    category: 'form' as const,
    description: 'Input field component',
  },
  {
    selector: 'section[class*="hero"]',
    name: 'Hero',
    category: 'content' as const,
    description: 'Hero section component',
  },
  {
    selector: 'section[class*="cta"]',
    name: 'CallToAction',
    category: 'content' as const,
    description: 'Call-to-action section',
  },
];

/**
 * Extracts components from HTML mockup
 */
export function extractComponents(html: string): ExtractedComponent[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const components: ExtractedComponent[] = [];

  // Find all matching elements
  COMPONENT_PATTERNS.forEach((pattern) => {
    const elements = doc.querySelectorAll(pattern.selector);

    elements.forEach((element, index) => {
      const htmlStr = element.outerHTML;

      // Skip if already extracted (avoid duplicates)
      if (components.some((c) => c.html === htmlStr)) {
        return;
      }

      const componentName =
        index === 0 ? pattern.name : `${pattern.name}${index + 1}`;

      // Extract props from attributes
      const props = extractPropsFromElement(element as Element);

      // Generate TSX from HTML
      const tsx = htmlToTSX(htmlStr, componentName, props);

      // Detect variants (e.g., different button styles)
      const variants = detectVariants(element as Element, pattern.category);

      components.push({
        name: componentName,
        description: pattern.description,
        category: pattern.category,
        html: htmlStr,
        tsx,
        props,
        variants,
        usage: generateUsageExample(componentName, props),
        dependencies: extractDependencies(htmlStr),
      });
    });
  });

  return components;
}

/**
 * Extracts props from HTML element attributes and content
 */
function extractPropsFromElement(element: Element): ComponentProp[] {
  const props: ComponentProp[] = [];

  // Common props for all components
  props.push({
    name: 'className',
    type: 'string',
    required: false,
    description: 'Additional CSS classes',
  });

  // Extract from attributes
  const attributes = element.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];

    if (
      attr.name === 'class' ||
      attr.name === 'style' ||
      attr.name === 'id'
    ) {
      continue; // Skip basic HTML attributes
    }

    const propName = toCamelCase(attr.name);
    const propType = inferPropType(attr.value);

    props.push({
      name: propName,
      type: propType,
      required: false,
      default: attr.value,
      description: `${attr.name} attribute`,
    });
  }

  // Check for text content
  const textContent = element.textContent?.trim();
  if (textContent && element.children.length === 0) {
    props.push({
      name: 'children',
      type: 'React.ReactNode',
      required: true,
      description: 'Component content',
    });
  } else if (element.children.length > 0) {
    props.push({
      name: 'children',
      type: 'React.ReactNode',
      required: false,
      description: 'Component children',
    });
  }

  return props;
}

/**
 * Converts HTML to TSX
 */
function htmlToTSX(
  html: string,
  componentName: string,
  props: ComponentProp[]
): string {
  // Generate props interface
  const propsInterface = generatePropsInterface(componentName, props);

  // Convert HTML attributes to JSX
  let jsx = html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<!--.*?-->/g, '')
    .trim();

  // Replace static content with props
  props.forEach((prop) => {
    if (prop.name === 'children' && prop.required) {
      // Replace text content with {children}
      jsx = jsx.replace(/>([\s\S]*?)</, '>{children}<');
    }
  });

  // Generate component code
  const componentCode = `
${propsInterface}

export function ${componentName}({ className, ...props }: ${componentName}Props) {
  return (
    ${jsx}
  );
}
`.trim();

  return componentCode;
}

/**
 * Generates TypeScript props interface
 */
function generatePropsInterface(
  componentName: string,
  props: ComponentProp[]
): string {
  const lines: string[] = [`export interface ${componentName}Props {`];

  props.forEach((prop) => {
    const optional = prop.required ? '' : '?';
    const comment = `  /** ${prop.description} */`;
    lines.push(comment);
    lines.push(`  ${prop.name}${optional}: ${prop.type};`);
  });

  lines.push('}');

  return lines.join('\n');
}

/**
 * Detects component variants (e.g., button sizes, colors)
 */
function detectVariants(
  element: Element,
  category: string
): ComponentVariant[] {
  const variants: ComponentVariant[] = [];
  const classList = element.className.split(' ');

  // Detect size variants
  const sizeClasses = classList.filter((c) =>
    /\b(sm|md|lg|xl|2xl|small|medium|large)\b/.test(c)
  );
  if (sizeClasses.length > 0) {
    variants.push({
      name: 'size',
      description: 'Component size',
      props: { size: sizeClasses[0] },
    });
  }

  // Detect color/variant classes
  const colorClasses = classList.filter((c) =>
    /\b(primary|secondary|success|danger|warning|info)\b/.test(c)
  );
  if (colorClasses.length > 0) {
    variants.push({
      name: 'variant',
      description: 'Component variant',
      props: { variant: colorClasses[0] },
    });
  }

  return variants;
}

/**
 * Generates usage example
 */
function generateUsageExample(
  componentName: string,
  props: ComponentProp[]
): string {
  const requiredProps = props
    .filter((p) => p.required && p.name !== 'children')
    .map((p) => `${p.name}="${p.default || 'value'}"`)
    .join(' ');

  const hasChildren = props.some((p) => p.name === 'children');

  if (hasChildren) {
    return `<${componentName} ${requiredProps}>Content</${componentName}>`;
  } else {
    return `<${componentName} ${requiredProps} />`;
  }
}

/**
 * Extracts dependencies from HTML (e.g., icons, images)
 */
function extractDependencies(html: string): string[] {
  const deps: string[] = [];

  // Check for common icon libraries
  if (html.includes('lucide-react') || html.includes('data-lucide')) {
    deps.push('lucide-react');
  }

  // Check for image handling
  if (html.includes('<img') || html.includes('Image')) {
    deps.push('next/image');
  }

  // Check for links
  if (html.includes('<a') || html.includes('Link')) {
    deps.push('next/link');
  }

  return [...new Set(deps)];
}

/**
 * Generates component library files
 */
export function generateComponentLibrary(
  components: ExtractedComponent[]
): ComponentLibrary {
  // Generate index file
  const index = generateIndexFile(components);

  // Generate README
  const readme = generateReadme(components);

  // Generate package.json
  const packageJson = generatePackageJson(components);

  return {
    components,
    index,
    readme,
    packageJson,
  };
}

/**
 * Generates index.ts file
 */
function generateIndexFile(components: ExtractedComponent[]): string {
  const lines: string[] = ['/**', ' * Component Library - Auto-generated', ' */'];

  // Export all components
  components.forEach((component) => {
    lines.push(
      `export { ${component.name}, type ${component.name}Props } from './${component.name}';`
    );
  });

  return lines.join('\n');
}

/**
 * Generates README.md
 */
function generateReadme(components: ExtractedComponent[]): string {
  const lines: string[] = [
    '# Component Library',
    '',
    'Auto-generated component library from Web Architect AI.',
    '',
    '## Installation',
    '',
    '```bash',
    'npm install',
    '```',
    '',
    '## Components',
    '',
  ];

  // Group by category
  const byCategory: Record<string, ExtractedComponent[]> = {};
  components.forEach((c) => {
    if (!byCategory[c.category]) {
      byCategory[c.category] = [];
    }
    byCategory[c.category].push(c);
  });

  Object.entries(byCategory).forEach(([category, comps]) => {
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push('');

    comps.forEach((c) => {
      lines.push(`#### ${c.name}`);
      lines.push('');
      lines.push(c.description);
      lines.push('');
      lines.push('**Usage:**');
      lines.push('```tsx');
      lines.push(c.usage);
      lines.push('```');
      lines.push('');

      if (c.props.length > 0) {
        lines.push('**Props:**');
        lines.push('');
        lines.push('| Name | Type | Required | Description |');
        lines.push('|------|------|----------|-------------|');
        c.props.forEach((p) => {
          lines.push(
            `| ${p.name} | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | ${p.description} |`
          );
        });
        lines.push('');
      }
    });
  });

  return lines.join('\n');
}

/**
 * Generates package.json
 */
function generatePackageJson(components: ExtractedComponent[]): string {
  // Collect all unique dependencies
  const allDeps = new Set<string>();
  components.forEach((c) => {
    c.dependencies.forEach((dep) => allDeps.add(dep));
  });

  const pkg = {
    name: '@web-architect/components',
    version: '1.0.0',
    description: 'Auto-generated component library',
    main: 'index.ts',
    types: 'index.ts',
    peerDependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
    dependencies: Object.fromEntries(
      Array.from(allDeps).map((dep) => [dep, 'latest'])
    ),
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Utility: Convert kebab-case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Utility: Infer prop type from value
 */
function inferPropType(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value))) return 'number';
  if (value.startsWith('#') || value.match(/^rgb/)) return 'string';
  if (value.startsWith('http')) return 'string';
  return 'string';
}
