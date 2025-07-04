const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async makeRequest(endpoint: string, data?: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: data ? 'POST' : 'GET',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userEmail');
          window.location.reload();
          throw new Error('Authentication required');
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async generateDesign(prompt: string, style: string = 'modern'): Promise<unknown> {
    return this.makeRequest('/execute/generate_design_from_text', {
      prompt,
      style,
      exportToFigma: false,
    });
  }

  async exportToFigma(designId: string, imageUrl: string, prompt: string): Promise<unknown> {
    return this.makeRequest('/execute/generate_design_from_text', {
      prompt,
      exportToFigma: true,
    });
  }

  async generateCodeWithAI(request: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest('/execute/generate_code', request);
  }

  async generateBrainstormResponse(message: string, modelId: string): Promise<unknown> {
    return this.makeRequest('/execute/generate_brainstorm_response', {
      message,
      modelId,
    });
  }

  // Figma MCP Client API methods
  async analyzeFigmaDesign(fileId: string, nodeIds?: string[]): Promise<unknown> {
    return this.makeRequest('/api/figma-mcp/analyze-design', {
      fileId,
      nodeIds,
    });
  }

  async extractFigmaInsights(fileId: string): Promise<unknown> {
    return this.makeRequest('/api/figma-mcp/extract-insights', {
      fileId,
    });
  }

  async getFigmaFileStructure(fileId: string): Promise<unknown> {
    return this.makeRequest('/api/figma-mcp/file-structure', {
      fileId,
    });
  }

  async getFigmaNodeDetails(fileId: string, nodeId: string): Promise<unknown> {
    return this.makeRequest('/api/figma-mcp/node-details', {
      fileId,
      nodeId,
    });
  }

  async listFigmaMCPTools(): Promise<unknown> {
    return this.makeRequest('/api/figma-mcp/tools');
  }

  // Enhanced brainstorm with Figma context
  async generateBrainstormWithFigma(
    message: string, 
    modelId: string, 
    figmaContext?: {
      fileId: string;
      insights?: any;
    }
  ): Promise<unknown> {
    return this.makeRequest('/execute/generate_brainstorm_response', {
      message,
      modelId,
      figmaContext,
    });
  }
}

export const apiService = new ApiService();
