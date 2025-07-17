/**
 * Language Persistence Test Suite
 * 
 * This is the main test runner that combines all language settings persistence tests
 * into a unified testing interface. It provides comprehensive verification of language
 * settings persistence across browser sessions, devices, and various scenarios.
 */

import { StoragePersistenceTests } from './storage-persistence.test';
import { BrowserStorageTests } from './browser-storage-tests';
import { ProductionStorageVerification } from './production-storage-verification';
import { StorageFallbackTests } from './storage-fallback-tests';
import { ExtensionInitializationTests } from './extension-initialization-tests';
import { CrossDeviceSyncTests } from './cross-device-sync-tests';

interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  results: any[];
  error?: string;
}

interface ComprehensiveTestResults {
  suites: TestSuiteResult[];
  overallSummary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    overallSuccessRate: number;
    totalDuration: number;
  };
  recommendations: string[];
  issues: string[];
}

class LanguagePersistenceTestSuite {
  private testResults: TestSuiteResult[] = [];
  private startTime: number = 0;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  private async runTestSuite<T>(
    suiteName: string,
    testClass: new () => T,
    testMethod: (instance: T) => Promise<any>
  ): Promise<TestSuiteResult> {
    console.log(`\n🧪 Running ${suiteName}...`);
    const suiteStartTime = performance.now();
    
    try {
      const instance = new testClass();
      const results = await testMethod(instance);
      
      const suiteEndTime = performance.now();
      const duration = suiteEndTime - suiteStartTime;
      
      const passed = results.passed || results.summary?.passed || 0;
      const failed = results.failed || results.summary?.failed || 0;
      const total = results.total || results.summary?.total || passed + failed;
      
      const result: TestSuiteResult = {
        suiteName,
        passed,
        failed,
        total,
        duration,
        results: results.results || results
      };
      
      console.log(`✅ ${suiteName} completed: ${passed}/${total} passed (${duration.toFixed(2)}ms)`);
      
      this.testResults.push(result);
      return result;
      
    } catch (error) {
      const suiteEndTime = performance.now();
      const duration = suiteEndTime - suiteStartTime;
      
      const result: TestSuiteResult = {
        suiteName,
        passed: 0,
        failed: 1,
        total: 1,
        duration,
        results: [],
        error: error instanceof Error ? error.message : String(error)
      };
      
      console.error(`❌ ${suiteName} failed: ${result.error}`);
      
      this.testResults.push(result);
      return result;
    }
  }
  
  /**
   * Run all language persistence tests
   */
  async runAllTests(): Promise<ComprehensiveTestResults> {
    console.log('🚀 Starting Comprehensive Language Persistence Test Suite');
    console.log('=' .repeat(80));
    
    // Run all test suites
    await this.runTestSuite(
      'Storage Persistence Tests',
      StoragePersistenceTests,
      (instance) => instance.runAllTests()
    );
    
    await this.runTestSuite(
      'Browser Storage Tests',
      BrowserStorageTests,
      (instance) => instance.runAllTests()
    );
    
    await this.runTestSuite(
      'Production Storage Verification',
      ProductionStorageVerification,
      (instance) => instance.runComprehensiveVerification()
    );
    
    await this.runTestSuite(
      'Storage Fallback Tests',
      StorageFallbackTests,
      (instance) => instance.runAllFallbackTests()
    );
    
    await this.runTestSuite(
      'Extension Initialization Tests',
      ExtensionInitializationTests,
      (instance) => instance.runAllInitializationTests()
    );
    
    await this.runTestSuite(
      'Cross-Device Sync Tests',
      CrossDeviceSyncTests,
      (instance) => instance.runAllSyncTests()
    );
    
    return this.generateComprehensiveResults();
  }
  
  /**
   * Run essential tests only (faster execution)
   */
  async runEssentialTests(): Promise<ComprehensiveTestResults> {
    console.log('⚡ Starting Essential Language Persistence Tests');
    console.log('=' .repeat(80));
    
    // Run only critical test suites
    await this.runTestSuite(
      'Browser Storage Tests',
      BrowserStorageTests,
      (instance) => instance.runSessionPersistenceTests()
    );
    
    await this.runTestSuite(
      'Extension Initialization Tests',
      ExtensionInitializationTests,
      (instance) => instance.runAllInitializationTests()
    );
    
    await this.runTestSuite(
      'Storage Fallback Tests',
      StorageFallbackTests,
      (instance) => instance.runAllFallbackTests()
    );
    
    return this.generateComprehensiveResults();
  }
  
  /**
   * Run production verification tests
   */
  async runProductionTests(): Promise<ComprehensiveTestResults> {
    console.log('🔍 Starting Production Language Persistence Verification');
    console.log('=' .repeat(80));
    
    await this.runTestSuite(
      'Production Storage Verification',
      ProductionStorageVerification,
      (instance) => instance.runComprehensiveVerification()
    );
    
    await this.runTestSuite(
      'Extension Initialization Tests',
      ExtensionInitializationTests,
      (instance) => instance.runAllInitializationTests()
    );
    
    return this.generateComprehensiveResults();
  }
  
  /**
   * Generate comprehensive test results
   */
  private generateComprehensiveResults(): ComprehensiveTestResults {
    const endTime = performance.now();
    const totalDuration = endTime - this.startTime;
    
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failed, 0);
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    const recommendations = this.generateRecommendations();
    const issues = this.identifyIssues();
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('=' .repeat(80));
    console.log(`📈 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`🎯 Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`⏱️ Total Duration: ${totalDuration.toFixed(2)}ms`);
    
    // Suite breakdown
    console.log('\n📋 Suite Breakdown:');
    this.testResults.forEach(suite => {
      const successRate = suite.total > 0 ? (suite.passed / suite.total) * 100 : 0;
      console.log(`  ${suite.suiteName}: ${suite.passed}/${suite.total} (${successRate.toFixed(1)}%)`);
    });
    
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Identified:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    return {
      suites: this.testResults,
      overallSummary: {
        totalTests,
        totalPassed,
        totalFailed,
        overallSuccessRate,
        totalDuration
      },
      recommendations,
      issues
    };
  }
  
  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check overall success rate
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    if (overallSuccessRate < 90) {
      recommendations.push('Overall success rate is below 90%. Review failed tests and improve storage reliability.');
    }
    
    // Check initialization performance
    const initSuite = this.testResults.find(suite => suite.suiteName.includes('Initialization'));
    if (initSuite && initSuite.failed > 0) {
      recommendations.push('Initialization tests failed. Ensure language settings are available immediately on extension load.');
    }
    
    // Check fallback behavior
    const fallbackSuite = this.testResults.find(suite => suite.suiteName.includes('Fallback'));
    if (fallbackSuite && fallbackSuite.failed > 0) {
      recommendations.push('Fallback tests failed. Improve error handling when storage is unavailable.');
    }
    
    // Check sync functionality
    const syncSuite = this.testResults.find(suite => suite.suiteName.includes('Sync'));
    if (syncSuite && syncSuite.failed > 0) {
      recommendations.push('Sync tests failed. Verify Chrome sync storage implementation.');
    }
    
    // Performance recommendations
    const totalDuration = this.testResults.reduce((sum, suite) => sum + suite.duration, 0);
    if (totalDuration > 5000) {
      recommendations.push('Test suite took over 5 seconds. Consider optimizing storage operations.');
    }
    
    return recommendations;
  }
  
  /**
   * Identify critical issues
   */
  private identifyIssues(): string[] {
    const issues: string[] = [];
    
    // Check for suite failures
    this.testResults.forEach(suite => {
      if (suite.error) {
        issues.push(`${suite.suiteName} encountered an error: ${suite.error}`);
      }
      
      if (suite.failed > suite.passed) {
        issues.push(`${suite.suiteName} has more failures (${suite.failed}) than passes (${suite.passed})`);
      }
    });
    
    // Check for critical functionality failures
    const criticalSuites = ['Browser Storage Tests', 'Extension Initialization Tests'];
    criticalSuites.forEach(suiteName => {
      const suite = this.testResults.find(s => s.suiteName === suiteName);
      if (suite && suite.failed > 0) {
        issues.push(`Critical suite "${suiteName}" has failures that may impact core functionality`);
      }
    });
    
    return issues;
  }
  
  /**
   * Generate detailed report
   */
  generateDetailedReport(): string {
    const lines = [
      '# Language Persistence Test Suite Report',
      '',
      `**Generated**: ${new Date().toISOString()}`,
      `**Duration**: ${this.testResults.reduce((sum, suite) => sum + suite.duration, 0).toFixed(2)}ms`,
      '',
      '## Executive Summary',
      ''
    ];
    
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failed, 0);
    const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
    
    lines.push(`- **Total Tests**: ${totalTests}`);
    lines.push(`- **Passed**: ${totalPassed}`);
    lines.push(`- **Failed**: ${totalFailed}`);
    lines.push(`- **Success Rate**: ${overallSuccessRate.toFixed(1)}%`);
    lines.push('');
    
    // Suite details
    lines.push('## Test Suite Results');
    lines.push('');
    
    this.testResults.forEach(suite => {
      lines.push(`### ${suite.suiteName}`);
      lines.push(`- **Status**: ${suite.failed === 0 ? '✅ PASSED' : '❌ FAILED'}`);
      lines.push(`- **Results**: ${suite.passed}/${suite.total} passed`);
      lines.push(`- **Duration**: ${suite.duration.toFixed(2)}ms`);
      
      if (suite.error) {
        lines.push(`- **Error**: ${suite.error}`);
      }
      
      lines.push('');
    });
    
    // Recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      recommendations.forEach(rec => lines.push(`- ${rec}`));
      lines.push('');
    }
    
    // Issues
    const issues = this.identifyIssues();
    if (issues.length > 0) {
      lines.push('## Issues');
      lines.push('');
      issues.forEach(issue => lines.push(`- ${issue}`));
      lines.push('');
    }
    
    return lines.join('\n');
  }
}

// Export for testing
export { LanguagePersistenceTestSuite };

// Browser integration
declare const window: any;
if (typeof window !== 'undefined') {
  window.LanguagePersistenceTestSuite = LanguagePersistenceTestSuite;
  
  // Convenience functions
  window.runAllPersistenceTests = async () => {
    const suite = new LanguagePersistenceTestSuite();
    return await suite.runAllTests();
  };
  
  window.runEssentialPersistenceTests = async () => {
    const suite = new LanguagePersistenceTestSuite();
    return await suite.runEssentialTests();
  };
  
  window.runProductionPersistenceTests = async () => {
    const suite = new LanguagePersistenceTestSuite();
    return await suite.runProductionTests();
  };
}

// Usage instructions
export const testSuiteGuide = `
🧪 Language Persistence Test Suite Guide

This comprehensive test suite verifies that language settings persist correctly
across browser sessions, devices, and various scenarios.

## Test Suites Included:

1. **Storage Persistence Tests** - Mock environment tests
2. **Browser Storage Tests** - Real Chrome extension environment tests  
3. **Production Storage Verification** - Production monitoring tests
4. **Storage Fallback Tests** - Error handling and fallback behavior
5. **Extension Initialization Tests** - Load time and availability tests
6. **Cross-Device Sync Tests** - Multi-device synchronization tests

## Running Tests:

### All Tests (Comprehensive):
\`\`\`javascript
const suite = new LanguagePersistenceTestSuite();
const results = await suite.runAllTests();
console.log(results);
\`\`\`

### Essential Tests (Faster):
\`\`\`javascript
const suite = new LanguagePersistenceTestSuite();
const results = await suite.runEssentialTests();
console.log(results);
\`\`\`

### Production Tests:
\`\`\`javascript
const suite = new LanguagePersistenceTestSuite();
const results = await suite.runProductionTests();
console.log(results);
\`\`\`

### Browser Console:
\`\`\`javascript
// Run all tests
runAllPersistenceTests().then(results => {
  console.log('Test Results:', results);
});

// Run essential tests only
runEssentialPersistenceTests().then(results => {
  console.log('Essential Test Results:', results);
});

// Run production verification
runProductionPersistenceTests().then(results => {
  console.log('Production Test Results:', results);
});
\`\`\`

## Key Verification Points:

✅ **Storage Persistence**: Settings survive browser restarts
✅ **Chrome Sync**: Settings sync across devices
✅ **Fast Load**: Settings available immediately on extension load
✅ **Error Handling**: Graceful fallback when storage unavailable
✅ **Data Integrity**: No data loss during storage operations
✅ **Performance**: Storage operations complete within acceptable timeframes

## Success Criteria:

- **Overall Success Rate**: > 90%
- **Initialization Time**: < 100ms
- **Sync Latency**: < 300ms
- **Error Recovery**: < 30 seconds
- **Cross-Device Sync**: < 5 minutes

## Integration:

1. **Development**: Run tests during development
2. **CI/CD**: Include in automated testing pipeline
3. **Production**: Use verification for monitoring
4. **Debugging**: Use detailed reports for troubleshooting

## Report Generation:

\`\`\`javascript
const suite = new LanguagePersistenceTestSuite();
const results = await suite.runAllTests();
const report = suite.generateDetailedReport();
console.log(report);
\`\`\`

This test suite provides comprehensive coverage of language settings persistence
and ensures a reliable user experience across all scenarios.
`;

export default LanguagePersistenceTestSuite;