// Frontend performance monitoring utility

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordPageLoad(navEntry);
          }
        });
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', entry);
          }
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  private recordPageLoad(navEntry: PerformanceNavigationTiming) {
    const metrics: PerformanceMetrics = {
      pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
      apiResponseTime: 0,
      renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
    };

    this.metrics.set(window.location.pathname, metrics);
    
    // Log slow page loads
    if (metrics.pageLoadTime > 3000) {
      console.warn(`Slow page load: ${window.location.pathname} - ${metrics.pageLoadTime}ms`);
    }
  }

  public recordApiCall(url: string, startTime: number, endTime: number) {
    const responseTime = endTime - startTime;
    
    // Log slow API calls
    if (responseTime > 1000) {
      console.warn(`Slow API call: ${url} - ${responseTime}ms`);
    }

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'api_call', {
        event_category: 'performance',
        event_label: url,
        value: responseTime
      });
    }
  }

  public recordRenderTime(componentName: string, renderTime: number) {
    if (renderTime > 100) {
      console.warn(`Slow render: ${componentName} - ${renderTime}ms`);
    }
  }

  public getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  public getAveragePageLoadTime(): number {
    const times = Array.from(this.metrics.values()).map(m => m.pageLoadTime);
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.recordRenderTime(componentName, renderTime);
  });
};

// API call wrapper
export const withPerformanceMonitoring = async <T>(
  apiCall: () => Promise<T>,
  url: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    performanceMonitor.recordApiCall(url, startTime, endTime);
    return result;
  } catch (error) {
    const endTime = performance.now();
    performanceMonitor.recordApiCall(url, startTime, endTime);
    throw error;
  }
};

export default PerformanceMonitor; 