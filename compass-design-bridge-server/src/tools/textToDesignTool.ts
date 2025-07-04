import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OpenAIService } from '../services/openaiService';
import { FigmaService } from '../services/figmaService';
import { databaseService } from '../services/databaseService';

export class TextToDesignTool {
  private openaiService: OpenAIService;
  private figmaService: FigmaService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.figmaService = new FigmaService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'generate_design_from_text',
      description: 'Generate design images from text descriptions using AI',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Text description of the design to generate',
          },
          style: {
            type: 'string',
            enum: ['modern', 'minimal', 'corporate', 'creative'],
            description: 'Design style preference',
          },
          exportToFigma: {
            type: 'boolean',
            description: 'Whether to export the generated design to Figma',
          },
        },
        required: ['prompt'],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { prompt, style = 'modern', exportToFigma = false } = args;
      
      const enhancedPrompt = `${prompt}. Style: ${style}`;
      const imageUrl = await this.openaiService.generateDesignFromText(enhancedPrompt);
      
      let figmaUrl = null;
      if (exportToFigma && imageUrl) {
        figmaUrl = await this.figmaService.importImageToFigma(imageUrl, prompt);
      }
      
      if (args.userId) {
        try {
          await databaseService.saveGeneratedArtifact(
            args.userId,
            null,
            null,
            'design_image',
            null,
            imageUrl,
            enhancedPrompt
          );
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      }
      
      return {
        success: true,
        data: {
          imageUrl,
          figmaUrl,
          prompt: enhancedPrompt,
          style,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
