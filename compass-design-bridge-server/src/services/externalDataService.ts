import axios from 'axios';
import { config } from '../config';
import { ABTestResult } from '../types';

export class ExternalDataService {
  async fetchABTestData(): Promise<ABTestResult[]> {
    try {
      const response = await axios.get('https://abtest.design/api/tests', {
        headers: {
          'Authorization': `Bearer ${config.abtestDesignApiKey}`,
        },
      });
      
      return response.data.map((test: any) => ({
        id: test.id,
        name: test.name,
        variants: test.variants || [],
        status: test.status || 'running',
        significance: test.significance || 0,
        winner: test.winner,
      }));
    } catch (error) {
      return this.getMockABTestData();
    }
  }

  async fetchUXResearchData(): Promise<any[]> {
    try {
      const response = await axios.get('https://www.nngroup.com/api/articles', {
        headers: {
          'Authorization': `Bearer ${config.nnGroupApiKey}`,
        },
      });
      
      return response.data;
    } catch (error) {
      return this.getMockUXResearchData();
    }
  }

  private getMockABTestData(): ABTestResult[] {
    return [
      {
        id: '1',
        name: 'Homepage CTA Button Test',
        variants: [
          { name: 'Control', conversionRate: 3.2, visitors: 1000, conversions: 32 },
          { name: 'Variant A', conversionRate: 4.1, visitors: 1000, conversions: 41 },
        ],
        status: 'completed',
        significance: 0.95,
        winner: 'Variant A',
      },
      {
        id: '2',
        name: 'Product Page Layout Test',
        variants: [
          { name: 'Control', conversionRate: 2.8, visitors: 800, conversions: 22 },
          { name: 'Variant B', conversionRate: 3.5, visitors: 800, conversions: 28 },
        ],
        status: 'running',
        significance: 0.87,
      },
    ];
  }

  private getMockUXResearchData(): any[] {
    return [
      {
        id: '1',
        title: 'Mobile UX Best Practices',
        summary: 'Key principles for mobile user experience design',
        category: 'mobile',
        insights: ['Touch target size should be at least 44px', 'Minimize form fields'],
      },
      {
        id: '2',
        title: 'Conversion Rate Optimization',
        summary: 'Proven techniques to improve conversion rates',
        category: 'conversion',
        insights: ['Clear value proposition', 'Reduce friction in checkout'],
      },
    ];
  }
}
