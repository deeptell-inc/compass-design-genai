import { EventEmitter } from 'events';

// MCP Protocol Types
export interface MCPResource {
  name: string;
  uri: string;
  mimeType?: string;
  description?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: any[];
}

export interface MCPRequest {
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Base MCP Server Implementation
export abstract class BaseMCPServer extends EventEmitter {
  protected serverName: string;
  protected version: string;
  protected capabilities: {
    resources?: boolean;
    tools?: boolean;
    prompts?: boolean;
  };

  constructor(name: string, version: string = '1.0.0') {
    super();
    this.serverName = name;
    this.version = version;
    this.capabilities = {
      resources: false,
      tools: false,
      prompts: false,
    };
  }

  // Abstract methods to be implemented by concrete servers
  abstract getResources(): Promise<MCPResource[]>;
  abstract getTools(): Promise<MCPTool[]>;
  abstract getPrompts(): Promise<MCPPrompt[]>;
  abstract callTool(name: string, args: any): Promise<any>;
  abstract getResource(uri: string): Promise<any>;

  // Server info
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      capabilities: this.capabilities,
    };
  }

  // Handle MCP requests
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return {
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: this.capabilities,
              serverInfo: this.getServerInfo(),
            },
          };

        case 'list_resources':
          const resources = await this.getResources();
          return {
            id: request.id,
            result: { resources },
          };

        case 'list_tools':
          const tools = await this.getTools();
          return {
            id: request.id,
            result: { tools },
          };

        case 'list_prompts':
          const prompts = await this.getPrompts();
          return {
            id: request.id,
            result: { prompts },
          };

        case 'call_tool':
          const toolResult = await this.callTool(
            request.params?.name,
            request.params?.arguments || {}
          );
          return {
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
            },
          };

        case 'get_resource':
          const resourceData = await this.getResource(request.params?.uri);
          return {
            id: request.id,
            result: {
              contents: [
                {
                  uri: request.params?.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(resourceData, null, 2),
                },
              ],
            },
          };

        default:
          return {
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      return {
        id: request.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: error,
        },
      };
    }
  }

  // Enable specific capabilities
  protected enableResources() {
    this.capabilities.resources = true;
  }

  protected enableTools() {
    this.capabilities.tools = true;
  }

  protected enablePrompts() {
    this.capabilities.prompts = true;
  }
}

// MCP Client Implementation
export class MCPClient {
  private requestId: number = 1;

  constructor(private serverUrl: string) {}

  private generateId(): number {
    return this.requestId++;
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    const request: MCPRequest = {
      id: this.generateId(),
      method,
      params,
    };

    try {
      const response = await fetch(`${this.serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const mcpResponse = await response.json() as MCPResponse;

      if (mcpResponse.error) {
        throw new Error(`MCP Error: ${mcpResponse.error.message}`);
      }

      return mcpResponse.result;
    } catch (error) {
      throw new Error(`MCP Client Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convenience methods
  async initialize(): Promise<any> {
    return this.sendRequest('initialize');
  }

  async listResources(): Promise<MCPResource[]> {
    const result = await this.sendRequest('list_resources');
    return result.resources || [];
  }

  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest('list_tools');
    return result.tools || [];
  }

  async callTool(name: string, args: any): Promise<any> {
    return this.sendRequest('call_tool', { name, arguments: args });
  }

  async getResource(uri: string): Promise<any> {
    return this.sendRequest('get_resource', { uri });
  }
}