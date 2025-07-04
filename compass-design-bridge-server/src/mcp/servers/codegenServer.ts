import { BaseMCPServer, MCPResource, MCPTool, MCPPrompt } from '../mcpServer';

// Types for code generation
interface CodeGenerationRequest {
  designData: any;
  targetFramework: 'react' | 'vue' | 'angular' | 'html';
  styling: 'tailwind' | 'css' | 'styled-components' | 'scss';
  userPrompt?: string;
  designSystemReference?: any;
  accessibilityLevel?: 'basic' | 'wcag-a' | 'wcag-aa' | 'wcag-aaa';
}

interface CodeGenerationResult {
  code: string;
  dependencies: string[];
  framework: string;
  styling: string;
  accessibility: {
    level: string;
    features: string[];
    warnings: string[];
  };
  designSystem: {
    compliance: boolean;
    issues: string[];
    suggestions: string[];
  };
}

interface ClaudeArtifactResult {
  type: 'html' | 'react' | 'image';
  content: string;
  url?: string;
  figmaCompatible: boolean;
  exportFormat?: 'figma-make' | 'html' | 'svg';
}

export class CodegenServer extends BaseMCPServer {
  private anthropicApiKey: string;
  private anthropicBaseUrl: string = 'https://api.anthropic.com/v1';

  constructor(anthropicApiKey: string) {
    super('codegen-server', '1.0.0');
    this.anthropicApiKey = anthropicApiKey;
    this.enableResources();
    this.enableTools();
    this.enablePrompts();
  }

  async getResources(): Promise<MCPResource[]> {
    return [
      {
        name: 'design_templates',
        uri: 'codegen://templates/{framework}',
        description: 'Code templates for different frameworks',
        mimeType: 'text/plain',
      },
      {
        name: 'design_systems',
        uri: 'codegen://design-systems/{system_name}',
        description: 'Design system rules and components',
        mimeType: 'application/json',
      },
      {
        name: 'accessibility_guidelines',
        uri: 'codegen://accessibility/{level}',
        description: 'Accessibility guidelines and checks',
        mimeType: 'application/json',
      },
    ];
  }

  async getTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'generate_code',
        description: 'Generate code from Figma design data',
        inputSchema: {
          type: 'object',
          properties: {
            design_data_json: {
              type: 'object',
              description: 'Structured design data from Figma',
            },
            target_framework: {
              type: 'string',
              enum: ['react', 'vue', 'angular', 'html'],
              description: 'Target framework for code generation',
            },
            styling: {
              type: 'string',
              enum: ['tailwind', 'css', 'styled-components', 'scss'],
              description: 'Styling approach',
            },
            user_prompt: {
              type: 'string',
              description: 'Additional user instructions',
            },
            design_system_reference: {
              type: 'object',
              description: 'Design system rules and components',
            },
            accessibility_level: {
              type: 'string',
              enum: ['basic', 'wcag-a', 'wcag-aa', 'wcag-aaa'],
              description: 'Accessibility compliance level',
            },
          },
          required: ['design_data_json', 'target_framework'],
        },
      },
      {
        name: 'create_claude_artifact_mockup',
        description: 'Create a mockup using Claude Artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            design_data_json: {
              type: 'object',
              description: 'Structured design data from Figma',
            },
            user_prompt: {
              type: 'string',
              description: 'User instructions for mockup creation',
            },
            artifact_type: {
              type: 'string',
              enum: ['html', 'react', 'interactive'],
              description: 'Type of artifact to create',
            },
          },
          required: ['design_data_json', 'user_prompt'],
        },
      },
      {
        name: 'export_to_figma_make_format',
        description: 'Convert HTML code to Figma Make compatible format',
        inputSchema: {
          type: 'object',
          properties: {
            html_code: {
              type: 'string',
              description: 'HTML code to convert',
            },
            include_styles: {
              type: 'boolean',
              description: 'Whether to include inline styles',
              default: true,
            },
          },
          required: ['html_code'],
        },
      },
      {
        name: 'validate_figma_component_editability',
        description: 'Check if generated design can be edited in Figma',
        inputSchema: {
          type: 'object',
          properties: {
            generated_design_element: {
              type: 'object',
              description: 'Generated design element data',
            },
            target_figma_format: {
              type: 'string',
              enum: ['component', 'frame', 'group'],
              description: 'Target Figma element type',
            },
          },
          required: ['generated_design_element'],
        },
      },
      {
        name: 'analyze_design_consistency',
        description: 'Check design consistency with design system',
        inputSchema: {
          type: 'object',
          properties: {
            design_data_json: {
              type: 'object',
              description: 'Design data to analyze',
            },
            design_system_rules_url: {
              type: 'string',
              description: 'URL or reference to design system rules',
            },
          },
          required: ['design_data_json'],
        },
      },
      {
        name: 'check_accessibility',
        description: 'Check accessibility compliance and provide suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            design_data_or_code: {
              type: 'string',
              description: 'Design data JSON or generated code',
            },
            wcag_level: {
              type: 'string',
              enum: ['A', 'AA', 'AAA'],
              description: 'WCAG compliance level',
              default: 'AA',
            },
          },
          required: ['design_data_or_code'],
        },
      },
    ];
  }

  async getPrompts(): Promise<MCPPrompt[]> {
    return [
      {
        name: 'react_component_generator',
        description: 'Generate React component from Figma design',
        arguments: [
          {
            name: 'component_name',
            description: 'Name for the React component',
            required: true,
          },
          {
            name: 'design_description',
            description: 'Description of the design to convert',
            required: true,
          },
        ],
      },
      {
        name: 'accessibility_audit',
        description: 'Perform accessibility audit on design or code',
        arguments: [
          {
            name: 'target',
            description: 'Design or code to audit',
            required: true,
          },
        ],
      },
    ];
  }

  async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'generate_code':
        return this.generateCode(args);
      
      case 'create_claude_artifact_mockup':
        return this.createClaudeArtifactMockup(args);
      
      case 'export_to_figma_make_format':
        return this.exportToFigmaMakeFormat(args);
      
      case 'validate_figma_component_editability':
        return this.validateFigmaComponentEditability(args);
      
      case 'analyze_design_consistency':
        return this.analyzeDesignConsistency(args);
      
      case 'check_accessibility':
        return this.checkAccessibility(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async getResource(uri: string): Promise<any> {
    const [protocol, path] = uri.split('://');
    if (protocol !== 'codegen') {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }

    const parts = path.split('/');
    
    if (parts[0] === 'templates' && parts[1]) {
      return this.getCodeTemplate(parts[1]);
    } else if (parts[0] === 'design-systems' && parts[1]) {
      return this.getDesignSystemRules(parts[1]);
    } else if (parts[0] === 'accessibility' && parts[1]) {
      return this.getAccessibilityGuidelines(parts[1]);
    } else {
      throw new Error(`Invalid codegen URI: ${uri}`);
    }
  }

  // Code generation methods
  private async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    const {
      designData,
      targetFramework,
      styling = 'tailwind',
      userPrompt,
      designSystemReference,
      accessibilityLevel = 'wcag-aa',
    } = request;

    try {
      // Build comprehensive prompt for Claude
      const prompt = this.buildCodeGenerationPrompt(
        designData,
        targetFramework,
        styling,
        userPrompt,
        designSystemReference,
        accessibilityLevel
      );

      // Call Claude API for code generation
      const claudeResponse = await this.callClaudeAPI(prompt);
      
      // Parse and structure the response
      const generatedCode = this.parseCodeResponse(claudeResponse);
      
      // Perform accessibility check
      const accessibilityResult = await this.performAccessibilityCheck(
        generatedCode,
        accessibilityLevel
      );
      
      // Check design system compliance
      const designSystemResult = await this.checkDesignSystemCompliance(
        generatedCode,
        designSystemReference
      );

      return {
        code: generatedCode,
        dependencies: this.extractDependencies(generatedCode, targetFramework, styling),
        framework: targetFramework,
        styling,
        accessibility: accessibilityResult,
        designSystem: designSystemResult,
      };
    } catch (error) {
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createClaudeArtifactMockup(args: {
    design_data_json: any;
    user_prompt: string;
    artifact_type?: string;
  }): Promise<ClaudeArtifactResult> {
    const { design_data_json, user_prompt, artifact_type = 'html' } = args;

    try {
      const prompt = this.buildArtifactPrompt(design_data_json, user_prompt, artifact_type);
      
      // Call Claude API with Artifacts capability
      const artifactResponse = await this.callClaudeAPIForArtifacts(prompt, artifact_type);
      
      // Check Figma compatibility
      const figmaCompatible = await this.checkFigmaCompatibility(artifactResponse);
      
      return {
        type: artifact_type as 'html' | 'react' | 'image',
        content: artifactResponse,
        figmaCompatible,
        exportFormat: figmaCompatible ? 'figma-make' : 'html',
      };
    } catch (error) {
      throw new Error(`Artifact creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exportToFigmaMakeFormat(args: {
    html_code: string;
    include_styles?: boolean;
  }): Promise<{ success: boolean; figmaCode: string; warnings: string[] }> {
    const { html_code, include_styles = true } = args;
    
    try {
      // Convert HTML to Figma Make compatible format
      const figmaCode = this.convertHTMLToFigmaFormat(html_code, include_styles);
      
      // Validate conversion
      const warnings = this.validateFigmaConversion(figmaCode);
      
      return {
        success: warnings.length === 0,
        figmaCode,
        warnings,
      };
    } catch (error) {
      throw new Error(`Figma Make export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateFigmaComponentEditability(args: {
    generated_design_element: any;
    target_figma_format?: string;
  }): Promise<{
    editable: boolean;
    supportedFeatures: string[];
    limitations: string[];
    recommendations: string[];
  }> {
    const { generated_design_element, target_figma_format = 'component' } = args;
    
    // Analyze the generated element for Figma compatibility
    const analysis = this.analyzeFigmaEditability(generated_design_element, target_figma_format);
    
    return analysis;
  }

  private async analyzeDesignConsistency(args: {
    design_data_json: any;
    design_system_rules_url?: string;
  }): Promise<{
    compliance: boolean;
    issues: string[];
    suggestions: string[];
    score: number;
  }> {
    const { design_data_json, design_system_rules_url } = args;
    
    // Load design system rules
    const designSystemRules = design_system_rules_url 
      ? await this.loadDesignSystemRules(design_system_rules_url)
      : this.getDefaultDesignSystemRules();
    
    // Analyze consistency
    const analysis = this.performDesignConsistencyCheck(design_data_json, designSystemRules);
    
    return analysis;
  }

  private async checkAccessibility(args: {
    design_data_or_code: string;
    wcag_level?: string;
  }): Promise<{
    level: string;
    compliance: boolean;
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      description: string;
      suggestion: string;
    }>;
    score: number;
  }> {
    const { design_data_or_code, wcag_level = 'AA' } = args;
    
    // Parse input (JSON or code)
    const isCode = design_data_or_code.includes('<') || design_data_or_code.includes('function');
    
    let accessibilityIssues: any[] = [];
    
    if (isCode) {
      accessibilityIssues = this.analyzeCodeAccessibility(design_data_or_code, wcag_level);
    } else {
      try {
        const designData = JSON.parse(design_data_or_code);
        accessibilityIssues = this.analyzeDesignAccessibility(designData, wcag_level);
      } catch {
        throw new Error('Invalid design data or code format');
      }
    }
    
    const compliance = accessibilityIssues.filter(issue => issue.severity === 'error').length === 0;
    const score = Math.max(0, 100 - (accessibilityIssues.length * 10));
    
    return {
      level: wcag_level,
      compliance,
      issues: accessibilityIssues,
      score,
    };
  }

  // Helper methods
  private buildCodeGenerationPrompt(
    designData: any,
    framework: string,
    styling: string,
    userPrompt?: string,
    designSystem?: any,
    accessibilityLevel?: string
  ): string {
    let prompt = `Generate ${framework} code with ${styling} styling based on the following Figma design data:

${JSON.stringify(designData, null, 2)}

Requirements:
- Framework: ${framework}
- Styling: ${styling}
- Accessibility level: ${accessibilityLevel || 'WCAG AA'}
- Responsive design principles
- Clean, maintainable code
- Proper semantic HTML structure`;

    if (designSystem) {
      prompt += `\n\nDesign System Rules:\n${JSON.stringify(designSystem, null, 2)}`;
    }

    if (userPrompt) {
      prompt += `\n\nAdditional Instructions:\n${userPrompt}`;
    }

    prompt += `\n\nPlease provide:
1. Complete, functional code
2. Proper accessibility attributes
3. Responsive design implementation
4. Comments explaining complex parts
5. Component props/interfaces if applicable`;

    return prompt;
  }

  private buildArtifactPrompt(designData: any, userPrompt: string, artifactType: string): string {
    return `Create a ${artifactType} artifact based on this Figma design data:

${JSON.stringify(designData, null, 2)}

User Request: ${userPrompt}

Please create an interactive ${artifactType} mockup that:
1. Accurately represents the design
2. Is compatible with Figma import if possible
3. Includes proper styling and layout
4. Is fully functional and interactive
5. Follows web standards and accessibility guidelines`;
  }

  private async callClaudeAPI(prompt: string): Promise<string> {
    // For now, return a mock response - replace with actual Anthropic API call
    const mockCode = `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;`;

    return mockCode;
  }

  private async callClaudeAPIForArtifacts(prompt: string, artifactType: string): Promise<string> {
    // Mock artifact response
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Mockup</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Generated Mockup</h1>
            <p>This is a generated mockup based on the Figma design data.</p>
        </div>
    </div>
</body>
</html>`;
  }

  private parseCodeResponse(response: string): string {
    // Extract code from Claude's response
    const codeBlockRegex = /```(?:typescript|javascript|jsx|tsx)?\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1] : response;
  }

  private extractDependencies(code: string, framework: string, styling: string): string[] {
    const dependencies = ['react', '@types/react'];
    
    if (styling === 'tailwind') {
      dependencies.push('tailwindcss');
    } else if (styling === 'styled-components') {
      dependencies.push('styled-components', '@types/styled-components');
    }
    
    return dependencies;
  }

  private async performAccessibilityCheck(code: string, level: string): Promise<any> {
    // Mock accessibility check
    return {
      level,
      features: ['semantic HTML', 'ARIA attributes', 'keyboard navigation'],
      warnings: [],
    };
  }

  private async checkDesignSystemCompliance(code: string, designSystem?: any): Promise<any> {
    // Mock design system check
    return {
      compliance: true,
      issues: [],
      suggestions: [],
    };
  }

  private async checkFigmaCompatibility(artifact: string): Promise<boolean> {
    // Check if artifact can be imported to Figma
    return artifact.includes('<!DOCTYPE html>');
  }

  private convertHTMLToFigmaFormat(html: string, includeStyles: boolean): string {
    // Convert HTML to Figma Make compatible format
    // This is a simplified implementation
    return html.replace(/<script.*?>.*?<\/script>/gs, '');
  }

  private validateFigmaConversion(figmaCode: string): string[] {
    const warnings = [];
    if (figmaCode.includes('script')) {
      warnings.push('JavaScript functionality will be lost in Figma');
    }
    return warnings;
  }

  private analyzeFigmaEditability(element: any, format: string): any {
    return {
      editable: true,
      supportedFeatures: ['layout', 'colors', 'typography'],
      limitations: ['complex animations', 'dynamic content'],
      recommendations: ['Use simple layouts', 'Avoid JavaScript interactions'],
    };
  }

  private performDesignConsistencyCheck(designData: any, rules: any): any {
    return {
      compliance: true,
      issues: [],
      suggestions: [],
      score: 95,
    };
  }

  private analyzeCodeAccessibility(code: string, level: string): any[] {
    const issues = [];
    
    if (!code.includes('aria-')) {
      issues.push({
        type: 'missing-aria',
        severity: 'warning',
        description: 'Missing ARIA attributes',
        suggestion: 'Add appropriate ARIA labels and descriptions',
      });
    }
    
    return issues;
  }

  private analyzeDesignAccessibility(designData: any, level: string): any[] {
    // Analyze design data for accessibility issues
    return [];
  }

  private getCodeTemplate(framework: string): any {
    return { template: `// ${framework} template` };
  }

  private getDesignSystemRules(systemName: string): any {
    return { rules: `Design system rules for ${systemName}` };
  }

  private getAccessibilityGuidelines(level: string): any {
    return { guidelines: `WCAG ${level} guidelines` };
  }

  private async loadDesignSystemRules(url: string): Promise<any> {
    // Load design system rules from URL
    return {};
  }

  private getDefaultDesignSystemRules(): any {
    return {
      spacing: [4, 8, 16, 24, 32],
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
      },
      typography: {
        sizes: [12, 14, 16, 18, 20, 24],
        weights: [400, 500, 600, 700],
      },
    };
  }
}