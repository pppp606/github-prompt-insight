/**
 * Browser Storage Tests for Language Settings Persistence
 * 
 * This file contains tests designed to run in the actual Chrome extension environment
 * to verify language settings persistence across browser sessions.
 * 
 * Usage: Include this in your extension's content script or popup for testing.
 */

import { StorageManager, ExtensionConfig } from '../utils/storage';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

class BrowserStorageTests {
  private storageManager: StorageManager;
  private testResults: TestResult[] = [];
  
  constructor() {
    this.storageManager = new StorageManager();
  }
  
  private log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const styles = {
      info: 'color: #0366d6;',
      success: 'color: #28a745;',
      error: 'color: #d73a49;'
    };
    console.log(`%c${message}`, styles[type]);
  }
  
  private async runTest(testName: string, testFn: () => Promise<boolean>): Promise<TestResult> {
    this.log(`🧪 Running: ${testName}`, 'info');
    
    try {
      const passed = await testFn();
      const result: TestResult = {
        testName,
        passed,
        details: passed ? 'Test completed successfully' : 'Test failed'
      };
      
      this.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
      this.testResults.push(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        details: 'Test threw an exception'
      };
      
      this.log(`❌ ${testName}: ERROR - ${result.error}`, 'error');
      this.testResults.push(result);
      return result;
    }
  }
  
  /**
   * Test 1: Basic Chrome Storage Sync Functionality
   */
  async testBasicStorageSync(): Promise<boolean> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-test-key-basic',
      defaultLanguage: 'Japanese',
      model: 'gpt-3.5-turbo'
    };
    
    // Store configuration
    await this.storageManager.setConfig(testConfig);
    
    // Retrieve configuration
    const retrieved = await this.storageManager.getConfig();
    
    return retrieved !== null && 
           retrieved.defaultLanguage === testConfig.defaultLanguage &&
           retrieved.apiKey === testConfig.apiKey;
  }
  
  /**
   * Test 2: Language Setting Persistence After Update
   */
  async testLanguageUpdatePersistence(): Promise<boolean> {
    const initialConfig: ExtensionConfig = {
      llmProvider: 'anthropic',
      apiKey: 'sk-test-key-update',
      defaultLanguage: 'English',
      model: 'claude-3-sonnet-20240229'
    };
    
    // Store initial configuration
    await this.storageManager.setConfig(initialConfig);
    
    // Update language
    await this.storageManager.updateConfig({ defaultLanguage: 'Spanish' });
    
    // Verify persistence
    const updated = await this.storageManager.getConfig();
    
    return updated !== null &&
           updated.defaultLanguage === 'Spanish' &&
           updated.apiKey === initialConfig.apiKey;
  }
  
  /**
   * Test 3: Runtime Message Based Storage Access
   */
  async testRuntimeStorageAccess(): Promise<boolean> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'google',
      apiKey: 'test-key-runtime',
      defaultLanguage: 'French',
      model: 'gemini-pro'
    };
    
    // Store via runtime message
    const setSuccess = await this.storageManager.setConfigViaRuntime(testConfig);
    
    if (!setSuccess) {
      return false;
    }
    
    // Retrieve via runtime message
    const retrieved = await this.storageManager.getConfigViaRuntime();
    
    return retrieved !== null &&
           retrieved.defaultLanguage === testConfig.defaultLanguage;
  }
  
  /**
   * Test 4: Configuration Validation
   */
  async testConfigValidation(): Promise<boolean> {
    const validConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-valid-key',
      defaultLanguage: 'German',
      temperature: 0.7,
      maxTokens: 1000
    };
    
    try {
      // Should not throw
      this.storageManager.validateConfig(validConfig);
      
      // Should throw for invalid config
      const invalidConfig = {
        ...validConfig,
        llmProvider: 'invalid-provider' as any
      };
      
      let threwError = false;
      try {
        this.storageManager.validateConfig(invalidConfig);
      } catch {
        threwError = true;
      }
      
      return threwError;
    } catch {
      return false;
    }
  }
  
  /**
   * Test 5: Storage Error Handling
   */
  async testStorageErrorHandling(): Promise<boolean> {
    try {
      // Test with malformed config
      const malformedConfig = {
        llmProvider: 'openai',
        apiKey: '', // Empty API key should fail validation
        defaultLanguage: 'InvalidLanguage'
      } as ExtensionConfig;
      
      let caughtError = false;
      try {
        await this.storageManager.setConfig(malformedConfig);
      } catch {
        caughtError = true;
      }
      
      return caughtError;
    } catch {
      return false;
    }
  }
  
  /**
   * Test 6: Default Configuration Handling
   */
  async testDefaultConfiguration(): Promise<boolean> {
    const defaults = this.storageManager.getDefaultConfig();
    
    return defaults.defaultLanguage === 'Japanese' &&
           defaults.llmProvider === 'openai' &&
           defaults.temperature === 0.7;
  }
  
  /**
   * Test 7: Configuration Completeness Check
   */
  async testConfigurationCompleteness(): Promise<boolean> {
    // Clear existing config
    await this.storageManager.clearConfig();
    
    // Should not be configured
    const notConfigured = !(await this.storageManager.isConfigured());
    
    // Add complete config
    const completeConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-complete-key',
      defaultLanguage: 'Italian'
    };
    
    await this.storageManager.setConfig(completeConfig);
    
    // Should be configured now
    const isConfigured = await this.storageManager.isConfigured();
    
    return notConfigured && isConfigured;
  }
  
  /**
   * Test 8: Language Support Verification
   */
  async testLanguageSupport(): Promise<boolean> {
    const supportedLanguages = this.storageManager.getSupportedLanguages();
    
    const expectedLanguages = ['English', 'Japanese', 'Spanish', 'French', 'German'];
    
    return expectedLanguages.every(lang => supportedLanguages.includes(lang)) &&
           supportedLanguages.length >= 5;
  }
  
  /**
   * Test 9: Concurrent Storage Operations
   */
  async testConcurrentOperations(): Promise<boolean> {
    const configs = [
      { llmProvider: 'openai' as const, apiKey: 'sk-1', defaultLanguage: 'English' },
      { llmProvider: 'anthropic' as const, apiKey: 'sk-2', defaultLanguage: 'Japanese' },
      { llmProvider: 'google' as const, apiKey: 'sk-3', defaultLanguage: 'Spanish' }
    ];
    
    // Run concurrent operations
    const promises = configs.map(config => this.storageManager.setConfig(config));
    await Promise.all(promises);
    
    // Verify final state is consistent
    const finalConfig = await this.storageManager.getConfig();
    
    return finalConfig !== null &&
           configs.some(config => config.defaultLanguage === finalConfig.defaultLanguage);
  }
  
  /**
   * Test 10: API Key Retrieval
   */
  async testApiKeyRetrieval(): Promise<boolean> {
    const testConfig: ExtensionConfig = {
      llmProvider: 'openai',
      apiKey: 'sk-api-key-test',
      defaultLanguage: 'Portuguese'
    };
    
    await this.storageManager.setConfig(testConfig);
    
    const retrievedApiKey = await this.storageManager.getApiKey();
    
    return retrievedApiKey === testConfig.apiKey;
  }
  
  /**
   * Run all tests and return comprehensive results
   */
  async runAllTests(): Promise<TestSuite> {
    this.log('🚀 Starting Browser Storage Tests for Language Settings Persistence', 'info');
    this.log('=' .repeat(80), 'info');
    
    this.testResults = [];
    
    const tests = [
      { name: 'Basic Storage Sync', fn: this.testBasicStorageSync },
      { name: 'Language Update Persistence', fn: this.testLanguageUpdatePersistence },
      { name: 'Runtime Storage Access', fn: this.testRuntimeStorageAccess },
      { name: 'Configuration Validation', fn: this.testConfigValidation },
      { name: 'Storage Error Handling', fn: this.testStorageErrorHandling },
      { name: 'Default Configuration', fn: this.testDefaultConfiguration },
      { name: 'Configuration Completeness', fn: this.testConfigurationCompleteness },
      { name: 'Language Support', fn: this.testLanguageSupport },
      { name: 'Concurrent Operations', fn: this.testConcurrentOperations },
      { name: 'API Key Retrieval', fn: this.testApiKeyRetrieval }
    ];
    
    for (const test of tests) {
      await this.runTest(test.name, test.fn.bind(this));
    }
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    this.log('=' .repeat(80), 'info');
    this.log('📊 Test Results Summary:', 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`📈 Total: ${tests.length}`, 'info');
    this.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`, 'info');
    
    return {
      name: 'Language Settings Persistence Test Suite',
      results: this.testResults,
      summary: {
        passed,
        failed,
        total: tests.length
      }
    };
  }
  
  /**
   * Run tests specifically for session persistence
   */
  async runSessionPersistenceTests(): Promise<TestSuite> {
    this.log('🚀 Starting Session Persistence Tests', 'info');
    
    const sessionTests = [
      { name: 'Basic Storage Sync', fn: this.testBasicStorageSync },
      { name: 'Language Update Persistence', fn: this.testLanguageUpdatePersistence },
      { name: 'Runtime Storage Access', fn: this.testRuntimeStorageAccess },
      { name: 'Configuration Completeness', fn: this.testConfigurationCompleteness }
    ];
    
    this.testResults = [];
    
    for (const test of sessionTests) {
      await this.runTest(test.name, test.fn.bind(this));
    }
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    return {
      name: 'Session Persistence Test Suite',
      results: this.testResults,
      summary: {
        passed,
        failed,
        total: sessionTests.length
      }
    };
  }
  
  /**
   * Get human-readable test report
   */
  generateReport(testSuite: TestSuite): string {
    const lines = [
      `# ${testSuite.name}`,
      '',
      `## Summary`,
      `- **Total Tests**: ${testSuite.summary.total}`,
      `- **Passed**: ${testSuite.summary.passed}`,
      `- **Failed**: ${testSuite.summary.failed}`,
      `- **Success Rate**: ${((testSuite.summary.passed / testSuite.summary.total) * 100).toFixed(1)}%`,
      '',
      `## Detailed Results`
    ];
    
    testSuite.results.forEach(result => {
      lines.push(`### ${result.testName}`);
      lines.push(`- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      if (result.error) {
        lines.push(`- **Error**: ${result.error}`);
      }
      if (result.details) {
        lines.push(`- **Details**: ${result.details}`);
      }
      lines.push('');
    });
    
    return lines.join('\n');
  }
}

// Export for browser usage
export { BrowserStorageTests };

// Self-executing function for browser testing
declare const window: any;
if (typeof window !== 'undefined') {
  window.BrowserStorageTests = BrowserStorageTests;
  
  // Add convenience functions to window
  window.runStorageTests = async () => {
    const tester = new BrowserStorageTests();
    return await tester.runAllTests();
  };
  
  window.runSessionTests = async () => {
    const tester = new BrowserStorageTests();
    return await tester.runSessionPersistenceTests();
  };
}

// Manual testing guide
export const browserTestingGuide = `
🌐 Browser Testing Guide for Language Settings Persistence

1. **Open Chrome Extension**:
   - Load your extension in Chrome
   - Open Chrome DevTools (F12)
   - Navigate to Console tab

2. **Run Automated Tests**:
   \`\`\`javascript
   // Run all tests
   runStorageTests().then(results => {
     console.log('Test Results:', results);
   });
   
   // Run session-specific tests
   runSessionTests().then(results => {
     console.log('Session Test Results:', results);
   });
   \`\`\`

3. **Manual Session Tests**:
   - Set language to "Spanish" in extension options
   - Note the timestamp: [Record current time]
   - Close Chrome completely
   - Reopen Chrome and check extension options
   - Verify language is still "Spanish"

4. **Cross-Device Testing** (if Chrome sync enabled):
   - Device 1: Set language to "French"
   - Wait 2-3 minutes for sync
   - Device 2: Check extension options
   - Should show "French"

5. **Extension Reload Testing**:
   - Set language to "German"
   - Go to chrome://extensions/
   - Click "Reload" on your extension
   - Check language persists as "German"

6. **Storage Inspection**:
   - Open Chrome DevTools
   - Go to Application tab
   - Navigate to Storage > Extension Storage
   - Look for 'extensionConfig' key
   - Verify defaultLanguage value

Expected Results:
✅ Language settings should persist across all scenarios
✅ No data loss during browser restarts
✅ Settings available immediately on extension load
✅ Proper fallback behavior when storage unavailable
`;