import axios from 'axios';
import { BaseMCPServer, MCPResource, MCPTool, MCPPrompt } from '../mcpServer';

// Figma API Types
interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  style?: FigmaStyle;
  characters?: string;
  componentPropertyDefinitions?: any;
}

interface FigmaFill {
  type: string;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  gradientHandlePositions?: any[];
  gradientStops?: any[];
}

interface FigmaStroke {
  type: string;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

interface FigmaEffect {
  type: string;
  visible: boolean;
  radius?: number;
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  offset?: {
    x: number;
    y: number;
  };
}

interface FigmaStyle {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
}

// Structured design data for code generation
interface StructuredDesignData {
  fileId: string;
  fileName: string;
  components: DesignComponent[];
  styles: DesignStyles;
  lastModified: string;
}

interface DesignComponent {
  id: string;
  name: string;
  type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styles: {
    background?: string;
    border?: string;
    borderRadius?: number;
    padding?: string;
    margin?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    textAlign?: string;
  };
  children?: DesignComponent[];
  text?: string;
  properties?: any;
}

interface DesignStyles {
  colors: { name: string; value: string }[];
  fonts: { name: string; family: string; weight: number; size: number }[];
  spacing: { name: string; value: number }[];
}

export class FigmaServer extends BaseMCPServer {
  private apiKey: string;
  private baseUrl: string = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    super('figma-server', '1.0.0');
    this.apiKey = apiKey;
    this.enableResources();
    this.enableTools();
    this.enablePrompts();
  }

  async getResources(): Promise<MCPResource[]> {
    return [
      {
        name: 'figma_file',
        uri: 'figma://file/{file_id}',
        description: 'Access to Figma file data including all nodes and metadata',
        mimeType: 'application/json',
      },
      {
        name: 'figma_node',
        uri: 'figma://node/{file_id}/{node_id}',
        description: 'Access to specific Figma node data',
        mimeType: 'application/json',
      },
      {
        name: 'figma_components',
        uri: 'figma://components/{file_id}',
        description: 'List of all components in a Figma file',
        mimeType: 'application/json',
      },
    ];
  }

  async getTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'get_figma_file_structure',
        description: 'Get the complete structure of a Figma file',
        inputSchema: {
          type: 'object',
          properties: {
            file_id: {
              type: 'string',
              description: 'The Figma file ID',
            },
          },
          required: ['file_id'],
        },
      },
      {
        name: 'get_figma_node_details',
        description: 'Get detailed information about a specific Figma node',
        inputSchema: {
          type: 'object',
          properties: {
            file_id: {
              type: 'string',
              description: 'The Figma file ID',
            },
            node_id: {
              type: 'string',
              description: 'The specific node ID',
            },
          },
          required: ['file_id', 'node_id'],
        },
      },
      {
        name: 'extract_component_props',
        description: 'Extract component properties and variants from a Figma component',
        inputSchema: {
          type: 'object',
          properties: {
            file_id: {
              type: 'string',
              description: 'The Figma file ID',
            },
            node_id: {
              type: 'string',
              description: 'The component node ID',
            },
          },
          required: ['file_id', 'node_id'],
        },
      },
      {
        name: 'analyze_design_structure',
        description: 'Analyze and structure Figma design data for code generation',
        inputSchema: {
          type: 'object',
          properties: {
            file_id: {
              type: 'string',
              description: 'The Figma file ID',
            },
            node_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of specific node IDs to analyze',
            },
          },
          required: ['file_id'],
        },
      },
    ];
  }

  async getPrompts(): Promise<MCPPrompt[]> {
    return [
      {
        name: 'analyze_figma_design',
        description: 'Analyze a Figma design for code generation',
        arguments: [
          {
            name: 'file_id',
            description: 'Figma file ID',
            required: true,
          },
          {
            name: 'focus_area',
            description: 'Specific area or component to focus on',
            required: false,
          },
        ],
      },
    ];
  }

  async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_figma_file_structure':
        return this.getFigmaFileStructure(args.file_id);
      
      case 'get_figma_node_details':
        return this.getFigmaNodeDetails(args.file_id, args.node_id);
      
      case 'extract_component_props':
        return this.extractComponentProps(args.file_id, args.node_id);
      
      case 'analyze_design_structure':
        return this.analyzeDesignStructure(args.file_id, args.node_ids);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async getResource(uri: string): Promise<any> {
    const [protocol, path] = uri.split('://');
    if (protocol !== 'figma') {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }

    const parts = path.split('/');
    
    if (parts[0] === 'file' && parts[1]) {
      return this.getFigmaFileStructure(parts[1]);
    } else if (parts[0] === 'node' && parts[1] && parts[2]) {
      return this.getFigmaNodeDetails(parts[1], parts[2]);
    } else if (parts[0] === 'components' && parts[1]) {
      return this.getFileComponents(parts[1]);
    } else {
      throw new Error(`Invalid Figma URI: ${uri}`);
    }
  }

  // Figma API Methods
  private async getFigmaFileStructure(fileId: string): Promise<FigmaFile> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Figma API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private async getFigmaNodeDetails(fileId: string, nodeId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileId}/nodes`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
        params: {
          ids: nodeId,
        },
      });

      return response.data.nodes[nodeId];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Figma API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private async extractComponentProps(fileId: string, nodeId: string): Promise<any> {
    const nodeDetails = await this.getFigmaNodeDetails(fileId, nodeId);
    
    if (!nodeDetails || nodeDetails.document.type !== 'COMPONENT') {
      throw new Error('Node is not a component');
    }

    return {
      componentName: nodeDetails.document.name,
      properties: nodeDetails.document.componentPropertyDefinitions || {},
      variants: this.extractVariants(nodeDetails.document),
      styles: this.extractNodeStyles(nodeDetails.document),
    };
  }

  private async analyzeDesignStructure(fileId: string, nodeIds?: string[]): Promise<StructuredDesignData> {
    const fileData = await this.getFigmaFileStructure(fileId);
    
    let targetNodes: FigmaNode[];
    if (nodeIds && nodeIds.length > 0) {
      // Get specific nodes
      const nodePromises = nodeIds.map(id => this.getFigmaNodeDetails(fileId, id));
      const nodeResults = await Promise.all(nodePromises);
      targetNodes = nodeResults.map(result => result.document);
    } else {
      // Analyze entire file
      targetNodes = this.getAllNodes(fileData.document);
    }

    const components = targetNodes.map(node => this.convertToDesignComponent(node));
    const styles = this.extractDesignStyles(targetNodes);

    return {
      fileId,
      fileName: fileData.name,
      components,
      styles,
      lastModified: fileData.lastModified,
    };
  }

  private async getFileComponents(fileId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileId}/components`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Figma API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Helper methods for data processing
  private getAllNodes(node: FigmaNode): FigmaNode[] {
    const nodes = [node];
    if (node.children) {
      for (const child of node.children) {
        nodes.push(...this.getAllNodes(child));
      }
    }
    return nodes;
  }

  private convertToDesignComponent(node: FigmaNode): DesignComponent {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      position: {
        x: node.absoluteBoundingBox?.x || 0,
        y: node.absoluteBoundingBox?.y || 0,
        width: node.absoluteBoundingBox?.width || 0,
        height: node.absoluteBoundingBox?.height || 0,
      },
      styles: this.extractNodeStyles(node),
      children: node.children?.map(child => this.convertToDesignComponent(child)),
      text: node.characters,
      properties: node.componentPropertyDefinitions,
    };
  }

  private extractNodeStyles(node: FigmaNode): any {
    const styles: any = {};

    // Extract background/fill
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.background = this.rgbaToHex(fill.color);
      }
    }

    // Extract border/stroke
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        styles.border = `1px solid ${this.rgbaToHex(stroke.color)}`;
      }
    }

    // Extract text styles
    if (node.style) {
      if (node.style.fontFamily) styles.fontFamily = node.style.fontFamily;
      if (node.style.fontSize) styles.fontSize = node.style.fontSize;
      if (node.style.fontWeight) styles.fontWeight = node.style.fontWeight;
      if (node.style.textAlignHorizontal) styles.textAlign = node.style.textAlignHorizontal.toLowerCase();
    }

    return styles;
  }

  private extractVariants(node: FigmaNode): any {
    // Extract component variants if available
    return {};
  }

  private extractDesignStyles(nodes: FigmaNode[]): DesignStyles {
    const colors: Set<string> = new Set();
    const fonts: Set<string> = new Set();
    const spacings: Set<number> = new Set();

    for (const node of nodes) {
      // Extract colors
      if (node.fills) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            colors.add(this.rgbaToHex(fill.color));
          }
        }
      }

      // Extract fonts
      if (node.style?.fontFamily) {
        fonts.add(`${node.style.fontFamily}-${node.style.fontWeight || 400}-${node.style.fontSize || 16}`);
      }

      // Extract spacing (simplified)
      if (node.absoluteBoundingBox) {
        spacings.add(node.absoluteBoundingBox.width);
        spacings.add(node.absoluteBoundingBox.height);
      }
    }

    return {
      colors: Array.from(colors).map((color, index) => ({
        name: `color-${index + 1}`,
        value: color,
      })),
      fonts: Array.from(fonts).map((font, index) => {
        const [family, weight, size] = font.split('-');
        return {
          name: `font-${index + 1}`,
          family,
          weight: parseInt(weight),
          size: parseInt(size),
        };
      }),
      spacing: Array.from(spacings).map((spacing, index) => ({
        name: `spacing-${index + 1}`,
        value: spacing,
      })),
    };
  }

  private rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/me`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}