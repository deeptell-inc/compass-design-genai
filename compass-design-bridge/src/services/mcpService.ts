import { abTestResults, businessMetrics, uxResearchInsights } from './mockData';

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MCPService {
  private baseUrl = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3002';
  private username = import.meta.env.VITE_MCP_USERNAME || 'deeptell_compass';
  private password = import.meta.env.VITE_MCP_PASSWORD || 'n8ZiGx4w';

  private async makeRequest(endpoint: string, data?: any): Promise<MCPResponse> {
    // For development, prioritize mock data
    if (import.meta.env.DEV || this.baseUrl.includes('localhost')) {
      console.log('Using mock data for development:', endpoint);
      return this.getMockResponse(endpoint, data);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('MCP Service unavailable, using mock data:', error);
      return this.getMockResponse(endpoint, data);
    }
  }

  private getMockResponse(endpoint: string, data?: any): MCPResponse {
    switch (endpoint) {
      case '/execute/fetch_figma_design':
        return {
          success: true,
          data: {
            file: { name: 'Mock Design File', lastModified: new Date().toISOString() },
            designTokens: [
              { name: 'primary-color', value: '#6366f1', type: 'color', category: 'colors' },
              { name: 'secondary-color', value: '#8b5cf6', type: 'color', category: 'colors' },
              { name: 'text-primary', value: '#1f2937', type: 'color', category: 'typography' },
            ],
          },
        };
      case '/execute/generate_code':
        return {
          success: true,
          data: {
            code: `// Generated ${data?.framework || 'React'} component\nconst Component = () => {\n  return <div>Generated component</div>;\n};`,
            framework: data?.framework || 'react',
          },
        };
      case '/execute/generate_ai_insights':
        return {
          success: true,
          data: {
            insights: [
              {
                id: '1',
                title: 'UX改善提案',
                description: 'ユーザビリティテストの結果に基づく改善提案',
                impact: 'high',
                category: 'ux',
                confidence: 0.85,
                recommendations: ['ナビゲーションの簡素化', 'CTAボタンの視認性向上'],
                dataSource: 'user_behavior',
              },
            ],
          },
        };
      case '/execute/generate_business_insights':
        return {
          success: true,
          data: {
            recommendations: 'ROI向上のための戦略的提案',
            roiCalculations: {
              baselineRevenue: 290700,
              projectedRevenue: 334305,
              revenueIncrease: 43605,
              implementationCost: 15000,
              roi: 191,
              paybackPeriod: 4,
            },
          },
        };
      default:
        return { success: false, error: 'Unknown endpoint' };
    }
  }

  async fetchFigmaDesign(fileKey: string, nodeIds?: string[]): Promise<MCPResponse> {
    return this.makeRequest('/execute/fetch_figma_design', { fileKey, nodeIds });
  }

  async generateCode(params: {
    figmaFileKey: string;
    figmaNodeId: string;
    framework: string;
    styling: string;
    options?: any;
  }): Promise<MCPResponse> {
    return this.makeRequest('/execute/generate_code', params);
  }

  async generateAIInsights(params: {
    designData: any;
    userBehaviorData?: any;
    includeExternalData?: boolean;
  }): Promise<MCPResponse> {
    return this.makeRequest('/execute/generate_ai_insights', params);
  }

  async generateBusinessInsights(params: {
    businessMetrics: any;
    designChanges?: any[];
    timeframe?: string;
  }): Promise<MCPResponse> {
    return this.makeRequest('/execute/generate_business_insights', params);
  }

  async fetchABTestData(): Promise<MCPResponse> {
    return { success: true, data: abTestResults };
  }

  async fetchUXResearchData(): Promise<MCPResponse> {
    return { success: true, data: uxResearchInsights };
  }

  async fetchBusinessMetrics(): Promise<MCPResponse> {
    return { success: true, data: businessMetrics };
  }
}

export const mcpService = new MCPService();
