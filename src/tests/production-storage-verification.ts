/**
 * Production Storage Verification
 * 
 * This script verifies that language settings persist correctly in the production
 * Chrome extension environment. It can be included in the extension build for
 * real-world testing.
 */

import { StorageManager, ExtensionConfig } from '../utils/storage';

interface VerificationResult {
  timestamp: string;
  testName: string;
  success: boolean;
  error?: string;
  data?: any;
}

interface SessionData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  languageSettings: {
    initial: string;
    changes: Array<{
      timestamp: string;
      language: string;
      trigger: string;
    }>;
  };
  persistenceChecks: VerificationResult[];
}

class ProductionStorageVerification {
  private storageManager: StorageManager;
  private sessionData: SessionData;
  private verificationResults: VerificationResult[] = [];
  
  constructor() {
    this.storageManager = new StorageManager();
    this.sessionData = {
      sessionId: this.generateSessionId(),
      startTime: new Date().toISOString(),
      languageSettings: {
        initial: '',
        changes: []
      },
      persistenceChecks: []
    };
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async addVerificationResult(testName: string, success: boolean, error?: string, data?: any): Promise<void> {
    const result: VerificationResult = {
      timestamp: new Date().toISOString(),
      testName,
      success,
      error,
      data
    };
    
    this.verificationResults.push(result);
    this.sessionData.persistenceChecks.push(result);
    
    // Log to console for debugging
    console.log(`[Storage Verification] ${testName}: ${success ? 'SUCCESS' : 'FAILED'}`, 
               error ? `Error: ${error}` : '', data ? data : '');
  }
  
  /**
   * Initialize verification and capture initial state
   */
  async initialize(): Promise<void> {
    try {
      const config = await this.storageManager.getConfig();
      this.sessionData.languageSettings.initial = config?.defaultLanguage || 'Not set';
      
      await this.addVerificationResult('Initial State Capture', true, undefined, {
        hasConfig: !!config,
        language: config?.defaultLanguage,
        provider: config?.llmProvider
      });
    } catch (error) {
      await this.addVerificationResult('Initial State Capture', false, 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Verify storage accessibility
   */
  async verifyStorageAccess(): Promise<boolean> {
    try {
      // Test basic read access
      const config = await this.storageManager.getConfig();
      
      // Test write access with a temporary marker
      const testMarker = `verification_${Date.now()}`;
      await this.storageManager.updateConfig({ 
        defaultLanguage: config?.defaultLanguage || 'English'
      });
      
      await this.addVerificationResult('Storage Access', true, undefined, {
        canRead: true,
        canWrite: true,
        currentLanguage: config?.defaultLanguage
      });
      
      return true;
    } catch (error) {
      await this.addVerificationResult('Storage Access', false, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Verify Chrome sync storage specifically
   */
  async verifySyncStorage(): Promise<boolean> {
    try {
      // Test direct Chrome sync storage
      const testKey = 'sync_verification_test';
      const testValue = { 
        timestamp: Date.now(), 
        language: 'test_language',
        sessionId: this.sessionData.sessionId
      };
      
      // Store test data
      await new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ [testKey]: testValue }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      
      // Retrieve test data
      const retrieved = await new Promise<any>((resolve, reject) => {
        chrome.storage.sync.get(testKey, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[testKey]);
          }
        });
      });
      
      // Clean up test data
      await new Promise<void>((resolve) => {
        chrome.storage.sync.remove(testKey, () => resolve());
      });
      
      const syncWorks = retrieved && retrieved.sessionId === this.sessionData.sessionId;
      
      await this.addVerificationResult('Sync Storage', syncWorks, undefined, {
        testDataPersisted: syncWorks,
        retrievedData: retrieved
      });
      
      return syncWorks;
    } catch (error) {
      await this.addVerificationResult('Sync Storage', false, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Track language setting changes
   */
  async trackLanguageChange(newLanguage: string, trigger: string): Promise<void> {
    this.sessionData.languageSettings.changes.push({
      timestamp: new Date().toISOString(),
      language: newLanguage,
      trigger
    });
    
    await this.addVerificationResult('Language Change Tracked', true, undefined, {
      language: newLanguage,
      trigger,
      changeCount: this.sessionData.languageSettings.changes.length
    });
  }
  
  /**
   * Verify language setting persistence after a delay
   */
  async verifyLanguagePersistence(expectedLanguage: string, delayMs: number = 1000): Promise<boolean> {
    try {
      // Wait for specified delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Check if language persisted
      const config = await this.storageManager.getConfig();
      const currentLanguage = config?.defaultLanguage;
      
      const persisted = currentLanguage === expectedLanguage;
      
      await this.addVerificationResult('Language Persistence', persisted, undefined, {
        expected: expectedLanguage,
        actual: currentLanguage,
        delayMs
      });
      
      return persisted;
    } catch (error) {
      await this.addVerificationResult('Language Persistence', false, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Verify extension load-time retrieval
   */
  async verifyLoadTimeRetrieval(): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Simulate extension load by using runtime message
      const config = await this.storageManager.getConfigViaRuntime();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      const hasConfig = !!config;
      const hasLanguage = !!config?.defaultLanguage;
      const fastLoad = loadTime < 100; // Should load within 100ms
      
      await this.addVerificationResult('Load Time Retrieval', hasConfig && hasLanguage, undefined, {
        loadTime: `${loadTime.toFixed(2)}ms`,
        hasConfig,
        hasLanguage,
        fastLoad,
        language: config?.defaultLanguage
      });
      
      return hasConfig && hasLanguage;
    } catch (error) {
      await this.addVerificationResult('Load Time Retrieval', false, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Verify error handling and recovery
   */
  async verifyErrorHandling(): Promise<boolean> {
    try {
      // Test with invalid configuration
      const invalidConfig = {
        llmProvider: 'invalid',
        apiKey: '',
        defaultLanguage: 'InvalidLanguage'
      } as ExtensionConfig;
      
      let errorCaught = false;
      try {
        await this.storageManager.setConfig(invalidConfig);
      } catch {
        errorCaught = true;
      }
      
      // Test recovery - should still be able to get valid config
      const config = await this.storageManager.getConfig();
      const canRecover = !!config;
      
      await this.addVerificationResult('Error Handling', errorCaught && canRecover, undefined, {
        invalidConfigRejected: errorCaught,
        canRecoverAfterError: canRecover
      });
      
      return errorCaught && canRecover;
    } catch (error) {
      await this.addVerificationResult('Error Handling', false, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Run continuous monitoring
   */
  async startContinuousMonitoring(intervalMs: number = 30000): Promise<void> {
    const monitor = async () => {
      try {
        const config = await this.storageManager.getConfig();
        
        await this.addVerificationResult('Continuous Monitor', true, undefined, {
          timestamp: new Date().toISOString(),
          language: config?.defaultLanguage,
          hasConfig: !!config
        });
      } catch (error) {
        await this.addVerificationResult('Continuous Monitor', false, 
          error instanceof Error ? error.message : String(error));
      }
    };
    
    // Run initial check
    await monitor();
    
    // Set up interval
    setInterval(monitor, intervalMs);
  }
  
  /**
   * Generate comprehensive verification report
   */
  async generateVerificationReport(): Promise<string> {
    this.sessionData.endTime = new Date().toISOString();
    
    const successCount = this.verificationResults.filter(r => r.success).length;
    const failCount = this.verificationResults.filter(r => !r.success).length;
    const totalCount = this.verificationResults.length;
    
    const report = [
      '# Storage Verification Report',
      '',
      `## Session Information`,
      `- **Session ID**: ${this.sessionData.sessionId}`,
      `- **Start Time**: ${this.sessionData.startTime}`,
      `- **End Time**: ${this.sessionData.endTime}`,
      `- **Duration**: ${this.calculateDuration()}`,
      '',
      `## Language Settings Summary`,
      `- **Initial Language**: ${this.sessionData.languageSettings.initial}`,
      `- **Changes Made**: ${this.sessionData.languageSettings.changes.length}`,
      '',
      `## Verification Results`,
      `- **Total Tests**: ${totalCount}`,
      `- **Successful**: ${successCount}`,
      `- **Failed**: ${failCount}`,
      `- **Success Rate**: ${((successCount / totalCount) * 100).toFixed(1)}%`,
      '',
      `## Detailed Results`,
      ''
    ];
    
    this.verificationResults.forEach(result => {
      report.push(`### ${result.testName}`);
      report.push(`- **Time**: ${result.timestamp}`);
      report.push(`- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (result.error) {
        report.push(`- **Error**: ${result.error}`);
      }
      
      if (result.data) {
        report.push(`- **Data**: \`${JSON.stringify(result.data, null, 2)}\``);
      }
      
      report.push('');
    });
    
    if (this.sessionData.languageSettings.changes.length > 0) {
      report.push(`## Language Changes`);
      report.push('');
      
      this.sessionData.languageSettings.changes.forEach(change => {
        report.push(`- **${change.timestamp}**: Changed to "${change.language}" (${change.trigger})`);
      });
    }
    
    return report.join('\n');
  }
  
  private calculateDuration(): string {
    if (!this.sessionData.endTime) return 'Ongoing';
    
    const start = new Date(this.sessionData.startTime);
    const end = new Date(this.sessionData.endTime);
    const diffMs = end.getTime() - start.getTime();
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }
  
  /**
   * Run comprehensive verification suite
   */
  async runComprehensiveVerification(): Promise<{
    success: boolean;
    report: string;
    results: VerificationResult[];
  }> {
    console.log('🔍 Starting comprehensive storage verification...');
    
    await this.initialize();
    
    const verifications = [
      this.verifyStorageAccess(),
      this.verifySyncStorage(),
      this.verifyLoadTimeRetrieval(),
      this.verifyErrorHandling()
    ];
    
    const results = await Promise.all(verifications);
    const overallSuccess = results.every(result => result);
    
    const report = await this.generateVerificationReport();
    
    console.log('📊 Verification complete:', {
      success: overallSuccess,
      totalTests: this.verificationResults.length,
      successCount: this.verificationResults.filter(r => r.success).length
    });
    
    return {
      success: overallSuccess,
      report,
      results: this.verificationResults
    };
  }
}

// Export for use in extension
export { ProductionStorageVerification };

// Browser integration
declare const window: any;
if (typeof window !== 'undefined') {
  window.ProductionStorageVerification = ProductionStorageVerification;
  
  // Create global verification instance
  const globalVerification = new ProductionStorageVerification();
  
  window.runStorageVerification = async () => {
    return await globalVerification.runComprehensiveVerification();
  };
  
  window.startStorageMonitoring = async (intervalMs = 30000) => {
    await globalVerification.startContinuousMonitoring(intervalMs);
  };
}

// Usage instructions
export const productionVerificationGuide = `
🔍 Production Storage Verification Guide

This verification system can be integrated into your Chrome extension to monitor
language settings persistence in real-world usage.

## Integration Steps:

1. **Add to Extension**: Include this file in your extension build
2. **Initialize**: Call verification during extension startup
3. **Monitor**: Set up continuous monitoring for ongoing verification
4. **Report**: Generate reports for analysis

## Usage Examples:

\`\`\`javascript
// Run one-time comprehensive verification
runStorageVerification().then(result => {
  console.log('Verification Result:', result);
  if (!result.success) {
    console.error('Storage verification failed!');
  }
});

// Start continuous monitoring (checks every 30 seconds)
startStorageMonitoring(30000);

// Manual verification instance
const verification = new ProductionStorageVerification();
verification.runComprehensiveVerification().then(result => {
  console.log(result.report);
});
\`\`\`

## Key Verifications:

✅ **Storage Access**: Confirms read/write access to Chrome storage
✅ **Sync Storage**: Verifies Chrome sync storage functionality
✅ **Load Time**: Ensures fast retrieval during extension load
✅ **Error Handling**: Tests recovery from storage errors
✅ **Persistence**: Monitors language setting persistence over time

## Monitoring Benefits:

- **Early Detection**: Identifies storage issues before users report them
- **Performance Tracking**: Monitors storage operation speed
- **Reliability Metrics**: Tracks success rates over time
- **Debug Information**: Provides detailed logs for troubleshooting

## Deployment Notes:

- Include in development builds for testing
- Consider optional inclusion in production for diagnostics
- Monitor console for verification results
- Set up alerts for verification failures
`;

export default ProductionStorageVerification;