import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { AIInsight, CodeGenerationRequest } from '../types';

export class AnthropicService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  async generateCode(request: CodeGenerationRequest, figmaData: any): Promise<string> {
    const prompt = this.buildCodeGenerationPrompt(request, figmaData);
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      throw new Error(`Failed to generate code: ${error}`);
    }
  }

  async generateAIInsights(designData: any, userBehaviorData: any): Promise<AIInsight[]> {
    const prompt = this.buildInsightsPrompt(designData, userBehaviorData);
    
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseInsightsResponse(content);
    } catch (error) {
      throw new Error(`Failed to generate AI insights: ${error}`);
    }
  }

  async generateBusinessRecommendations(metrics: any): Promise<string> {
    const prompt = `
    Based on the following business metrics and UX data, provide strategic recommendations:
    
    Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Please provide:
    1. Top 3 priority areas for improvement
    2. Expected ROI impact for each recommendation
    3. Implementation difficulty and timeline
    4. Success metrics to track
    
    Format as structured recommendations with clear action items.
    `;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      throw new Error(`Failed to generate business recommendations: ${error}`);
    }
  }

  async generateCodeFromPrompt(prompt: string, framework: string, styling: string): Promise<string> {
    try {
      const codePrompt = `Generate a ${framework} component based on this description: ${prompt}

Requirements:
- Framework: ${framework}
- Styling: ${styling}
- Make it responsive and accessible
- Follow best practices
- Include proper TypeScript types if applicable

Please generate clean, production-ready code that follows modern development standards.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: codePrompt,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      throw new Error(`Failed to generate code from prompt: ${error}`);
    }
  }

  private buildCodeGenerationPrompt(request: CodeGenerationRequest, figmaData: any): string {
    return `
    Generate ${request.framework} code for the following Figma design:
    
    Design Data: ${JSON.stringify(figmaData, null, 2)}
    
    Requirements:
    - Framework: ${request.framework}
    - Styling: ${request.styling}
    - Responsive: ${request.options.responsive}
    - Accessibility: ${request.options.accessibility}
    - TypeScript: ${request.options.typescript}
    
    Please generate clean, production-ready code that follows best practices.
    Include proper component structure, styling, and accessibility features.
    `;
  }

  private buildInsightsPrompt(designData: any, userBehaviorData: any): string {
    return `
    Analyze the following design and user behavior data to generate UX insights:
    
    Design Data: ${JSON.stringify(designData, null, 2)}
    User Behavior: ${JSON.stringify(userBehaviorData, null, 2)}
    
    Please provide insights in the following JSON format:
    [
      {
        "id": "unique_id",
        "title": "Insight Title",
        "description": "Detailed description",
        "impact": "high|medium|low",
        "category": "conversion|ux|ui|engagement|accessibility",
        "confidence": 0.85,
        "recommendations": ["recommendation1", "recommendation2"],
        "dataSource": "user_behavior|design_analysis|best_practices"
      }
    ]
    
    Focus on actionable insights that can improve user experience and business metrics.
    `;
  }

  private parseInsightsResponse(content: string): AIInsight[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [{
        id: Date.now().toString(),
        title: 'AI Analysis Complete',
        description: content.substring(0, 200) + '...',
        impact: 'medium',
        category: 'ux',
        confidence: 0.7,
        recommendations: ['Review the full analysis for detailed recommendations'],
        dataSource: 'ai_analysis',
      }];
    } catch (error) {
      return [{
        id: Date.now().toString(),
        title: 'Analysis Error',
        description: 'Failed to parse AI insights response',
        impact: 'low',
        category: 'ui',
        confidence: 0.5,
        recommendations: ['Check AI service configuration'],
        dataSource: 'error',
      }];
    }
  }
}
