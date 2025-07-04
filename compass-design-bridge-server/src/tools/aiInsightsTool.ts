import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AnthropicService } from '../services/anthropicService';
import { ExternalDataService } from '../services/externalDataService';
import { databaseService } from '../services/databaseService';

export class AIInsightsTool {
  private anthropicService: AnthropicService;
  private externalDataService: ExternalDataService;

  constructor() {
    this.anthropicService = new AnthropicService();
    this.externalDataService = new ExternalDataService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'generate_ai_insights',
      description: 'Generate AI-powered UX insights and recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          designData: {
            type: 'object',
            description: 'Design data from Figma or other sources',
          },
          userBehaviorData: {
            type: 'object',
            description: 'User behavior and analytics data',
          },
          includeExternalData: {
            type: 'boolean',
            description: 'Include external research data from NN Group and A/B test results',
          },
        },
        required: ['designData'],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { designData, userBehaviorData = {}, includeExternalData = false } = args;
      
      let externalData = {};
      if (includeExternalData) {
        const [abTestData, uxResearchData] = await Promise.all([
          this.externalDataService.fetchABTestData(),
          this.externalDataService.fetchUXResearchData(),
        ]);
        
        externalData = {
          abTestResults: abTestData,
          uxResearch: uxResearchData,
        };
      }

      const insights = await this.anthropicService.generateAIInsights(
        designData,
        { ...userBehaviorData, ...externalData }
      );
      
      if (args.userId) {
        try {
          for (const insight of insights) {
            await databaseService.saveAISuggestion(
              args.userId,
              'ai_insight',
              { designData, userBehaviorData, externalDataIncluded: includeExternalData },
              null,
              JSON.stringify(insight),
              'claude-3-sonnet'
            );
          }
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      }
      
      return {
        success: true,
        data: {
          insights,
          externalDataIncluded: includeExternalData,
          timestamp: new Date().toISOString(),
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
