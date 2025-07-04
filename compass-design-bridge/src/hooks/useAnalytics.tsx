import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';

interface Trend {
  value: number;
  isPositive: boolean;
}

interface StatValue {
  value: number;
  trend: Trend;
}

interface AnalyticsData {
  designsProcessed: StatValue;
  codeGenerationRequests: StatValue;
  designTokensExtracted: StatValue;
  averageCodeQualityScore: StatValue;
}

interface ActivityData {
  date: string;
  designs: number;
  code_requests: number;
  tokens: number;
}

interface AnalyticsContextType {
  stats: AnalyticsData | null;
  activityData: ActivityData[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  recordDesignProcessed: (designData: {
    design_name: string;
    figma_file_id?: string;
    processing_time?: number;
  }) => Promise<void>;
  recordCodeGeneration: (codeData: {
    design_id?: number;
    framework: string;
    quality_score?: number;
  }) => Promise<void>;
  recordDesignToken: (tokenData: {
    design_id?: number;
    token_type: string;
    token_name: string;
    token_value: string;
  }) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Safe environment variable access for Vite
const getApiUrl = () => {
  try {
    return import.meta.env?.VITE_API_URL || 'http://localhost:3002';
  } catch {
    return 'http://localhost:3002';
  }
};

const API_BASE_URL = getApiUrl();

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    // Always use mock data for now to prevent fetch errors
    const mockStats: AnalyticsData = {
      designsProcessed: {
        value: 42,
        trend: { value: 12, isPositive: true }
      },
      codeGenerationRequests: {
        value: 156,
        trend: { value: 24, isPositive: true }
      },
      designTokensExtracted: {
        value: 327,
        trend: { value: 8, isPositive: true }
      },
      averageCodeQualityScore: {
        value: 8.7,
        trend: { value: 3, isPositive: true }
      }
    };
    
    // Simulate API delay
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);

    // Uncomment below to enable real API calls when server is ready
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching analytics stats:', err);
      setStats(mockStats);
      setError('API not available, using mock data');
    } finally {
      setLoading(false);
    }
    */
  };

  const fetchActivityData = async () => {
    // Use mock data for now to prevent fetch errors
    const mockActivityData: ActivityData[] = [
      { date: "05/10", designs: 6, code_requests: 18, tokens: 45 },
      { date: "05/11", designs: 8, code_requests: 22, tokens: 52 },
      { date: "05/12", designs: 12, code_requests: 28, tokens: 67 },
      { date: "05/13", designs: 7, code_requests: 19, tokens: 48 },
      { date: "05/14", designs: 15, code_requests: 35, tokens: 78 },
      { date: "05/15", designs: 9, code_requests: 24, tokens: 56 },
      { date: "05/16", designs: 11, code_requests: 27, tokens: 63 },
    ];
    
    setActivityData(mockActivityData);

    // Uncomment below to enable real API calls when server is ready
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/activity?days=7`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setActivityData(data);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setActivityData(mockActivityData);
    }
    */
  };

  const refreshStats = async () => {
    await Promise.all([fetchStats(), fetchActivityData()]);
  };

  const recordDesignProcessed = async (designData: {
    design_name: string;
    figma_file_id?: string;
    processing_time?: number;
  }) => {
    // For now, just log the action (API calls disabled to prevent errors)
    console.log('Design processed:', designData);
    
    // Simulate processing delay and refresh stats
    setTimeout(async () => {
      await refreshStats();
    }, 1000);

    // Uncomment below to enable real API calls when server is ready
    /*
    try {
      const payload = {
        ...designData,
        user_id: user?.email || 'anonymous'
      };

      const response = await fetch(`${API_BASE_URL}/api/analytics/designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await refreshStats();
    } catch (err) {
      console.error('Error recording design processed:', err);
    }
    */
  };

  const recordCodeGeneration = async (codeData: {
    design_id?: number;
    framework: string;
    quality_score?: number;
  }) => {
    // For now, just log the action (API calls disabled to prevent errors)
    console.log('Code generation recorded:', codeData);
    
    // Simulate processing delay and refresh stats
    setTimeout(async () => {
      await refreshStats();
    }, 1000);

    // Uncomment below to enable real API calls when server is ready
    /*
    try {
      const payload = {
        ...codeData,
        user_id: user?.email || 'anonymous'
      };

      const response = await fetch(`${API_BASE_URL}/api/analytics/code-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await refreshStats();
    } catch (err) {
      console.error('Error recording code generation:', err);
    }
    */
  };

  const recordDesignToken = async (tokenData: {
    design_id?: number;
    token_type: string;
    token_name: string;
    token_value: string;
  }) => {
    // For now, just log the action (API calls disabled to prevent errors)
    console.log('Design token recorded:', tokenData);
    
    // Simulate processing delay and refresh stats
    setTimeout(async () => {
      await refreshStats();
    }, 500);

    // Uncomment below to enable real API calls when server is ready
    /*
    try {
      const payload = {
        ...tokenData,
        user_id: user?.email || 'anonymous'
      };

      const response = await fetch(`${API_BASE_URL}/api/analytics/design-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await refreshStats();
    } catch (err) {
      console.error('Error recording design token:', err);
    }
    */
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const contextValue: AnalyticsContextType = {
    stats,
    activityData,
    loading,
    error,
    refreshStats,
    recordDesignProcessed,
    recordCodeGeneration,
    recordDesignToken,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}