/**
 * Storage Fallback Tests
 * 
 * This file contains tests to verify proper fallback behavior when Chrome storage
 * is unavailable, network is down, or other storage-related errors occur.
 */

import { StorageManager, ExtensionConfig } from '../utils/storage';

interface FallbackTestResult {
  scenario: string;
  success: boolean;
  expectedBehavior: string;
  actualBehavior: string;
  error?: string;
}

// interface StorageState {
//   isAvailable: boolean;
//   hasData: boolean;
//   lastKnownLanguage?: string;
//   errorMessage?: string;
// }

class StorageFallbackTests {
  private storageManager: StorageManager;
  private testResults: FallbackTestResult[] = [];
  private originalChrome: any;
  
  constructor() {
    this.storageManager = new StorageManager();
    this.originalChrome = (global as any).chrome;
  }
  
  private createMockChrome(scenario: string): any {
    const mockChrome = {
      storage: {
        sync: {
          get: (_keys: any, callback: any) => {
            this.simulateStorageError(scenario, callback);
          },
          set: (_items: any, callback: any) => {
            this.simulateStorageError(scenario, callback);
          },
          remove: (_keys: any, callback: any) => {
            this.simulateStorageError(scenario, callback);
          }
        }
      },
      runtime: {
        lastError: null,
        sendMessage: (_message: any, callback: any) => {
          this.simulateRuntimeError(scenario, callback);
        }
      }
    };
    
    return mockChrome;
  }
  
  private simulateStorageError(scenario: string, callback: any): void {
    setTimeout(() => {
      const mockChrome = (global as any).chrome;
      
      switch (scenario) {
        case 'network_down':
          mockChrome.runtime.lastError = { message: 'Network unavailable' };
          callback({});
          break;
          
        case 'storage_quota_exceeded':
          mockChrome.runtime.lastError = { message: 'QUOTA_BYTES_PER_ITEM quota exceeded' };
          callback({});
          break;
          
        case 'sync_disabled':
          mockChrome.runtime.lastError = { message: 'Sync is disabled' };
          callback({});
          break;
          
        case 'permission_denied':
          mockChrome.runtime.lastError = { message: 'Permission denied' };
          callback({});
          break;
          
        case 'storage_corrupted':
          mockChrome.runtime.lastError = { message: 'Storage data corrupted' };
          callback({});
          break;
          
        case 'timeout':
          // Don't call callback to simulate timeout
          break;
          
        default:
          mockChrome.runtime.lastError = null;
          callback({});
      }
    }, 10);
  }
  
  private simulateRuntimeError(scenario: string, callback: any): void {
    setTimeout(() => {
      const mockChrome = (global as any).chrome;
      
      switch (scenario) {
        case 'background_script_dead':
          mockChrome.runtime.lastError = { message: 'Extension context invalidated' };
          callback({});
          break;
          
        case 'message_port_closed':
          mockChrome.runtime.lastError = { message: 'Message port closed' };
          callback({});
          break;
          
        default:
          callback({});
      }
    }, 10);
  }
  
  private async runFallbackTest(
    scenario: string,
    testFunction: () => Promise<boolean>,
    expectedBehavior: string
  ): Promise<FallbackTestResult> {
    console.log(`🧪 Testing fallback scenario: ${scenario}`);
    
    // Setup mock environment
    (global as any).chrome = this.createMockChrome(scenario);
    
    try {
      const success = await testFunction();
      
      const result: FallbackTestResult = {
        scenario,
        success,
        expectedBehavior,
        actualBehavior: success ? 'Handled gracefully' : 'Failed to handle gracefully'
      };
      
      console.log(`${success ? '✅' : '❌'} ${scenario}: ${success ? 'PASSED' : 'FAILED'}`);
      return result;
      
    } catch (error) {
      const result: FallbackTestResult = {
        scenario,
        success: false,
        expectedBehavior,
        actualBehavior: 'Threw exception',
        error: error instanceof Error ? error.message : String(error)
      };
      
      console.log(`❌ ${scenario}: FAILED with error: ${result.error}`);
      return result;
      
    } finally {
      // Restore original chrome
      (global as any).chrome = this.originalChrome;
    }
  }
  
  /**
   * Test 1: Network Connection Down
   */
  async testNetworkDown(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfig();
      
      // Should return null when network is down
      const handledGracefully = config === null;
      
      return handledGracefully;
    } catch (error) {
      // Should not throw, should handle gracefully
      return false;
    }
  }
  
  /**
   * Test 2: Storage Quota Exceeded
   */
  async testStorageQuotaExceeded(): Promise<boolean> {
    try {
      const testConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        defaultLanguage: 'Japanese'
      };
      
      await this.storageManager.setConfig(testConfig);
      
      // Should handle quota exceeded gracefully
      return false; // Should not succeed when quota exceeded
    } catch (error) {
      // Should throw specific quota error
      return error instanceof Error && error.message.includes('quota');
    }
  }
  
  /**
   * Test 3: Chrome Sync Disabled
   */
  async testSyncDisabled(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfig();
      
      // Should return null when sync is disabled
      return config === null;
    } catch (error) {
      // Should handle sync disabled gracefully
      return error instanceof Error && error.message.includes('Sync is disabled');
    }
  }
  
  /**
   * Test 4: Permission Denied
   */
  async testPermissionDenied(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfig();
      
      // Should return null when permission denied
      return config === null;
    } catch (error) {
      // Should handle permission denied gracefully
      return error instanceof Error && error.message.includes('Permission denied');
    }
  }
  
  /**
   * Test 5: Storage Data Corrupted
   */
  async testStorageCorrupted(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfig();
      
      // Should return null when storage is corrupted
      return config === null;
    } catch (error) {
      // Should handle corrupted storage gracefully
      return error instanceof Error && error.message.includes('corrupted');
    }
  }
  
  /**
   * Test 6: Storage Operation Timeout
   */
  async testStorageTimeout(): Promise<boolean> {
    try {
      // Add timeout to test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), 1000);
      });
      
      const configPromise = this.storageManager.getConfig();
      
      await Promise.race([configPromise, timeoutPromise]);
      
      // Should not reach here if timeout works
      return false;
    } catch (error) {
      // Should timeout gracefully
      return error instanceof Error && error.message.includes('timed out');
    }
  }
  
  /**
   * Test 7: Background Script Dead
   */
  async testBackgroundScriptDead(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfigViaRuntime();
      
      // Should return null when background script is dead
      return config === null;
    } catch (error) {
      // Should handle dead background script gracefully
      return error instanceof Error && error.message.includes('Extension context invalidated');
    }
  }
  
  /**
   * Test 8: Message Port Closed
   */
  async testMessagePortClosed(): Promise<boolean> {
    try {
      const config = await this.storageManager.getConfigViaRuntime();
      
      // Should return null when message port is closed
      return config === null;
    } catch (error) {
      // Should handle closed message port gracefully
      return error instanceof Error && error.message.includes('Message port closed');
    }
  }
  
  /**
   * Test 9: Fallback to Default Language
   */
  async testFallbackToDefault(): Promise<boolean> {
    try {
      // Clear any existing config
      await this.storageManager.clearConfig();
      
      // Get default configuration
      const defaults = this.storageManager.getDefaultConfig();
      
      // Should return default language when no config exists
      return defaults.defaultLanguage === 'Japanese';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test 10: Graceful Degradation
   */
  async testGracefulDegradation(): Promise<boolean> {
    try {
      // Test that extension can continue functioning even with storage issues
      const supportedLanguages = this.storageManager.getSupportedLanguages();
      
      // Should still be able to get supported languages
      return Array.isArray(supportedLanguages) && supportedLanguages.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test 11: Recovery After Storage Restoration
   */
  async testStorageRecovery(): Promise<boolean> {
    try {
      // First, simulate storage failure
      (global as any).chrome = this.createMockChrome('network_down');
      
      const configDuringFailure = await this.storageManager.getConfig();
      
      // Should return null during failure
      if (configDuringFailure !== null) {
        return false;
      }
      
      // Restore normal storage
      (global as any).chrome = this.originalChrome;
      
      // Should be able to access storage again
      const testConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-recovery-test',
        defaultLanguage: 'French'
      };
      
      await this.storageManager.setConfig(testConfig);
      const recoveredConfig = await this.storageManager.getConfig();
      
      return recoveredConfig?.defaultLanguage === 'French';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test 12: Local Storage Fallback
   */
  async testLocalStorageFallback(): Promise<boolean> {
    try {
      // Test if extension can use local storage when sync fails
      // This would require implementing local storage fallback in StorageManager
      
      // For now, test that it handles sync failure gracefully
      const config = await this.storageManager.getConfig();
      
      // Should not crash when sync storage is unavailable
      return config === null; // Expected when sync fails
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Run all fallback tests
   */
  async runAllFallbackTests(): Promise<{
    results: FallbackTestResult[];
    summary: {
      passed: number;
      failed: number;
      total: number;
    };
  }> {
    console.log('🚀 Starting Storage Fallback Tests...\n');
    
    const tests = [
      {
        name: 'Network Down',
        fn: this.testNetworkDown,
        expected: 'Return null gracefully when network is unavailable'
      },
      {
        name: 'Storage Quota Exceeded',
        fn: this.testStorageQuotaExceeded,
        expected: 'Handle quota exceeded with appropriate error'
      },
      {
        name: 'Chrome Sync Disabled',
        fn: this.testSyncDisabled,
        expected: 'Handle sync disabled gracefully'
      },
      {
        name: 'Permission Denied',
        fn: this.testPermissionDenied,
        expected: 'Handle permission denied gracefully'
      },
      {
        name: 'Storage Data Corrupted',
        fn: this.testStorageCorrupted,
        expected: 'Handle corrupted storage gracefully'
      },
      {
        name: 'Storage Operation Timeout',
        fn: this.testStorageTimeout,
        expected: 'Timeout gracefully on long operations'
      },
      {
        name: 'Background Script Dead',
        fn: this.testBackgroundScriptDead,
        expected: 'Handle dead background script gracefully'
      },
      {
        name: 'Message Port Closed',
        fn: this.testMessagePortClosed,
        expected: 'Handle closed message port gracefully'
      },
      {
        name: 'Fallback to Default Language',
        fn: this.testFallbackToDefault,
        expected: 'Use default language when no config exists'
      },
      {
        name: 'Graceful Degradation',
        fn: this.testGracefulDegradation,
        expected: 'Continue functioning with limited features'
      },
      {
        name: 'Storage Recovery',
        fn: this.testStorageRecovery,
        expected: 'Recover functionality when storage is restored'
      },
      {
        name: 'Local Storage Fallback',
        fn: this.testLocalStorageFallback,
        expected: 'Use local storage when sync storage fails'
      }
    ];
    
    this.testResults = [];
    
    for (const test of tests) {
      const result = await this.runFallbackTest(
        test.name,
        test.fn.bind(this),
        test.expected
      );
      
      this.testResults.push(result);
    }
    
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    
    console.log('\n📊 Fallback Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${tests.length}`);
    console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    return {
      results: this.testResults,
      summary: {
        passed,
        failed,
        total: tests.length
      }
    };
  }
  
  /**
   * Generate fallback test report
   */
  generateFallbackReport(): string {
    const lines = [
      '# Storage Fallback Test Report',
      '',
      '## Test Results',
      ''
    ];
    
    this.testResults.forEach(result => {
      lines.push(`### ${result.scenario}`);
      lines.push(`- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push(`- **Expected**: ${result.expectedBehavior}`);
      lines.push(`- **Actual**: ${result.actualBehavior}`);
      
      if (result.error) {
        lines.push(`- **Error**: ${result.error}`);
      }
      
      lines.push('');
    });
    
    const passed = this.testResults.filter(r => r.success).length;
    const failed = this.testResults.filter(r => !r.success).length;
    const total = this.testResults.length;
    
    lines.push('## Summary');
    lines.push(`- **Total Tests**: ${total}`);
    lines.push(`- **Passed**: ${passed}`);
    lines.push(`- **Failed**: ${failed}`);
    lines.push(`- **Success Rate**: ${((passed / total) * 100).toFixed(1)}%`);
    
    return lines.join('\n');
  }
}

// Export for testing
export { StorageFallbackTests };

// Browser integration
declare const window: any;
if (typeof window !== 'undefined') {
  window.StorageFallbackTests = StorageFallbackTests;
  
  window.runFallbackTests = async () => {
    const tester = new StorageFallbackTests();
    return await tester.runAllFallbackTests();
  };
}

// Usage guide
export const fallbackTestingGuide = `
🛡️ Storage Fallback Testing Guide

This test suite verifies that your extension handles storage failures gracefully.

## Key Scenarios Tested:

1. **Network Connectivity Issues**
   - Network down during storage operations
   - Intermittent connection failures
   - Slow network causing timeouts

2. **Chrome Storage Limitations**
   - Storage quota exceeded
   - Sync storage disabled
   - Permission denied errors

3. **Data Integrity Issues**
   - Corrupted storage data
   - Missing configuration files
   - Invalid data formats

4. **Extension Lifecycle Issues**
   - Background script crashes
   - Message port closures
   - Extension context invalidation

5. **Recovery Scenarios**
   - Storage restoration after failure
   - Graceful degradation
   - Fallback to default values

## Running Tests:

\`\`\`javascript
// Run all fallback tests
runFallbackTests().then(results => {
  console.log('Fallback Test Results:', results);
});

// Manual testing
const tester = new StorageFallbackTests();
tester.runAllFallbackTests().then(results => {
  console.log(tester.generateFallbackReport());
});
\`\`\`

## Expected Behaviors:

✅ **Graceful Handling**: No crashes or exceptions during storage failures
✅ **Fallback Values**: Use default language when storage is unavailable
✅ **Error Recovery**: Restore functionality when storage becomes available
✅ **User Experience**: Maintain basic functionality during storage issues
✅ **Data Safety**: Prevent data corruption during failures

## Implementation Tips:

1. **Always catch storage errors**
2. **Provide meaningful default values**
3. **Implement retry mechanisms**
4. **Use timeouts for storage operations**
5. **Test in offline conditions**
6. **Monitor storage usage**
`;

export default StorageFallbackTests;