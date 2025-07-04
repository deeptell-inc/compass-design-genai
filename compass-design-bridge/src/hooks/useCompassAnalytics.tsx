import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Types for the analytics SDK
interface CompassConfig {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  userId?: string;
  sessionTimeout?: number;
  batchSize?: number;
  flushInterval?: number;
  autoTrack?: {
    pageViews?: boolean;
    clicks?: boolean;
    scrollDepth?: boolean;
    formInteractions?: boolean;
    timeOnPage?: boolean;
  };
}

interface CompassEvent {
  eventType: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  anonymousId: string;
  url: string;
  referrer?: string;
  userAgent: string;
  elementSelector?: string;
  elementText?: string;
  customData?: Record<string, any>;
  pageData?: {
    title: string;
    path: string;
    search: string;
    hash: string;
  };
  deviceData?: {
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
  };
  scrollData?: {
    scrollX: number;
    scrollY: number;
    scrollDepthPercentage: number;
    maxScrollDepth: number;
  };
}

// Mock CompassAnalytics class for development
class MockCompassAnalytics {
  private config?: CompassConfig;
  private isInitialized = false;

  init(config: CompassConfig): void {
    this.config = config;
    this.isInitialized = true;
    if (config.debug) {
      console.log('Mock COMPASS Analytics initialized', config);
    }
  }

  track(eventType: string, customData?: Record<string, any>, elementSelector?: string): void {
    if (!this.isInitialized) return;
    
    const event = {
      eventType,
      timestamp: Date.now(),
      sessionId: 'mock_session',
      anonymousId: 'mock_anon',
      url: window.location.href,
      customData,
      elementSelector,
    };

    if (this.config?.debug) {
      console.log('Mock event tracked:', event);
    }

    // Send to our backend
    this.sendToBackend(event);
  }

  trackPageView(customData?: Record<string, any>): void {
    this.track('page_view', customData);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.track('user_identify', { userId, traits });
    if (this.config?.debug) {
      console.log('Mock user identified:', userId, traits);
    }
  }

  getUser() {
    return {
      anonymousId: 'mock_anon',
      userId: undefined,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };
  }

  getSessionId(): string {
    return 'mock_session';
  }

  getQueueLength(): number {
    return 0;
  }

  destroy(): void {
    this.isInitialized = false;
  }

  private async sendToBackend(event: Partial<CompassEvent>): Promise<void> {
    try {
      const fullEvent = {
        userId: event.userId || null,
        anonymousId: event.anonymousId || 'anonymous',
        sessionId: event.sessionId || 'session',
        eventType: event.eventType || 'unknown',
        url: event.url || window.location.href,
        elementSelector: event.elementSelector || null,
        payload: event.customData || {},
        eventTimestamp: event.timestamp || Date.now(),
      };

      await fetch('http://localhost:3002/events/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEvent),
      });
    } catch (error) {
      if (this.config?.debug) {
        console.error('Failed to send event to backend:', error);
      }
    }
  }
}

// Create mock instance
const mockCompass = new MockCompassAnalytics();

export interface UseCompassAnalyticsOptions {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  autoTrackPageViews?: boolean;
  userId?: string;
}

export interface UseCompassAnalyticsReturn {
  track: (eventType: string, data?: Record<string, any>) => void;
  trackPageView: (data?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  trackClick: (elementName: string, data?: Record<string, any>) => void;
  trackFormSubmit: (formName: string, data?: Record<string, any>) => void;
  trackCustomEvent: (eventName: string, data?: Record<string, any>) => void;
  isInitialized: boolean;
  sessionId: string;
}

export const useCompassAnalytics = (
  options: UseCompassAnalyticsOptions
): UseCompassAnalyticsReturn => {
  const location = useLocation();
  const isInitializedRef = useRef(false);

  // Initialize analytics on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      const config: CompassConfig = {
        apiKey: options.apiKey,
        endpoint: options.endpoint || 'http://localhost:3002',
        debug: options.debug || false,
        userId: options.userId,
        autoTrack: {
          pageViews: false, // We'll handle this manually in React
          clicks: true,
          scrollDepth: true,
          formInteractions: true,
          timeOnPage: true,
        },
      };

      mockCompass.init(config);
      isInitializedRef.current = true;
    }
  }, [options]);

  // Track page views on route changes
  useEffect(() => {
    if (isInitializedRef.current && options.autoTrackPageViews !== false) {
      mockCompass.trackPageView({
        route: location.pathname,
        search: location.search,
        hash: location.hash,
      });
    }
  }, [location, options.autoTrackPageViews]);

  // Analytics methods
  const track = useCallback((eventType: string, data?: Record<string, any>) => {
    if (isInitializedRef.current) {
      mockCompass.track(eventType, data);
    }
  }, []);

  const trackPageView = useCallback((data?: Record<string, any>) => {
    if (isInitializedRef.current) {
      mockCompass.trackPageView(data);
    }
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    if (isInitializedRef.current) {
      mockCompass.identify(userId, traits);
    }
  }, []);

  const trackClick = useCallback((elementName: string, data?: Record<string, any>) => {
    track('click', {
      elementName,
      ...data,
    });
  }, [track]);

  const trackFormSubmit = useCallback((formName: string, data?: Record<string, any>) => {
    track('form_submit', {
      formName,
      ...data,
    });
  }, [track]);

  const trackCustomEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    track('custom_event', {
      eventName,
      ...data,
    });
  }, [track]);

  return {
    track,
    trackPageView,
    identify,
    trackClick,
    trackFormSubmit,
    trackCustomEvent,
    isInitialized: isInitializedRef.current,
    sessionId: mockCompass.getSessionId(),
  };
};

// Higher-order component for analytics
export interface WithAnalyticsProps {
  analytics: UseCompassAnalyticsReturn;
}

export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P & WithAnalyticsProps>
) => {
  return (props: P) => {
    const analytics = useCompassAnalytics({
      apiKey: 'dev-key', // TODO: Get from config
      debug: true,
    });

    return <Component {...props} analytics={analytics} />;
  };
};

// Analytics provider context
import React, { createContext, useContext } from 'react';

const AnalyticsContext = createContext<UseCompassAnalyticsReturn | null>(null);

export interface AnalyticsProviderProps {
  children: React.ReactNode;
  config: UseCompassAnalyticsOptions;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  config,
}) => {
  const analytics = useCompassAnalytics(config);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): UseCompassAnalyticsReturn => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Analytics event components
export interface TrackOnClickProps {
  eventType: string;
  data?: Record<string, any>;
  children: React.ReactElement;
}

export const TrackOnClick: React.FC<TrackOnClickProps> = ({
  eventType,
  data,
  children,
}) => {
  const { track } = useAnalytics();

  const handleClick = useCallback(() => {
    track(eventType, data);
  }, [track, eventType, data]);

  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      handleClick();
      if (children.props.onClick) {
        children.props.onClick(e);
      }
    },
  });
};

export interface TrackOnViewProps {
  eventType: string;
  data?: Record<string, any>;
  children: React.ReactNode;
  threshold?: number;
}

export const TrackOnView: React.FC<TrackOnViewProps> = ({
  eventType,
  data,
  children,
  threshold = 0.5,
}) => {
  const { track } = useAnalytics();
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedRef.current) {
          track(eventType, data);
          hasTrackedRef.current = true;
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [track, eventType, data, threshold]);

  return <div ref={elementRef}>{children}</div>;
};