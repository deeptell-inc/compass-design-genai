import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AnthropicService } from '../services/anthropicService';
import { databaseService } from '../services/databaseService';
import { BusinessMetrics } from '../types';

export class BusinessInsightsTool {
  private anthropicService: AnthropicService;

  constructor() {
    this.anthropicService = new AnthropicService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'generate_business_insights',
      description: 'Generate business insights and ROI recommendations',
      inputSchema: {
        type: 'object',
        properties: {
          businessMetrics: {
            type: 'object',
            description: 'Current business metrics and KPIs',
          },
          designChanges: {
            type: 'array',
            items: { type: 'object' },
            description: 'Proposed or implemented design changes',
          },
          timeframe: {
            type: 'string',
            description: 'Analysis timeframe (e.g., "30d", "90d", "1y")',
          },
        },
        required: ['businessMetrics'],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { businessMetrics, designChanges = [], timeframe = '30d' } = args;
      
      const recommendations = await this.anthropicService.generateBusinessRecommendations({
        metrics: businessMetrics,
        changes: designChanges,
        timeframe,
      });
      
      const roiCalculations = this.calculateROI(businessMetrics, designChanges);
      
      if (args.userId) {
        try {
          await databaseService.saveAISuggestion(
            args.userId,
            'business_insight',
            { businessMetrics, designChanges, timeframe },
            null,
            recommendations,
            'claude-3-sonnet'
          );
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      }
      
      return {
        success: true,
        data: {
          recommendations,
          roiCalculations,
          metrics: businessMetrics,
          timeframe,
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

  private calculateROI(metrics: BusinessMetrics, changes: any[]): any {
    const baselineRevenue = metrics.conversionRate * metrics.averageOrderValue * 1000;
    
    let projectedImprovements = {
      conversionRateIncrease: 0,
      averageOrderValueIncrease: 0,
      bounceRateDecrease: 0,
    };

    changes.forEach(change => {
      switch (change.type) {
        case 'cta_optimization':
          projectedImprovements.conversionRateIncrease += 0.15;
          break;
        case 'checkout_simplification':
          projectedImprovements.conversionRateIncrease += 0.25;
          break;
        case 'mobile_optimization':
          projectedImprovements.bounceRateDecrease += 0.20;
          break;
        case 'page_speed_improvement':
          projectedImprovements.conversionRateIncrease += 0.10;
          break;
      }
    });

    const projectedRevenue = (metrics.conversionRate * (1 + projectedImprovements.conversionRateIncrease)) *
                            (metrics.averageOrderValue * (1 + projectedImprovements.averageOrderValueIncrease)) * 1000;
    
    const revenueIncrease = projectedRevenue - baselineRevenue;
    const implementationCost = changes.length * 5000;
    const roi = ((revenueIncrease - implementationCost) / implementationCost) * 100;

    return {
      baselineRevenue,
      projectedRevenue,
      revenueIncrease,
      implementationCost,
      roi: Math.round(roi),
      paybackPeriod: Math.ceil(implementationCost / (revenueIncrease / 12)),
    };
  }
}
