// COMPASS Analytics SDK - User Behavior Data Collection
// Usage: Import and initialize in your web application

export interface CompassConfig {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  userId?: string;
  sessionTimeout?: number; // in minutes
  batchSize?: number;
  flushInterval?: number; // in milliseconds
  autoTrack?: {
    pageViews?: boolean;
    clicks?: boolean;
    scrollDepth?: boolean;
    formInteractions?: boolean;
    timeOnPage?: boolean;
  };
}

export interface CompassEvent {
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

export interface CompassUser {
  userId?: string;
  anonymousId: string;
  traits?: Record<string, any>;
  createdAt: number;
  lastSeenAt: number;
}

class CompassAnalytics {
  private config: CompassConfig;
  private sessionId: string;
  private anonymousId: string;
  private eventQueue: CompassEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionTimer?: NodeJS.Timeout;
  private isInitialized: boolean = false;
  private maxScrollDepth: number = 0;
  private pageLoadTime: number = 0;
  private user: CompassUser;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.user = {
      anonymousId: this.anonymousId,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };
  }

  // Initialize the SDK
  init(config: CompassConfig): void {
    this.config = {
      endpoint: 'http://localhost:3002',
      debug: false,
      sessionTimeout: 30,
      batchSize: 10,
      flushInterval: 5000,
      autoTrack: {
        pageViews: true,
        clicks: true,
        scrollDepth: true,
        formInteractions: true,
        timeOnPage: true,
      },
      ...config,
    };

    if (this.config.userId) {
      this.user.userId = this.config.userId;
    }

    this.isInitialized = true;
    this.pageLoadTime = Date.now();

    if (this.config.debug) {
      console.log('COMPASS Analytics initialized', this.config);
    }

    // Setup auto-tracking
    this.setupAutoTracking();

    // Setup flush timer
    this.setupFlushTimer();

    // Setup session timer
    this.setupSessionTimer();

    // Track initial page view
    if (this.config.autoTrack?.pageViews) {
      this.trackPageView();
    }
  }

  // Track custom events
  track(eventType: string, customData?: Record<string, any>, elementSelector?: string): void {
    if (!this.isInitialized) {
      console.warn('COMPASS Analytics not initialized');
      return;
    }

    const event = this.createEvent(eventType, customData, elementSelector);
    this.addToQueue(event);

    if (this.config.debug) {
      console.log('Event tracked:', event);
    }
  }

  // Track page views
  trackPageView(customData?: Record<string, any>): void {
    this.track('page_view', {
      ...customData,
      loadTime: Date.now() - this.pageLoadTime,
    });
  }

  // Track user identification
  identify(userId: string, traits?: Record<string, any>): void {
    this.user.userId = userId;
    this.user.traits = { ...this.user.traits, ...traits };
    this.user.lastSeenAt = Date.now();

    this.track('user_identify', {
      userId,
      traits,
    });

    if (this.config.debug) {
      console.log('User identified:', this.user);
    }
  }

  // Track clicks
  private trackClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const selector = this.getElementSelector(target);
    const text = target.innerText || target.textContent || '';

    this.track('click', {
      elementType: target.tagName.toLowerCase(),
      elementText: text.trim().substring(0, 100),
      clickX: event.clientX,
      clickY: event.clientY,
    }, selector);
  }

  // Track scroll depth
  private trackScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    const scrollDepthPercentage = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );

    if (scrollDepthPercentage > this.maxScrollDepth) {
      this.maxScrollDepth = scrollDepthPercentage;

      // Track at 25%, 50%, 75%, 100%
      if ([25, 50, 75, 100].includes(scrollDepthPercentage)) {
        this.track('scroll_depth', {
          scrollDepthPercentage,
          scrollX: window.pageXOffset,
          scrollY: scrollTop,
        });
      }
    }
  }

  // Track form interactions
  private trackFormInteraction(event: Event): void {
    const target = event.target as HTMLFormElement;
    const selector = this.getElementSelector(target);

    if (event.type === 'submit') {
      this.track('form_submit', {
        formAction: target.action,
        formMethod: target.method,
        formElementCount: target.elements.length,
      }, selector);
    } else if (event.type === 'focus') {
      this.track('form_focus', {
        fieldType: (target as HTMLInputElement).type,
        fieldName: (target as HTMLInputElement).name,
      }, selector);
    }
  }

  // Setup automatic event tracking
  private setupAutoTracking(): void {
    if (typeof window === 'undefined') return;

    // Click tracking
    if (this.config.autoTrack?.clicks) {
      document.addEventListener('click', (event) => this.trackClick(event), true);
    }

    // Scroll depth tracking
    if (this.config.autoTrack?.scrollDepth) {
      let scrollTimeout: NodeJS.Timeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => this.trackScrollDepth(), 100);
      });
    }

    // Form interaction tracking
    if (this.config.autoTrack?.formInteractions) {
      document.addEventListener('submit', (event) => this.trackFormInteraction(event), true);
      document.addEventListener('focus', (event) => {
        if ((event.target as HTMLElement).tagName === 'INPUT' || 
            (event.target as HTMLElement).tagName === 'TEXTAREA') {
          this.trackFormInteraction(event);
        }
      }, true);
    }

    // Page unload tracking
    if (this.config.autoTrack?.timeOnPage) {
      window.addEventListener('beforeunload', () => {
        this.track('page_unload', {
          timeOnPage: Date.now() - this.pageLoadTime,
          maxScrollDepth: this.maxScrollDepth,
        });
        this.flush(); // Force flush before page unload
      });
    }

    // Visibility change tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden');
      } else {
        this.track('page_visible');
      }
    });
  }

  // Create event object
  private createEvent(
    eventType: string,
    customData?: Record<string, any>,
    elementSelector?: string
  ): CompassEvent {
    return {
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.user.userId,
      anonymousId: this.anonymousId,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      elementSelector,
      customData,
      pageData: {
        title: document.title,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      },
      deviceData: {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
      scrollData: {
        scrollX: window.pageXOffset,
        scrollY: window.pageYOffset,
        scrollDepthPercentage: Math.round(
          ((window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight) * 100
        ),
        maxScrollDepth: this.maxScrollDepth,
      },
    };
  }

  // Add event to queue
  private addToQueue(event: CompassEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  // Flush events to server
  flush(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.sendEvents(events).catch((error) => {
      if (this.config.debug) {
        console.error('Failed to send events:', error);
      }
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    });
  }

  // Send events to server
  private async sendEvents(events: CompassEvent[]): Promise<void> {
    try {
      const response = await fetch(`${this.config.endpoint}/events/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          events,
          user: this.user,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (this.config.debug) {
        console.log(`Sent ${events.length} events to server`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Error sending events:', error);
      }
      throw error;
    }
  }

  // Setup flush timer
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 5000);
  }

  // Setup session timer
  private setupSessionTimer(): void {
    const sessionTimeout = (this.config.sessionTimeout || 30) * 60 * 1000;
    
    this.sessionTimer = setInterval(() => {
      this.renewSession();
    }, sessionTimeout);
  }

  // Renew session
  private renewSession(): void {
    this.sessionId = this.generateSessionId();
    this.maxScrollDepth = 0;
    this.pageLoadTime = Date.now();

    if (this.config.debug) {
      console.log('Session renewed:', this.sessionId);
    }
  }

  // Generate session ID
  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get or create anonymous ID
  private getOrCreateAnonymousId(): string {
    const key = 'compass_anonymous_id';
    let id = localStorage.getItem(key);
    
    if (!id) {
      id = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, id);
    }
    
    return id;
  }

  // Get element selector
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(Boolean);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    // Fallback to tag name with nth-child
    const siblings = Array.from(element.parentNode?.children || []);
    const index = siblings.indexOf(element) + 1;
    return `${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  // Cleanup on destroy
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    // Final flush
    this.flush();

    this.isInitialized = false;
  }

  // Get current user data
  getUser(): CompassUser {
    return { ...this.user };
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Get queue length (for debugging)
  getQueueLength(): number {
    return this.eventQueue.length;
  }
}

// Create singleton instance
const compass = new CompassAnalytics();

// Export singleton and types
export default compass;
export { CompassAnalytics };

// Global type declarations for browser
declare global {
  interface Window {
    compass: CompassAnalytics;
  }
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.compass = compass;
}