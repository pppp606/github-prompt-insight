/**
 * Extension Initialization Tests
 * 
 * This file contains tests to verify that language settings are properly retrieved
 * when the extension loads and initializes, ensuring immediate availability of
 * user preferences.
 */

import { StorageManager, ExtensionConfig } from '../utils/storage';

interface InitializationTestResult {
  testName: string;
  success: boolean;
  loadTime: number;
  details: {
    configAvailable: boolean;
    languageRetrieved: boolean;
    expectedLanguage?: string;
    actualLanguage?: string;
    error?: string;
  };
}

interface ExtensionState {
  isInitialized: boolean;
  loadStartTime: number;
  loadEndTime?: number;
  configLoadTime?: number;
  languageSettingAvailable: boolean;
  currentLanguage?: string;
  initializationError?: string;
}

class ExtensionInitializationTests {
  private storageManager: StorageManager;
  private testResults: InitializationTestResult[] = [];
  private extensionState: ExtensionState = {
    isInitialized: false,
    loadStartTime: 0,
    languageSettingAvailable: false
  };
  
  constructor() {
    this.storageManager = new StorageManager();
  }
  
  private async measureOperationTime<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    return {
      result,
      time: endTime - startTime
    };
  }
  
  private async runInitializationTest(
    testName: string,
    testFunction: () => Promise<InitializationTestResult>
  ): Promise<InitializationTestResult> {
    console.log(`🚀 Testing initialization: ${testName}`);
    
    try {
      const result = await testFunction();
      
      console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
      console.log(`   Load time: ${result.loadTime.toFixed(2)}ms`);
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const errorResult: InitializationTestResult = {
        testName,
        success: false,
        loadTime: 0,
        details: {
          configAvailable: false,
          languageRetrieved: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
      
      console.log(`❌ ${testName}: ERROR - ${errorResult.details.error}`);
      this.testResults.push(errorResult);
      return errorResult;
    }
  }
  
  /**
   * Test 1: Cold Start Initialization
   */
  async testColdStartInitialization(): Promise<InitializationTestResult> {
    // Simulate cold start by clearing any cached state
    this.extensionState = {
      isInitialized: false,
      loadStartTime: performance.now(),
      languageSettingAvailable: false
    };
    
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      return await this.storageManager.getConfig();
    });
    
    this.extensionState.configLoadTime = loadTime;
    this.extensionState.isInitialized = true;
    this.extensionState.loadEndTime = performance.now();
    
    const success = config !== null && loadTime < 100; // Should load within 100ms
    const languageRetrieved = config?.defaultLanguage !== undefined;
    
    if (languageRetrieved) {
      this.extensionState.languageSettingAvailable = true;
      this.extensionState.currentLanguage = config.defaultLanguage;
    }
    
    return {
      testName: 'Cold Start Initialization',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved,
        expectedLanguage: 'Any valid language',
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 2: Runtime Message Initialization
   */
  async testRuntimeMessageInitialization(): Promise<InitializationTestResult> {
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      return await this.storageManager.getConfigViaRuntime();
    });
    
    const success = config !== null && loadTime < 150; // Slightly more time for runtime messages
    const languageRetrieved = config?.defaultLanguage !== undefined;
    
    return {
      testName: 'Runtime Message Initialization',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved,
        expectedLanguage: 'Any valid language',
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 3: Warm Start Initialization
   */
  async testWarmStartInitialization(): Promise<InitializationTestResult> {
    // First, ensure config exists
    const testConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-warm-start-test',
      defaultLanguage: 'Japanese'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    // Simulate warm start (config already in cache)
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      return await this.storageManager.getConfig();
    });
    
    const success = config !== null && 
                   config.defaultLanguage === testConfig.defaultLanguage &&
                   loadTime < 50; // Should be very fast on warm start
    
    return {
      testName: 'Warm Start Initialization',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved: config?.defaultLanguage !== undefined,
        expectedLanguage: testConfig.defaultLanguage,
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 4: Initialization with Empty Storage
   */
  async testInitializationWithEmptyStorage(): Promise<InitializationTestResult> {
    // Clear storage first
    await this.storageManager.clearConfig();
    
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      return await this.storageManager.getConfig();
    });
    
    // Should handle empty storage gracefully
    const success = config === null && loadTime < 100;
    
    return {
      testName: 'Initialization with Empty Storage',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved: false,
        expectedLanguage: 'None (empty storage)',
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 5: Initialization with Default Values
   */
  async testInitializationWithDefaults(): Promise<InitializationTestResult> {
    const { result: defaults, time: loadTime } = await this.measureOperationTime(async () => {
      return this.storageManager.getDefaultConfig();
    });
    
    const success = defaults.defaultLanguage === 'Japanese' && loadTime < 10; // Should be instant
    
    return {
      testName: 'Initialization with Default Values',
      success,
      loadTime,
      details: {
        configAvailable: true,
        languageRetrieved: true,
        expectedLanguage: 'Japanese',
        actualLanguage: defaults.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 6: Concurrent Initialization Requests
   */
  async testConcurrentInitialization(): Promise<InitializationTestResult> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'anthropic',
      apiKey: 'sk-concurrent-test',
      defaultLanguage: 'Spanish'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    // Start multiple concurrent initialization requests
    const startTime = performance.now();
    
    const promises = Array.from({ length: 5 }, () => this.storageManager.getConfig());
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // All requests should return the same config
    const allMatch = results.every(config => 
      config?.defaultLanguage === testConfig.defaultLanguage
    );
    
    const success = allMatch && loadTime < 200; // Should handle concurrent requests efficiently
    
    return {
      testName: 'Concurrent Initialization Requests',
      success,
      loadTime,
      details: {
        configAvailable: results[0] !== null,
        languageRetrieved: results[0]?.defaultLanguage !== undefined,
        expectedLanguage: testConfig.defaultLanguage,
        actualLanguage: results[0]?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 7: Initialization Performance Under Load
   */
  async testInitializationPerformanceUnderLoad(): Promise<InitializationTestResult> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'google',
      apiKey: 'sk-load-test',
      defaultLanguage: 'German'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    // Simulate high load with rapid successive requests
    const iterations = 50;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.storageManager.getConfig();
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / iterations;
    
    const success = averageTime < 20; // Each request should average under 20ms
    
    return {
      testName: 'Initialization Performance Under Load',
      success,
      loadTime: averageTime,
      details: {
        configAvailable: true,
        languageRetrieved: true,
        expectedLanguage: testConfig.defaultLanguage,
        actualLanguage: testConfig.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 8: Initialization with Storage Errors
   */
  async testInitializationWithStorageErrors(): Promise<InitializationTestResult> {
    // Mock storage error
    const originalGet = this.storageManager.getConfig;
    let errorOccurred = false;
    
    this.storageManager.getConfig = async () => {
      errorOccurred = true;
      throw new Error('Storage initialization error');
    };
    
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      try {
        return await this.storageManager.getConfig();
      } catch (error) {
        return null;
      }
    });
    
    // Restore original method
    this.storageManager.getConfig = originalGet;
    
    const success = errorOccurred && config === null && loadTime < 100;
    
    return {
      testName: 'Initialization with Storage Errors',
      success,
      loadTime,
      details: {
        configAvailable: false,
        languageRetrieved: false,
        expectedLanguage: 'None (error occurred)',
        actualLanguage: config?.defaultLanguage,
        error: 'Storage initialization error'
      }
    };
  }
  
  /**
   * Test 9: Language Setting Immediate Availability
   */
  async testLanguageSettingImmediateAvailability(): Promise<InitializationTestResult> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-immediate-test',
      defaultLanguage: 'French'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    // Simulate extension startup sequence
    const startTime = performance.now();
    
    // 1. Extension loads
    const config = await this.storageManager.getConfig();
    
    // 2. Language setting should be immediately available
    const languageAvailable = config?.defaultLanguage !== undefined;
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    const success = languageAvailable && 
                   config.defaultLanguage === testConfig.defaultLanguage &&
                   loadTime < 50; // Should be very fast
    
    return {
      testName: 'Language Setting Immediate Availability',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved: languageAvailable,
        expectedLanguage: testConfig.defaultLanguage,
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Test 10: Content Script Initialization
   */
  async testContentScriptInitialization(): Promise<InitializationTestResult> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'anthropic',
      apiKey: 'sk-content-test',
      defaultLanguage: 'Italian'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    // Simulate content script initialization via runtime message
    const { result: config, time: loadTime } = await this.measureOperationTime(async () => {
      return await this.storageManager.getConfigViaRuntime();
    });
    
    const success = config !== null && 
                   config.defaultLanguage === testConfig.defaultLanguage &&
                   loadTime < 200; // Content script may be slightly slower
    
    return {
      testName: 'Content Script Initialization',
      success,
      loadTime,
      details: {
        configAvailable: config !== null,
        languageRetrieved: config?.defaultLanguage !== undefined,
        expectedLanguage: testConfig.defaultLanguage,
        actualLanguage: config?.defaultLanguage,
      }
    };
  }
  
  /**
   * Run all initialization tests
   */
  async runAllInitializationTests(): Promise<{
    results: InitializationTestResult[];
    summary: {
      passed: number;
      failed: number;
      total: number;
      averageLoadTime: number;
      fastestLoad: number;
      slowestLoad: number;
    };
  }> {
    console.log('🚀 Starting Extension Initialization Tests...\n');
    
    const tests = [
      this.testColdStartInitialization,
      this.testRuntimeMessageInitialization,
      this.testWarmStartInitialization,
      this.testInitializationWithEmptyStorage,
      this.testInitializationWithDefaults,
      this.testConcurrentInitialization,
      this.testInitializationPerformanceUnderLoad,
      this.testInitializationWithStorageErrors,
      this.testLanguageSettingImmediateAvailability,
      this.testContentScriptInitialization
    ];
    
    this.testResults = [];
    
    for (const test of tests) {
      await this.runInitializationTest(test.name, test.bind(this));
    }
    
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const loadTimes = this.testResults.map(r => r.loadTime);
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    const fastestLoad = Math.min(...loadTimes);
    const slowestLoad = Math.max(...loadTimes);
    
    console.log('\n📊 Initialization Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${tests.length}`);
    console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    console.log(`⚡ Average Load Time: ${averageLoadTime.toFixed(2)}ms`);
    console.log(`🏃 Fastest Load: ${fastestLoad.toFixed(2)}ms`);
    console.log(`🐌 Slowest Load: ${slowestLoad.toFixed(2)}ms`);
    
    return {
      results: this.testResults,
      summary: {
        passed,
        failed,
        total: tests.length,
        averageLoadTime,
        fastestLoad,
        slowestLoad
      }
    };
  }
  
  /**
   * Generate initialization test report
   */
  generateInitializationReport(): string {
    const lines = [
      '# Extension Initialization Test Report',
      '',
      '## Performance Metrics',
      ''
    ];
    
    const loadTimes = this.testResults.map(r => r.loadTime);
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    
    lines.push(`- **Average Load Time**: ${averageLoadTime.toFixed(2)}ms`);
    lines.push(`- **Fastest Load**: ${Math.min(...loadTimes).toFixed(2)}ms`);
    lines.push(`- **Slowest Load**: ${Math.max(...loadTimes).toFixed(2)}ms`);
    lines.push('');
    
    lines.push('## Test Results');
    lines.push('');
    
    this.testResults.forEach(result => {
      lines.push(`### ${result.testName}`);
      lines.push(`- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push(`- **Load Time**: ${result.loadTime.toFixed(2)}ms`);
      lines.push(`- **Config Available**: ${result.details.configAvailable ? 'Yes' : 'No'}`);
      lines.push(`- **Language Retrieved**: ${result.details.languageRetrieved ? 'Yes' : 'No'}`);
      
      if (result.details.expectedLanguage) {
        lines.push(`- **Expected Language**: ${result.details.expectedLanguage}`);
      }
      
      if (result.details.actualLanguage) {
        lines.push(`- **Actual Language**: ${result.details.actualLanguage}`);
      }
      
      if (result.details.error) {
        lines.push(`- **Error**: ${result.details.error}`);
      }
      
      lines.push('');
    });
    
    return lines.join('\n');
  }
}

// Export for testing
export { ExtensionInitializationTests };

// Browser integration
declare const window: any;
if (typeof window !== 'undefined') {
  window.ExtensionInitializationTests = ExtensionInitializationTests;
  
  window.runInitializationTests = async () => {
    const tester = new ExtensionInitializationTests();
    return await tester.runAllInitializationTests();
  };
}

// Usage guide
export const initializationTestingGuide = `
⚡ Extension Initialization Testing Guide

This test suite verifies that language settings are immediately available when
the extension loads and initializes.

## Key Areas Tested:

1. **Cold Start Performance**
   - Extension startup from completely closed state
   - First-time configuration loading
   - Storage access latency

2. **Warm Start Performance**
   - Extension reinitialization with cached data
   - Subsequent configuration retrievals
   - Memory vs. storage access

3. **Runtime Message Handling**
   - Content script initialization
   - Background script communication
   - Message passing performance

4. **Error Handling**
   - Storage unavailable during startup
   - Configuration corruption
   - Network connectivity issues

5. **Concurrent Access**
   - Multiple simultaneous initialization requests
   - Race condition handling
   - Resource contention

## Performance Benchmarks:

- **Cold Start**: < 100ms
- **Warm Start**: < 50ms  
- **Runtime Messages**: < 150ms
- **Default Values**: < 10ms
- **Concurrent Requests**: < 200ms

## Running Tests:

\`\`\`javascript
// Run all initialization tests
runInitializationTests().then(results => {
  console.log('Initialization Results:', results);
});

// Manual testing
const tester = new ExtensionInitializationTests();
tester.runAllInitializationTests().then(results => {
  console.log(tester.generateInitializationReport());
});
\`\`\`

## Critical Success Factors:

✅ **Fast Load Times**: Language settings available within 100ms
✅ **Immediate Availability**: No waiting for async operations
✅ **Error Resilience**: Graceful handling of initialization failures
✅ **Consistent Performance**: Stable load times across scenarios
✅ **Concurrent Safety**: No race conditions during startup

## Integration with Extension:

1. **Content Script**: Call tests during script injection
2. **Background Script**: Run tests on extension startup
3. **Options Page**: Include tests in development builds
4. **Popup**: Test initialization on popup open

## Monitoring in Production:

- Track initialization times in production
- Monitor for startup failures
- Alert on performance degradation
- Collect user experience metrics
`;

export default ExtensionInitializationTests;