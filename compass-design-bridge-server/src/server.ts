import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config, validateConfig } from './config';
import { FigmaTool } from './tools/figmaTool';
import { CodeGenerationTool } from './tools/codeGenerationTool';
import { TextToDesignTool } from './tools/textToDesignTool';
import { BrainstormTool } from './tools/brainstormTool';
import { AIInsightsTool } from './tools/aiInsightsTool';
import { BusinessInsightsTool } from './tools/businessInsightsTool';
import { authService } from './services/authService';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from './middleware/auth';
import { mcpManager } from './mcp/mcpManager';
import { MCPClientService } from './services/mcpClientService';
import { databaseService } from './services/databaseService';
import figmaRoutes from './routes/figma';
import analyticsRoutes from './routes/analytics';

class CompassMCPServer {
  private server: Server;
  private tools: Map<string, any>;
  private app: express.Application;
  private mcpClient: MCPClientService;

  constructor() {
    this.server = new Server(
      {
        name: 'compass-design-bridge-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tools = new Map();
    this.app = express();
    this.mcpClient = new MCPClientService();
    this.initializeTools();
    this.setupHandlers();
    this.setupExpress();
  }

  private initializeTools() {
    const figmaTool = new FigmaTool();
    const codeGenerationTool = new CodeGenerationTool();
    const textToDesignTool = new TextToDesignTool();
    const brainstormTool = new BrainstormTool();
    const aiInsightsTool = new AIInsightsTool();
    const businessInsightsTool = new BusinessInsightsTool();

    this.tools.set('fetch_figma_design', figmaTool);
    this.tools.set('generate_code', codeGenerationTool);
    this.tools.set('generate_design_from_text', textToDesignTool);
    this.tools.set('generate_brainstorm_response', brainstormTool);
    this.tools.set('generate_ai_insights', aiInsightsTool);
    this.tools.set('generate_business_insights', businessInsightsTool);
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => tool.getToolDefinition());
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(await tool.execute(args), null, 2),
          },
        ],
      };
    });
  }

  private setupExpress() {
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:8080', 
        'https://compass-server.com'
      ],
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Mount API routes
    this.app.use('/api', figmaRoutes);
    this.app.use('/api/analytics', analyticsRoutes);

    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    this.app.get('/tools', (req, res) => {
      const tools = Array.from(this.tools.values()).map(tool => tool.getToolDefinition());
      res.json({ tools });
    });

    this.app.post('/auth/register', async (req, res) => {
      try {
        console.log('Register request received:', { email: req.body.email });
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
          });
        }

        const result = await authService.register(email, password);
        console.log('Registration successful for:', email);
        res.json({ success: true, data: result });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Registration failed' 
        });
      }
    });

    this.app.post('/auth/login', async (req, res) => {
      try {
        console.log('Login request received:', { email: req.body.email });
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
          });
        }

        const result = await authService.login(email, password);
        console.log('Login successful for:', email);
        res.json({ success: true, data: result });
      } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Login failed' 
        });
      }
    });

    this.app.post('/execute/:toolName', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { toolName } = req.params;
        const args = { ...req.body, userId: req.user?.userId };

        const tool = this.tools.get(toolName);
        if (!tool) {
          return res.status(404).json({ error: `Tool not found: ${toolName}` });
        }

        const result = await tool.execute(args);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    this.app.post('/execute/public/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        const tool = this.tools.get(toolName);
        if (!tool) {
          return res.status(404).json({ error: `Tool not found: ${toolName}` });
        }

        const result = await tool.execute(args);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    this.app.post('/events/track', async (req, res) => {
      try {
        const { userId, anonymousId, sessionId, eventType, url, elementSelector, payload, eventTimestamp } = req.body;
        
        const { simpleDatabaseService } = await import('./services/simpleDatabaseService');
        await simpleDatabaseService.saveUserEvent(
          userId || null,
          anonymousId || null,
          sessionId || null,
          eventType,
          url || null,
          elementSelector || null,
          payload || {},
          new Date(eventTimestamp || Date.now())
        );
        
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to track event',
        });
      }
    });

    // Demo auth endpoint for testing
    this.app.post('/auth/demo', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // デモ用の簡単な認証
        if (email && password) {
          const token = authService.generateToken('demo-user', email);
          const isAdmin = email.toLowerCase() === 'info@deeptell.jp';
          
          res.json({
            success: true,
            data: {
              token,
              user: { 
                id: 'demo-user', 
                email,
                isAdmin 
              }
            }
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Email and password are required'
          });
        }
      } catch (error) {
        console.error('Demo auth error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication failed'
        });
      }
    });


    this.app.post('/api/token/refresh', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.userId;
        const email = req.user?.email;
        
        if (!userId || !email) {
          return res.status(401).json({
            success: false,
            error: 'User not authenticated'
          });
        }

        // Generate new JWT token
        const newToken = authService.generateToken(userId, email);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        res.json({
          success: true,
          data: {
            token: newToken,
            expiresAt
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to refresh token'
        });
      }
    });

    // MCP API endpoints
    this.app.get('/api/mcp/status', async (req, res) => {
      try {
        const status = mcpManager.getStatus();
        res.json({ success: true, data: status });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get MCP status',
        });
      }
    });

    this.app.get('/api/mcp/tools', async (req, res) => {
      try {
        const tools = await mcpManager.getAllTools();
        res.json({ success: true, data: tools });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get tools',
        });
      }
    });

    this.app.get('/api/mcp/resources', async (req, res) => {
      try {
        const resources = await mcpManager.getAllResources();
        res.json({ success: true, data: resources });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get resources',
        });
      }
    });

    this.app.post('/api/mcp/process', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
          return res.status(400).json({
            success: false,
            error: 'Prompt is required',
          });
        }

        const result = await mcpManager.processRequest(prompt, {
          ...context,
          userId: req.user?.userId,
        });

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process request',
        });
      }
    });

    this.app.post('/api/mcp/tool/:serverName/:toolName', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { serverName, toolName } = req.params;
        const args = { ...req.body, userId: req.user?.userId };

        const result = await mcpManager.callTool(serverName, toolName, args);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to call tool',
        });
      }
    });

    this.app.get('/api/mcp/resource/:serverName', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { serverName } = req.params;
        const { uri } = req.query;

        if (!uri) {
          return res.status(400).json({
            success: false,
            error: 'URI parameter is required',
          });
        }

        const result = await mcpManager.getResource(serverName, uri as string);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get resource',
        });
      }
    });

    // MCP Protocol endpoint for direct MCP communication
    this.app.post('/mcp', async (req, res) => {
      try {
        const mcpResponse = await mcpManager.handleMCPRequest(req.body);
        res.json(mcpResponse);
      } catch (error) {
        res.status(500).json({
          id: req.body.id || null,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

    // Business Strategy API endpoints
    this.app.post('/api/business-strategy/generate-suggestions', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { type, context } = req.body;
        
        let prompt = '';
        switch (type) {
          case 'mission-vision':
            prompt = `Generate mission and vision suggestions for: ${JSON.stringify(context)}`;
            break;
          case 'persona':
            prompt = `Generate persona templates for: ${JSON.stringify(context)}`;
            break;
          case 'positioning':
            prompt = `Generate market positioning analysis for: ${JSON.stringify(context)}`;
            break;
          default:
            return res.status(400).json({
              success: false,
              error: 'Invalid suggestion type',
            });
        }

        const result = await mcpManager.processRequest(prompt, context);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        });
      }
    });

    // Brainstorming API endpoints
    this.app.post('/api/brainstorming/generate-ideas', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { tool, topic, context } = req.body;
        
        const prompt = `Generate creative ideas using ${tool} for topic: ${topic}. Context: ${JSON.stringify(context)}`;
        const result = await mcpManager.processRequest(prompt, {
          tool,
          topic,
          ...context,
          userId: req.user?.userId,
        });

        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate ideas',
        });
      }
    });

    // Code Generation API endpoints
    this.app.post('/api/codegen/generate-from-figma', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { figmaFileId, nodeId, framework, styling, userPrompt } = req.body;

        // First get Figma design data
        const designData = await mcpManager.callTool('figma', 'analyze_design_structure', {
          file_id: figmaFileId,
          node_ids: nodeId ? [nodeId] : undefined,
        });

        // Then generate code
        const codeResult = await mcpManager.callTool('codegen', 'generate_code', {
          design_data_json: designData,
          target_framework: framework || 'react',
          styling: styling || 'tailwind',
          user_prompt: userPrompt,
        });

        res.json({ success: true, data: { designData, codeResult } });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate code from Figma',
        });
      }
    });

    // AI Decision Support API endpoints
    this.app.post('/api/ai-decision/ui-improvements', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const result = await mcpManager.callTool('ai-decision', 'generate_ui_improvement_suggestions', req.body);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate UI improvements',
        });
      }
    });

    this.app.post('/api/ai-decision/catchphrases', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const result = await mcpManager.callTool('ai-decision', 'generate_catchphrases_for_kpi', req.body);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate catchphrases',
        });
      }
    });

    // Figma MCP Client API endpoints for brainstorming
    this.app.post('/api/figma-mcp/analyze-design', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { fileId, nodeIds } = req.body;
        
        if (!fileId) {
          return res.status(400).json({
            success: false,
            error: 'Figma file ID is required'
          });
        }

        // Use direct Figma service instead of MCP client for better reliability
        const { FigmaService } = await import('./services/figmaService');
        
        // Get stored Figma API key for user (for now use config or demo key)
        const figmaApiKey = config.figmaApiKey || 'demo-figma-key';
        const figmaService = new FigmaService(figmaApiKey);
        
        const figmaFile = await figmaService.getFile(fileId);
        const designTokens = figmaService.extractDesignTokens(figmaFile);
        
        const result = {
          success: true,
          data: {
            fileId,
            fileName: figmaFile.name,
            designTokens,
            lastModified: figmaFile.lastModified
          }
        };
        
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze design'
        });
      }
    });

    this.app.post('/api/figma-mcp/extract-insights', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { fileId } = req.body;
        
        if (!fileId) {
          return res.status(400).json({
            success: false,
            error: 'Figma file ID is required'
          });
        }

        // Use direct Figma service instead of MCP client
        const { FigmaService } = await import('./services/figmaService');
        
        // Get stored Figma API key for user (for now use config or demo key)
        const figmaApiKey = config.figmaApiKey || 'demo-figma-key';
        const figmaService = new FigmaService(figmaApiKey);
        
        const figmaFile = await figmaService.getFile(fileId);
        const designTokens = figmaService.extractDesignTokens(figmaFile);
        
        // Extract insights from design tokens
        const colorTokens = designTokens.filter(t => t.type === 'color');
        const fontTokens = designTokens.filter(t => t.category === 'typography');
        
        const insights = {
          colors: colorTokens.map(c => `${c.name}: ${c.value}`),
          typography: fontTokens.map(f => `${f.name}: ${f.value}`),
          components: [`${figmaFile.name} (DOCUMENT)`],
          layout: [`File: ${figmaFile.name}`],
          suggestions: [
            `このデザインには${colorTokens.length}個のカラートークンがあります`,
            `ファイル名: ${figmaFile.name}`,
            `最終更新: ${new Date(figmaFile.lastModified).toLocaleDateString('ja-JP')}`
          ]
        };

        res.json({
          success: true,
          insights
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to extract insights'
        });
      }
    });

    this.app.get('/api/figma-mcp/tools', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        // Return mock tools list for now
        const result = {
          success: true,
          data: [
            { name: 'fetch_figma_design', description: 'Fetch design data from Figma file' },
            { name: 'extract_design_tokens', description: 'Extract design tokens from Figma' },
            { name: 'analyze_design_structure', description: 'Analyze design structure for insights' }
          ]
        };
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list tools'
        });
      }
    });

    this.app.post('/api/figma-mcp/file-structure', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { fileId } = req.body;
        
        if (!fileId) {
          return res.status(400).json({
            success: false,
            error: 'Figma file ID is required'
          });
        }

        // Use direct Figma service
        const { FigmaService } = await import('./services/figmaService');
        const figmaService = new FigmaService();
        
        const figmaFile = await figmaService.getFile(fileId);
        
        res.json({
          success: true,
          data: figmaFile
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get file structure'
        });
      }
    });

    this.app.post('/api/figma-mcp/node-details', authenticateToken, async (req: AuthenticatedRequest, res) => {
      try {
        const { fileId, nodeId } = req.body;
        
        if (!fileId || !nodeId) {
          return res.status(400).json({
            success: false,
            error: 'Both fileId and nodeId are required'
          });
        }

        // Use direct Figma service
        const { FigmaService } = await import('./services/figmaService');
        const figmaService = new FigmaService();
        
        const nodes = await figmaService.getFileNodes(fileId, [nodeId]);
        
        res.json({
          success: true,
          data: nodes[nodeId]
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get node details'
        });
      }
    });

    // 管理者専用エンドポイント例
    this.app.get('/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
      try {
        // 管理者のみがアクセス可能
        const users = await databaseService.getAllUsers(); // 実装が必要
        res.json({ success: true, data: users });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get users'
        });
      }
    });

    this.app.post('/admin/system-settings', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
      try {
        // 管理者のみがアクセス可能
        const { settings } = req.body;
        // システム設定の更新処理
        res.json({ success: true, message: 'Settings updated' });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update settings'
        });
      }
    });
  }

  async start() {
    try {
      validateConfig();
      
      // Initialize MCP Manager
      await mcpManager.initialize();
      console.log('MCP Manager initialized successfully');
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.app.listen(config.port, () => {
        console.log(`COMPASS MCP Server running on port ${config.port}`);
        console.log(`Health check: http://localhost:${config.port}/health`);
        console.log(`MCP endpoints available at: http://localhost:${config.port}/api/mcp/*`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const server = new CompassMCPServer();
  server.start().catch(console.error);
}

export default CompassMCPServer;
