import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OpenAIService } from '../services/openaiService';
import { databaseService } from '../services/databaseService';

export class BrainstormTool {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'generate_brainstorm_response',
      description: 'Generate brainstorming responses using AI',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'User message for brainstorming',
          },
          prompt: {
            type: 'string',
            description: 'User prompt for brainstorming',
          },
          context: {
            type: 'string',
            description: 'Additional context for brainstorming',
          },
          figmaContext: {
            type: 'object',
            description: 'Figma design context with insights',
            properties: {
              fileId: { type: 'string' },
              url: { type: 'string' },
              insights: { type: 'object' }
            }
          },
          modelId: {
            type: 'string',
            description: 'AI model to use for response generation',
            default: 'gpt-4o',
          },
        },
        required: [],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { message, prompt, context = '', figmaContext, modelId = 'gpt-4o' } = args;
      const finalMessage = message || prompt || '';
      
      let fullMessage = context ? `${finalMessage}\n\nContext: ${context}` : finalMessage;
      
      // Add Figma context if available
      if (figmaContext && figmaContext.insights) {
        const insights = figmaContext.insights;
        let figmaInfo = '\n\n--- Figma Design Context ---\n';
        
        if (insights.colors && insights.colors.length > 0) {
          figmaInfo += `Colors: ${insights.colors.slice(0, 5).join(', ')}\n`;
        }
        
        if (insights.typography && insights.typography.length > 0) {
          figmaInfo += `Typography: ${insights.typography.slice(0, 3).join(', ')}\n`;
        }
        
        if (insights.components && insights.components.length > 0) {
          figmaInfo += `Components: ${insights.components.slice(0, 5).join(', ')}\n`;
        }
        
        if (insights.suggestions && insights.suggestions.length > 0) {
          figmaInfo += `Design Analysis: ${insights.suggestions.join(', ')}\n`;
        }
        
        figmaInfo += '\nPlease consider this design context when providing brainstorming suggestions.\n';
        fullMessage += figmaInfo;
      }
      
      const response = await this.openaiService.generateBrainstormResponse(fullMessage, modelId);
      
      if (args.userId) {
        try {
          await databaseService.saveAISuggestion(
            args.userId,
            'brainstorm_response',
            { modelId, context },
            finalMessage,
            response,
            modelId
          );
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      }
      
      return {
        success: true,
        data: {
          response,
          modelId,
          message: finalMessage,
          context,
          figmaContext: figmaContext || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate brainstorm response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
