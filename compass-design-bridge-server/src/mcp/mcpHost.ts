import { EventEmitter } from 'events';
import { BaseMCPServer, MCPClient, MCPResource, MCPTool } from './mcpServer';

// MCP Host - Central orchestrator for multiple MCP servers
export class MCPHost extends EventEmitter {
  private servers: Map<string, BaseMCPServer> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private llmConfig: {
    provider: 'anthropic' | 'openai';
    apiKey: string;
    model: string;
  };

  constructor(llmConfig: {
    provider: 'anthropic' | 'openai';
    apiKey: string;
    model: string;
  }) {
    super();
    this.llmConfig = llmConfig;
  }

  // Register MCP servers
  registerServer(name: string, server: BaseMCPServer): void {
    this.servers.set(name, server);
    console.log(`MCP Server '${name}' registered`);
  }

  // Register MCP clients for external servers
  registerClient(name: string, client: MCPClient): void {
    this.clients.set(name, client);
    console.log(`MCP Client '${name}' registered`);
  }

  // Get all available resources from all servers
  async getAllResources(): Promise<{ server: string; resources: MCPResource[] }[]> {
    const allResources = [];

    for (const [serverName, server] of this.servers) {
      try {
        const resources = await server.getResources();
        allResources.push({ server: serverName, resources });
      } catch (error) {
        console.error(`Error getting resources from server '${serverName}':`, error);
      }
    }

    for (const [clientName, client] of this.clients) {
      try {
        const resources = await client.listResources();
        allResources.push({ server: clientName, resources });
      } catch (error) {
        console.error(`Error getting resources from client '${clientName}':`, error);
      }
    }

    return allResources;
  }

  // Get all available tools from all servers
  async getAllTools(): Promise<{ server: string; tools: MCPTool[] }[]> {
    const allTools = [];

    for (const [serverName, server] of this.servers) {
      try {
        const tools = await server.getTools();
        allTools.push({ server: serverName, tools });
      } catch (error) {
        console.error(`Error getting tools from server '${serverName}':`, error);
      }
    }

    for (const [clientName, client] of this.clients) {
      try {
        const tools = await client.listTools();
        allTools.push({ server: clientName, tools });
      } catch (error) {
        console.error(`Error getting tools from client '${clientName}':`, error);
      }
    }

    return allTools;
  }

  // Call a tool on a specific server
  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverName);
    if (server) {
      return await server.callTool(toolName, args);
    }

    const client = this.clients.get(serverName);
    if (client) {
      return await client.callTool(toolName, args);
    }

    throw new Error(`Server or client '${serverName}' not found`);
  }

  // Get resource from a specific server
  async getResource(serverName: string, uri: string): Promise<any> {
    const server = this.servers.get(serverName);
    if (server) {
      return await server.getResource(uri);
    }

    const client = this.clients.get(serverName);
    if (client) {
      return await client.getResource(uri);
    }

    throw new Error(`Server or client '${serverName}' not found`);
  }

  // Process natural language request with LLM integration
  async processRequest(userPrompt: string, context?: any): Promise<{
    response: string;
    toolCalls: Array<{
      server: string;
      tool: string;
      arguments: any;
      result: any;
    }>;
    resourcesUsed: Array<{
      server: string;
      uri: string;
      data: any;
    }>;
  }> {
    try {
      // Get available tools and resources for context
      const availableTools = await this.getAllTools();
      const availableResources = await this.getAllResources();

      // Create context for LLM
      const systemPrompt = this.buildSystemPrompt(availableTools, availableResources);
      
      // Call LLM to understand intent and plan execution
      const llmResponse = await this.callLLM(systemPrompt, userPrompt, context);
      
      // Parse LLM response to extract tool calls and resource requests
      const executionPlan = this.parseLLMResponse(llmResponse);
      
      // Execute the plan
      const toolCalls = [];
      const resourcesUsed = [];
      
      for (const action of executionPlan.actions) {
        if (action.type === 'tool_call' && action.tool) {
          try {
            const result = await this.callTool(action.server, action.tool, action.arguments);
            toolCalls.push({
              server: action.server,
              tool: action.tool,
              arguments: action.arguments,
              result,
            });
          } catch (error) {
            console.error(`Error calling tool ${action.tool} on ${action.server}:`, error);
          }
        } else if (action.type === 'resource_request' && action.uri) {
          try {
            const data = await this.getResource(action.server, action.uri);
            resourcesUsed.push({
              server: action.server,
              uri: action.uri,
              data,
            });
          } catch (error) {
            console.error(`Error getting resource ${action.uri} from ${action.server}:`, error);
          }
        }
      }

      // Generate final response with LLM based on execution results
      const finalResponse = await this.generateFinalResponse(
        userPrompt,
        toolCalls,
        resourcesUsed,
        executionPlan.response
      );

      return {
        response: finalResponse,
        toolCalls,
        resourcesUsed,
      };
    } catch (error) {
      throw new Error(`MCPHost processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(
    availableTools: { server: string; tools: MCPTool[] }[],
    availableResources: { server: string; resources: MCPResource[] }[]
  ): string {
    let prompt = `You are an AI assistant with access to the following tools and resources through MCP servers:

AVAILABLE TOOLS:
`;

    for (const { server, tools } of availableTools) {
      prompt += `\nServer: ${server}\n`;
      for (const tool of tools) {
        prompt += `- ${tool.name}: ${tool.description}\n`;
      }
    }

    prompt += `\nAVAILABLE RESOURCES:
`;

    for (const { server, resources } of availableResources) {
      prompt += `\nServer: ${server}\n`;
      for (const resource of resources) {
        prompt += `- ${resource.uri}: ${resource.description || 'No description'}\n`;
      }
    }

    prompt += `\nWhen processing user requests, respond with a JSON object containing:
{
  "response": "Your natural language response to the user",
  "actions": [
    {
      "type": "tool_call" | "resource_request",
      "server": "server_name",
      "tool": "tool_name" (if tool_call),
      "uri": "resource_uri" (if resource_request),
      "arguments": {} (if tool_call)
    }
  ]
}

Always provide helpful, detailed responses while efficiently using the available tools and resources.`;

    return prompt;
  }

  private async callLLM(systemPrompt: string, userPrompt: string, context?: any): Promise<string> {
    // This is a simplified implementation - in production, you'd integrate with actual LLM APIs
    if (this.llmConfig.provider === 'anthropic') {
      return this.callAnthropicAPI(systemPrompt, userPrompt, context);
    } else if (this.llmConfig.provider === 'openai') {
      return this.callOpenAIAPI(systemPrompt, userPrompt, context);
    } else {
      throw new Error(`Unsupported LLM provider: ${this.llmConfig.provider}`);
    }
  }

  private async callAnthropicAPI(systemPrompt: string, userPrompt: string, context?: any): Promise<string> {
    // For now, return a mock response - replace with actual Anthropic API call
    const mockResponse = {
      response: "Based on your request, I'll help you with that task.",
      actions: []
    };
    return JSON.stringify(mockResponse);
  }

  private async callOpenAIAPI(systemPrompt: string, userPrompt: string, context?: any): Promise<string> {
    // For now, return a mock response - replace with actual OpenAI API call
    const mockResponse = {
      response: "I understand your request and will process it accordingly.",
      actions: []
    };
    return JSON.stringify(mockResponse);
  }

  private parseLLMResponse(llmResponse: string): {
    response: string;
    actions: Array<{
      type: 'tool_call' | 'resource_request';
      server: string;
      tool?: string;
      uri?: string;
      arguments?: any;
    }>;
  } {
    try {
      return JSON.parse(llmResponse);
    } catch (error) {
      // Fallback parsing if JSON is malformed
      return {
        response: llmResponse,
        actions: [],
      };
    }
  }

  private async generateFinalResponse(
    originalPrompt: string,
    toolCalls: any[],
    resourcesUsed: any[],
    plannedResponse: string
  ): Promise<string> {
    // Combine the planned response with execution results
    let finalResponse = plannedResponse;

    if (toolCalls.length > 0 || resourcesUsed.length > 0) {
      finalResponse += "\n\nExecution Summary:";
      
      if (toolCalls.length > 0) {
        finalResponse += "\n\nTools used:";
        for (const call of toolCalls) {
          finalResponse += `\n- ${call.server}/${call.tool}: ${JSON.stringify(call.result)}`;
        }
      }

      if (resourcesUsed.length > 0) {
        finalResponse += "\n\nResources accessed:";
        for (const resource of resourcesUsed) {
          finalResponse += `\n- ${resource.server}/${resource.uri}`;
        }
      }
    }

    return finalResponse;
  }

  // Get status of all registered servers and clients
  getStatus(): {
    servers: string[];
    clients: string[];
    llmConfig: any;
  } {
    return {
      servers: Array.from(this.servers.keys()),
      clients: Array.from(this.clients.keys()),
      llmConfig: {
        provider: this.llmConfig.provider,
        model: this.llmConfig.model,
        // Don't expose API key
      },
    };
  }
}