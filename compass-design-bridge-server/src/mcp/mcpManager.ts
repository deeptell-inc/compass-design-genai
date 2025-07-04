import { MCPHost } from './mcpHost';
import { FigmaServer } from './servers/figmaServer';
import { CodegenServer } from './servers/codegenServer';
import { AIDecisionServer } from './servers/aiDecisionServer';
import { BaseMCPServer } from './mcpServer';
import { config } from '../config';

// MCP Manager - Centralized management of all MCP servers
export class MCPManager {
  private mcpHost: MCPHost;
  private figmaServer?: FigmaServer;
  private codegenServer?: CodegenServer;
  private aiDecisionServer?: AIDecisionServer;
  private isInitialized = false;

  constructor() {
    // Initialize MCP Host with LLM configuration
    this.mcpHost = new MCPHost({
      provider: 'anthropic', // Could also support 'openai'
      apiKey: config.anthropicApiKey || 'mock_key',
      model: 'claude-3-sonnet-20240229',
    });
  }

  // Initialize all MCP servers
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('MCP Manager already initialized');
      return;
    }

    try {
      console.log('Initializing MCP servers...');

      // Initialize Figma Server
      if (config.figmaApiKey) {
        this.figmaServer = new FigmaServer(config.figmaApiKey);
        this.mcpHost.registerServer('figma', this.figmaServer);
        console.log('Figma MCP Server registered');
      } else {
        console.warn('Figma API key not configured, skipping Figma server');
      }

      // Initialize Code Generation Server
      if (config.anthropicApiKey) {
        this.codegenServer = new CodegenServer(config.anthropicApiKey);
        this.mcpHost.registerServer('codegen', this.codegenServer);
        console.log('Code Generation MCP Server registered');
      } else {
        console.warn('Anthropic API key not configured, using mock responses');
        this.codegenServer = new CodegenServer('mock_key');
        this.mcpHost.registerServer('codegen', this.codegenServer);
      }

      // Initialize AI Decision Support Server
      if (config.anthropicApiKey) {
        this.aiDecisionServer = new AIDecisionServer(config.anthropicApiKey);
        this.mcpHost.registerServer('ai-decision', this.aiDecisionServer);
        console.log('AI Decision Support MCP Server registered');
      } else {
        console.warn('Anthropic API key not configured for AI Decision server');
        this.aiDecisionServer = new AIDecisionServer('mock_key');
        this.mcpHost.registerServer('ai-decision', this.aiDecisionServer);
      }

      this.isInitialized = true;
      console.log('MCP Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  // Get the MCP Host instance
  getHost(): MCPHost {
    return this.mcpHost;
  }

  // Get specific server instance
  getFigmaServer(): FigmaServer | undefined {
    return this.figmaServer;
  }

  getCodegenServer(): CodegenServer | undefined {
    return this.codegenServer;
  }

  getAIDecisionServer(): AIDecisionServer | undefined {
    return this.aiDecisionServer;
  }

  // Process a natural language request
  async processRequest(userPrompt: string, context?: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.mcpHost.processRequest(userPrompt, context);
  }

  // Direct tool calls for API endpoints
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.mcpHost.callTool(serverName, toolName, args);
  }

  // Get resource from a specific server
  async getResource(serverName: string, uri: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.mcpHost.getResource(serverName, uri);
  }

  // Get all available tools
  async getAllTools(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.mcpHost.getAllTools();
  }

  // Get all available resources
  async getAllResources(): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.mcpHost.getAllResources();
  }

  // Get system status
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      servers: this.mcpHost.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  // Handle MCP HTTP requests
  async handleMCPRequest(request: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Route request to appropriate server
    const { serverName, ...mcpRequest } = request;
    
    if (serverName && this.mcpHost.getStatus().servers.includes(serverName)) {
      const server = this.getServerByName(serverName);
      if (server) {
        return server.handleRequest(mcpRequest);
      }
    }

    // If no specific server, process with host
    return this.mcpHost.processRequest(mcpRequest.method || 'unknown', mcpRequest.params);
  }

  private getServerByName(name: string): BaseMCPServer | undefined {
    switch (name) {
      case 'figma':
        return this.figmaServer;
      case 'codegen':
        return this.codegenServer;
      case 'ai-decision':
        return this.aiDecisionServer;
      default:
        return undefined;
    }
  }

  // Shutdown all servers
  async shutdown(): Promise<void> {
    console.log('Shutting down MCP Manager...');
    // Add cleanup logic if needed
    this.isInitialized = false;
  }
}

// Create singleton instance
export const mcpManager = new MCPManager();