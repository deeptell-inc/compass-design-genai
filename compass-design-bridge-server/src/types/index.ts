export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  constraints?: any;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };
}

export interface FigmaFile {
  document: FigmaNode;
  components?: Record<string, any>;
  styles?: Record<string, any>;
  name: string;
  lastModified: string;
  version: string;
  thumbnailUrl?: string;
}

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'typography' | 'spacing' | 'border' | 'shadow';
  category: string;
}

export interface CodeGenerationRequest {
  figmaNodeId: string;
  framework: 'react' | 'vue' | 'angular' | 'html';
  styling: 'tailwind' | 'css' | 'styled-components';
  options: {
    responsive: boolean;
    accessibility: boolean;
    typescript: boolean;
  };
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'conversion' | 'ux' | 'ui' | 'engagement' | 'accessibility';
  confidence: number;
  recommendations: string[];
  dataSource: string;
}

export interface ABTestResult {
  id: string;
  name: string;
  variants: {
    name: string;
    conversionRate: number;
    visitors: number;
    conversions: number;
  }[];
  status: 'running' | 'completed' | 'paused';
  significance: number;
  winner?: string;
}

export interface UserBehaviorData {
  sessionId: string;
  userId?: string;
  events: {
    type: 'click' | 'scroll' | 'hover' | 'form_interaction';
    element: string;
    timestamp: number;
    metadata: Record<string, any>;
  }[];
  pageViews: {
    url: string;
    timestamp: number;
    duration: number;
  }[];
}

export interface BusinessMetrics {
  conversionRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  bounceRate: number;
  pageLoadTime: number;
  userSatisfactionScore: number;
}
