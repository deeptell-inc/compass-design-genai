import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { config } from '../config';

export interface FigmaDesignData {
  fileId: string;
  fileName: string;
  components: any[];
  styles: any;
  lastModified: string;
}

export interface MCPFigmaResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class MCPClientService {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;

  constructor() {}

  async connect(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true;
    }

    try {
      // Start the Figma MCP server as subprocess
      this.transport = new StdioClientTransport({
        command: "node",
        args: ["dist/mcp/figmaServerWrapper.js"]
      });

      this.client = new Client(
        { name: "compass-figma-client", version: "1.0.0" },
        { capabilities: {} }
      );

      await this.client.connect(this.transport);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getFigmaFileStructure(fileId: string): Promise<MCPFigmaResult> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Failed to connect to MCP server' };
      }
    }

    try {
      const result = await this.client!.callTool({
        name: "get_figma_file_structure",
        arguments: { file_id: fileId }
      });

      return {
        success: true,
        data: result.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeDesignStructure(fileId: string, nodeIds?: string[]): Promise<MCPFigmaResult> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Failed to connect to MCP server' };
      }
    }

    try {
      const result = await this.client!.callTool({
        name: "analyze_design_structure",
        arguments: { 
          file_id: fileId,
          node_ids: nodeIds 
        }
      });

      return {
        success: true,
        data: result.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getNodeDetails(fileId: string, nodeId: string): Promise<MCPFigmaResult> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Failed to connect to MCP server' };
      }
    }

    try {
      const result = await this.client!.callTool({
        name: "get_figma_node_details",
        arguments: { 
          file_id: fileId,
          node_id: nodeId 
        }
      });

      return {
        success: true,
        data: result.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async extractComponentProps(fileId: string, nodeId: string): Promise<MCPFigmaResult> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Failed to connect to MCP server' };
      }
    }

    try {
      const result = await this.client!.callTool({
        name: "extract_component_props",
        arguments: { 
          file_id: fileId,
          node_id: nodeId 
        }
      });

      return {
        success: true,
        data: result.content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listAvailableTools(): Promise<MCPFigmaResult> {
    if (!this.isConnected || !this.client) {
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Failed to connect to MCP server' };
      }
    }

    try {
      const result = await this.client!.listTools();
      return {
        success: true,
        data: result.tools
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error closing MCP client:', error);
      }
    }
    this.client = null;
    this.transport = null;
    this.isConnected = false;
  }

  // Helper method to extract meaningful design insights for brainstorming
  async extractDesignInsights(fileId: string): Promise<{
    success: boolean;
    insights?: {
      colors: string[];
      typography: string[];
      components: string[];
      layout: string[];
      suggestions: string[];
    };
    error?: string;
  }> {
    try {
      const analysisResult = await this.analyzeDesignStructure(fileId);
      
      if (!analysisResult.success || !analysisResult.data) {
        return { success: false, error: analysisResult.error };
      }

      const designData = analysisResult.data[0] as FigmaDesignData;
      
      const insights = {
        colors: designData.styles?.colors?.map((c: any) => `${c.name}: ${c.value}`) || [],
        typography: designData.styles?.fonts?.map((f: any) => `${f.name}: ${f.family} ${f.weight} ${f.size}px`) || [],
        components: designData.components?.map((c: any) => `${c.name} (${c.type})`) || [],
        layout: designData.components?.map((c: any) => 
          `${c.name}: ${c.position.width}x${c.position.height}`
        ) || [],
        suggestions: [
          `このデザインには${designData.components?.length || 0}個のコンポーネントがあります`,
          `主要なカラーパレット: ${designData.styles?.colors?.length || 0}色`,
          `タイポグラフィスタイル: ${designData.styles?.fonts?.length || 0}種類`,
          `最終更新: ${new Date(designData.lastModified).toLocaleDateString('ja-JP')}`
        ]
      };

      return { success: true, insights };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract design insights'
      };
    }
  }
}