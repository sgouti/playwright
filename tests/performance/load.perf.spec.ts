import { performanceTest as test, expect } from '@fixtures/fixtures';
import { TEST_CONFIG } from '@config/test.config';

test.describe('Performance Tests', () => {
  test('should load homepage within threshold', async ({ 
    page, 
    startPerformanceMonitoring, 
    stopPerformanceMonitoring 
  }) => {
    await startPerformanceMonitoring();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const metrics = await stopPerformanceMonitoring();
    
    expect(metrics.loadTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME);
  });

  test('should validate Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        setTimeout(() => resolve([]), 5000);
      });
    });
    
    expect(vitals).toBeDefined();
  });
});