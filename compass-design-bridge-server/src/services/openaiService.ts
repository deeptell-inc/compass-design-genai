import OpenAI from 'openai';
import { config } from '../config';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  async generateDesignFromText(prompt: string): Promise<string> {
    try {
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: `Create a modern UI/UX design for: ${prompt}. Make it clean, professional, and suitable for web/mobile applications.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data?.[0]?.url || '';
    } catch (error) {
      throw new Error(`Failed to generate design: ${error}`);
    }
  }

  async generateCodeWithGPT(request: any, figmaData: any): Promise<string> {
    const prompt = this.buildCodeGenerationPrompt(request, figmaData);
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
      });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to generate code: ${error}`);
    }
  }

  async generateBrainstormResponse(message: string, modelId: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful UX/UI design assistant. Provide creative and practical design advice in Japanese.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 1000,
      });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to generate brainstorm response: ${error}`);
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

Please generate clean, production-ready code.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: codePrompt,
          },
        ],
        max_tokens: 4000,
      });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to generate code from prompt: ${error}`);
    }
  }

  private buildCodeGenerationPrompt(request: any, figmaData: any): string {
    return `Generate ${request.framework} code for the following Figma design:
    
    Design Data: ${JSON.stringify(figmaData, null, 2)}
    
    Requirements:
    - Framework: ${request.framework}
    - Styling: ${request.styling}
    - Responsive: ${request.options.responsive}
    - Accessibility: ${request.options.accessibility}
    - TypeScript: ${request.options.typescript}
    
    Please generate clean, production-ready code that follows best practices.`;
  }
}
