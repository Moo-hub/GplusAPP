import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Analytics, __setAnalyticsEnvForTest, __resetAnalyticsForTest } from '../analyticsService';

describe('Analytics Service', () => {
  // Store the original environment variables
  const originalConsole = { ...console };
  const originalNavigator = { ...navigator };

  beforeEach(() => {
    // Reset console.log mock
    console.log = vi.fn();
    console.error = vi.fn();
    
    // Mock sendBeacon
    navigator.sendBeacon = vi.fn().mockReturnValue(true);

    // Mock random for session ID predictability
    Math.random = vi.fn().mockReturnValue(0.123456789);
    Date.now = vi.fn().mockReturnValue(1600000000000);
    
    // Set a predictable date for timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    
    // Use test env hook for environment
    __setAnalyticsEnvForTest('development', 'https://api.example.com', '1.0.0');
    
    // Mock window screen properties
    Object.defineProperty(window.screen, 'width', { value: 1920 });
    Object.defineProperty(window.screen, 'height', { value: 1080 });
    
    // Mock navigator userAgent
    Object.defineProperty(navigator, 'userAgent', { 
      value: 'Mozilla/5.0 Test UserAgent',
      configurable: true
    });
  });

  afterEach(() => {
    // Restore original environment
  __resetAnalyticsForTest();
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    Object.defineProperty(navigator, 'userAgent', { 
      value: originalNavigator.userAgent,
      configurable: true
    });
    vi.useRealTimers();
    __resetAnalyticsForTest();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
  __setAnalyticsEnvForTest('development', 'https://api.example.com', '1.0.0');
    });

    it('logs page_view events to console in development', () => {
      // Execute
      Analytics.pageView('HomePage', '/home');
      
      // Verify
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        expect.objectContaining({
          eventType: 'page_view',
          pageName: 'HomePage',
          path: '/home',
          sessionId: expect.stringContaining('session_'),
          userAgent: 'Mozilla/5.0 Test UserAgent',
          screenSize: '1920x1080',
          timestamp: expect.any(String)
        })
      );
      expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });

    it('logs user_action events to console in development', () => {
      // Execute
      Analytics.trackEvent('Button', 'Click', 'Submit Form', 1);
      
      // Verify
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        expect.objectContaining({
          eventType: 'user_action',
          category: 'Button',
          action: 'Click',
          label: 'Submit Form',
          value: 1,
          sessionId: expect.stringContaining('session_'),
          userAgent: 'Mozilla/5.0 Test UserAgent',
          screenSize: '1920x1080',
          timestamp: expect.any(String)
        })
      );
    });

    it('logs error events to console in development', () => {
      // Execute
      Analytics.trackError('API Connection Failed', 'NetworkService', true);
      
      // Verify
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        expect.objectContaining({
          eventType: 'error',
          errorMessage: 'API Connection Failed',
          errorSource: 'NetworkService',
          isFatal: true,
          sessionId: expect.stringContaining('session_'),
          userAgent: 'Mozilla/5.0 Test UserAgent',
          screenSize: '1920x1080',
          timestamp: expect.any(String)
        })
      );
    });

    it('logs performance events to console in development', () => {
      // Execute
      Analytics.trackPerformance('pageLoadTime', 1200);
      
      // Verify
      expect(console.log).toHaveBeenCalledWith(
        'Analytics Event:',
        expect.objectContaining({
          eventType: 'performance',
          metric: 'pageLoadTime',
          value: 1200,
          sessionId: expect.stringContaining('session_'),
          userAgent: 'Mozilla/5.0 Test UserAgent',
          screenSize: '1920x1080',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
  __setAnalyticsEnvForTest('production', 'https://api.example.com', '1.2.3');
    });

    it('sends page_view events to server in production', () => {
      // Execute
      Analytics.pageView('HomePage', '/home');
      
      // Verify
      expect(vi.mocked(navigator.sendBeacon)).toHaveBeenCalledWith(
        'https://api.example.com/analytics/events',
        expect.any(String)
      );
      // Verify the payload - تحسين التعامل مع البيانات
      const beaconData = vi.mocked(navigator.sendBeacon).mock.calls[0][1];
      // نفترض أن البيانات هي سلسلة نصية في بيئة الاختبار
      const payload = typeof beaconData === 'string' 
        ? JSON.parse(beaconData)
        : beaconData;
      
      expect(payload).toEqual(expect.objectContaining({
        eventType: 'page_view',
        pageName: 'HomePage',
        path: '/home',
        sessionId: expect.stringContaining('session_'),
        userAgent: 'Mozilla/5.0 Test UserAgent',
        screenSize: '1920x1080',
        timestamp: expect.any(String),
        appVersion: '1.2.3'
      }));
      
      expect(console.log).not.toHaveBeenCalled();
    });

    it('handles errors when sending analytics in production', () => {
      // Setup - make sendBeacon throw an error
      navigator.sendBeacon = vi.fn().mockImplementation(() => {
        throw new Error('Network error');
      });
      
      // Execute
      Analytics.pageView('ErrorPage', '/error');
      
      // Verify
      expect(console.error).toHaveBeenCalledWith(
        'Analytics error:',
        expect.any(Error)
      );
    });

    it('sends user_action events to server in production', () => {
      // Execute
      Analytics.trackEvent('Form', 'Submit', 'Contact Form');
      
      // Verify
      expect(vi.mocked(navigator.sendBeacon)).toHaveBeenCalledWith(
        'https://api.example.com/analytics/events',
        expect.any(String)
      );
      // Verify the payload - تحسين التعامل مع البيانات
      const beaconData = vi.mocked(navigator.sendBeacon).mock.calls[0][1];
      // نفترض أن البيانات هي سلسلة نصية في بيئة الاختبار
      const payload = typeof beaconData === 'string' 
        ? JSON.parse(beaconData)
        : beaconData;
      
      expect(payload).toEqual(expect.objectContaining({
        eventType: 'user_action',
        category: 'Form',
        action: 'Submit',
        label: 'Contact Form',
        value: null
      }));
    });
  });
});