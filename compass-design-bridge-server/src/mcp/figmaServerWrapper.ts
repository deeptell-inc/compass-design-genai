import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { FigmaServer } from './servers/figmaServer';
import { config } from '../config';

async function main() {
  const apiKey = config.figmaApiKey || process.env.FIGMA_API_KEY;
  
  if (!apiKey) {
    console.error('FIGMA_API_KEY environment variable is required');
    process.exit(1);
  }

  const figmaServer = new FigmaServer(apiKey);
  
  const server = new Server(
    {
      name: "figma-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await figmaServer.getTools();
    return { tools };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await figmaServer.callTool(name, args || {});
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  });

  // Register resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await figmaServer.getResources();
    return { resources };
  });

  // Register resource read handler  
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const data = await figmaServer.getResource(uri);
    
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Error starting Figma MCP server:', error);
  process.exit(1);
});