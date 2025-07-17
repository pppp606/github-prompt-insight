/**
 * Storage Persistence Test Suite
 * 
 * This file contains comprehensive tests to verify that language settings
 * persist across browser sessions using Chrome's sync storage API.
 * 
 * Test Categories:
 * 1. Basic Storage Persistence
 * 2. Chrome Sync Storage API Tests
 * 3. Cross-Session Persistence
 * 4. Fallback Behavior
 * 5. Extension Load Time Verification
 * 6. Cross-Device Sync Simulation
 */

import { StorageManager, ExtensionConfig } from '../utils/storage';

// Mock Chrome Storage API for testing
declare global {
  namespace chrome {
    namespace storage {
      interface StorageArea {
        get(keys: string | string[] | object, callback: (result: any) => void): void;
        set(items: object, callback?: () => void): void;
        remove(keys: string | string[], callback?: () => void): void;
        clear(callback?: () => void): void;
      }
      
      var sync: chrome.storage.SyncStorageArea;
      var local: chrome.storage.LocalStorageArea;
    }
    
    namespace runtime {
      var lastError: chrome.runtime.LastError | undefined;
      
      interface LastError {
        message?: string;
      }
      
      function sendMessage(message: any, callback?: (response: any) => void): void;
    }
  }
}

class ChromeStorageMock {
  private syncStorage: Map<string, any> = new Map();
  private localStorage: Map<string, any> = new Map();
  private lastError: chrome.runtime.LastError | undefined;
  
  // Simulate Chrome sync storage
  sync = {
    get: (keys: string | string[] | object, callback: (result: any) => void) => {
      setTimeout(() => {
        if (this.lastError) {
          callback({});
          return;
        }
        
        const result: any = {};
        if (typeof keys === 'string') {
          if (this.syncStorage.has(keys)) {
            result[keys] = this.syncStorage.get(keys);
          }
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (this.syncStorage.has(key)) {
              result[key] = this.syncStorage.get(key);
            }
          });
        }
        callback(result);
      }, 10); // Simulate async behavior
    },
    
    set: (items: object, callback?: () => void) => {
      setTimeout(() => {
        if (!this.lastError) {
          Object.entries(items).forEach(([key, value]) => {
            this.syncStorage.set(key, value);
          });
        }
        callback?.();
      }, 10);
    },
    
    remove: (keys: string | string[], callback?: () => void) => {
      setTimeout(() => {
        if (!this.lastError) {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          keyArray.forEach(key => this.syncStorage.delete(key));
        }
        callback?.();
      }, 10);
    },
    
    clear: (callback?: () => void) => {
      setTimeout(() => {
        if (!this.lastError) {
          this.syncStorage.clear();
        }
        callback?.();
      }, 10);
    }
  };
  
  // Simulate runtime API
  runtime = {
    get lastError(): chrome.runtime.LastError | undefined { return this.lastError; },
    sendMessage: (message: any, callback?: (response: any) => void) => {
      setTimeout(() => {
        if (message.action === 'get_storage') {
          const result: any = {};
          if (this.syncStorage.has(message.key)) {
            result[message.key] = this.syncStorage.get(message.key);
          }
          callback?.(result);
        } else if (message.action === 'set_storage') {
          this.syncStorage.set(message.key, message.value);
          callback?.({ success: true });
        }
      }, 10);
    }
  };
  
  // Test utilities
  simulateError(message: string) {
    this.lastError = { message };
  }
  
  clearError() {
    this.lastError = undefined;
  }
  
  getStorageContents() {
    return new Map(this.syncStorage);
  }
  
  clearStorage() {
    this.syncStorage.clear();
    this.localStorage.clear();
  }
  
  // Simulate network disconnection (storage unavailable)
  simulateStorageUnavailable() {
    this.sync.get = (_keys: any, callback: any) => {
      this.simulateError('Storage unavailable');
      callback({});
    };
    this.sync.set = (_items: any, callback?: any) => {
      this.simulateError('Storage unavailable');
      callback?.();
    };
  }
  
  restoreStorage() {
    // Restore original methods
    this.clearError();
    // Re-initialize methods (would need to store original implementations)
  }
}

// Test Configuration
const testConfig: ExtensionConfig = {
  llmProvider: 'openai',
  apiKey: 'sk-test-key-123',
  model: 'gpt-4',
  defaultLanguage: 'Japanese',
  temperature: 0.7,
  maxTokens: 2048
};

// const updatedConfig: ExtensionConfig = {
//   ...testConfig,
//   defaultLanguage: 'Spanish',
//   temperature: 0.8
// };

// Test Suite
class StoragePersistenceTests {
  private chromeMock: ChromeStorageMock;
  private storageManager: StorageManager;
  
  constructor() {
    this.chromeMock = new ChromeStorageMock();
    this.storageManager = new StorageManager();
    
    // Mock Chrome APIs
    (global as any).chrome = this.chromeMock;
  }
  
  // Test 1: Basic Storage Persistence
  async testBasicStoragePersistence(): Promise<boolean> {
    console.log('🧪 Testing basic storage persistence...');
    
    try {
      // Store configuration
      await this.storageManager.setConfig(testConfig);
      
      // Retrieve configuration
      const retrieved = await this.storageManager.getConfig();
      
      // Verify persistence
      const isEqual = JSON.stringify(retrieved) === JSON.stringify(testConfig);
      
      console.log(`✅ Basic storage persistence: ${isEqual ? 'PASSED' : 'FAILED'}`);
      return isEqual;
    } catch (error) {
      console.error('❌ Basic storage persistence failed:', error);
      return false;
    }
  }
  
  // Test 2: Language Setting Specific Persistence
  async testLanguageSettingPersistence(): Promise<boolean> {
    console.log('🧪 Testing language setting persistence...');
    
    try {
      // Store config with specific language
      await this.storageManager.setConfig(testConfig);
      
      // Simulate browser restart by creating new storage manager
      const newStorageManager = new StorageManager();
      
      // Retrieve language setting
      const retrievedConfig = await newStorageManager.getConfig();
      const languageMatch = retrievedConfig?.defaultLanguage === testConfig.defaultLanguage;
      
      console.log(`✅ Language setting persistence: ${languageMatch ? 'PASSED' : 'FAILED'}`);
      console.log(`   Expected: ${testConfig.defaultLanguage}, Got: ${retrievedConfig?.defaultLanguage}`);
      
      return languageMatch;
    } catch (error) {
      console.error('❌ Language setting persistence failed:', error);
      return false;
    }
  }
  
  // Test 3: Chrome Sync Storage API Tests
  async testChromeSyncStorageAPI(): Promise<boolean> {
    console.log('🧪 Testing Chrome sync storage API...');
    
    try {
      // Test direct Chrome storage access
      const storageKey = 'extensionConfig';
      
      // Store via Chrome API
      await new Promise<void>((resolve) => {
        this.chromeMock.sync.set({ [storageKey]: testConfig }, () => resolve());
      });
      
      // Retrieve via Chrome API
      const result = await new Promise<any>((resolve) => {
        this.chromeMock.sync.get(storageKey, (result) => resolve(result));
      });
      
      const isStored = JSON.stringify(result[storageKey]) === JSON.stringify(testConfig);
      
      console.log(`✅ Chrome sync storage API: ${isStored ? 'PASSED' : 'FAILED'}`);
      return isStored;
    } catch (error) {
      console.error('❌ Chrome sync storage API failed:', error);
      return false;
    }
  }
  
  // Test 4: Cross-Session Persistence Simulation
  async testCrossSessionPersistence(): Promise<boolean> {
    console.log('🧪 Testing cross-session persistence...');
    
    try {
      // Session 1: Store configuration
      await this.storageManager.setConfig(testConfig);
      
      // Simulate session end and restart
      // const session1Storage = this.chromeMock.getStorageContents();
      
      // Session 2: New storage manager (simulating extension reload)
      const session2StorageManager = new StorageManager();
      // const retrievedConfig = await session2StorageManager.getConfig();
      
      // Session 3: Update language setting
      await session2StorageManager.updateConfig({ defaultLanguage: 'Spanish' });
      
      // Session 4: Verify updated setting persists
      const session4StorageManager = new StorageManager();
      const finalConfig = await session4StorageManager.getConfig();
      
      const sessionsPersist = finalConfig?.defaultLanguage === 'Spanish' &&
                             finalConfig?.apiKey === testConfig.apiKey;
      
      console.log(`✅ Cross-session persistence: ${sessionsPersist ? 'PASSED' : 'FAILED'}`);
      console.log(`   Final language: ${finalConfig?.defaultLanguage}`);
      
      return sessionsPersist;
    } catch (error) {
      console.error('❌ Cross-session persistence failed:', error);
      return false;
    }
  }
  
  // Test 5: Fallback Behavior When Storage Unavailable
  async testStorageUnavailableFallback(): Promise<boolean> {
    console.log('🧪 Testing fallback behavior when storage unavailable...');
    
    try {
      // First, store a valid configuration
      await this.storageManager.setConfig(testConfig);
      
      // Simulate storage unavailable
      this.chromeMock.simulateStorageUnavailable();
      
      // Try to retrieve configuration
      const retrievedConfig = await this.storageManager.getConfig();
      
      // Should return null when storage is unavailable
      const fallbackWorks = retrievedConfig === null;
      
      console.log(`✅ Storage unavailable fallback: ${fallbackWorks ? 'PASSED' : 'FAILED'}`);
      
      return fallbackWorks;
    } catch (error) {
      console.error('❌ Storage unavailable fallback failed:', error);
      return false;
    }
  }
  
  // Test 6: Extension Load Time Verification
  async testExtensionLoadTimeRetrieval(): Promise<boolean> {
    console.log('🧪 Testing extension load time retrieval...');
    
    try {
      // Store configuration
      await this.storageManager.setConfig(testConfig);
      
      // Simulate extension loading (via runtime message)
      const loadTimeConfig = await this.storageManager.getConfigViaRuntime();
      
      // Verify immediate availability
      const isAvailable = loadTimeConfig !== null &&
                         loadTimeConfig.defaultLanguage === testConfig.defaultLanguage;
      
      console.log(`✅ Extension load time retrieval: ${isAvailable ? 'PASSED' : 'FAILED'}`);
      console.log(`   Retrieved language: ${loadTimeConfig?.defaultLanguage}`);
      
      return isAvailable;
    } catch (error) {
      console.error('❌ Extension load time retrieval failed:', error);
      return false;
    }
  }
  
  // Test 7: Cross-Device Sync Simulation
  async testCrossDeviceSyncSimulation(): Promise<boolean> {
    console.log('🧪 Testing cross-device sync simulation...');
    
    try {
      // Device 1: Store configuration
      const device1Storage = new ChromeStorageMock();
      (global as any).chrome = device1Storage;
      
      const device1Manager = new StorageManager();
      await device1Manager.setConfig(testConfig);
      
      // Simulate Chrome sync: copy storage to Device 2
      const device1Data = device1Storage.getStorageContents();
      
      const device2Storage = new ChromeStorageMock();
      device1Data.forEach((value, key) => {
        device2Storage.sync.set({ [key]: value });
      });
      
      // Device 2: Retrieve synced configuration
      (global as any).chrome = device2Storage;
      const device2Manager = new StorageManager();
      
      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const syncedConfig = await device2Manager.getConfig();
      
      const syncWorks = syncedConfig?.defaultLanguage === testConfig.defaultLanguage &&
                       syncedConfig?.apiKey === testConfig.apiKey;
      
      console.log(`✅ Cross-device sync simulation: ${syncWorks ? 'PASSED' : 'FAILED'}`);
      console.log(`   Synced language: ${syncedConfig?.defaultLanguage}`);
      
      return syncWorks;
    } catch (error) {
      console.error('❌ Cross-device sync simulation failed:', error);
      return false;
    }
  }
  
  // Test 8: Language Setting Update Persistence
  async testLanguageUpdatePersistence(): Promise<boolean> {
    console.log('🧪 Testing language update persistence...');
    
    try {
      // Store initial configuration
      await this.storageManager.setConfig(testConfig);
      
      // Update language setting
      await this.storageManager.updateConfig({ defaultLanguage: 'German' });
      
      // Verify persistence after update
      const updatedConfig = await this.storageManager.getConfig();
      
      const updatePersists = updatedConfig?.defaultLanguage === 'German' &&
                           updatedConfig?.apiKey === testConfig.apiKey;
      
      console.log(`✅ Language update persistence: ${updatePersists ? 'PASSED' : 'FAILED'}`);
      console.log(`   Updated language: ${updatedConfig?.defaultLanguage}`);
      
      return updatePersists;
    } catch (error) {
      console.error('❌ Language update persistence failed:', error);
      return false;
    }
  }
  
  // Test 9: Storage Quota and Limits
  async testStorageQuotaHandling(): Promise<boolean> {
    console.log('🧪 Testing storage quota handling...');
    
    try {
      // Test with valid configuration
      await this.storageManager.setConfig(testConfig);
      
      // Test with large configuration (simulating quota limits)
      const largeConfig: ExtensionConfig = {
        ...testConfig,
        model: 'x'.repeat(1000) // Large model name
      };
      
      // This should handle gracefully
      await this.storageManager.setConfig(largeConfig);
      const retrieved = await this.storageManager.getConfig();
      
      const quotaHandled = retrieved !== null;
      
      console.log(`✅ Storage quota handling: ${quotaHandled ? 'PASSED' : 'FAILED'}`);
      
      return quotaHandled;
    } catch (error) {
      console.error('❌ Storage quota handling failed:', error);
      return false;
    }
  }
  
  // Test 10: Concurrent Access Handling
  async testConcurrentAccess(): Promise<boolean> {
    console.log('🧪 Testing concurrent access handling...');
    
    try {
      // Simulate concurrent operations
      const promises = [
        this.storageManager.setConfig({ ...testConfig, defaultLanguage: 'French' }),
        this.storageManager.setConfig({ ...testConfig, defaultLanguage: 'Italian' }),
        this.storageManager.setConfig({ ...testConfig, defaultLanguage: 'Portuguese' })
      ];
      
      await Promise.all(promises);
      
      // Verify final state is consistent
      const finalConfig = await this.storageManager.getConfig();
      
      const concurrentHandled = finalConfig !== null &&
                              ['French', 'Italian', 'Portuguese'].includes(finalConfig.defaultLanguage);
      
      console.log(`✅ Concurrent access handling: ${concurrentHandled ? 'PASSED' : 'FAILED'}`);
      console.log(`   Final language: ${finalConfig?.defaultLanguage}`);
      
      return concurrentHandled;
    } catch (error) {
      console.error('❌ Concurrent access handling failed:', error);
      return false;
    }
  }
  
  // Run all tests
  async runAllTests(): Promise<{ passed: number; failed: number; total: number }> {
    console.log('🚀 Starting Storage Persistence Test Suite...\n');
    
    const tests = [
      { name: 'Basic Storage Persistence', fn: this.testBasicStoragePersistence },
      { name: 'Language Setting Persistence', fn: this.testLanguageSettingPersistence },
      { name: 'Chrome Sync Storage API', fn: this.testChromeSyncStorageAPI },
      { name: 'Cross-Session Persistence', fn: this.testCrossSessionPersistence },
      { name: 'Storage Unavailable Fallback', fn: this.testStorageUnavailableFallback },
      { name: 'Extension Load Time Retrieval', fn: this.testExtensionLoadTimeRetrieval },
      { name: 'Cross-Device Sync Simulation', fn: this.testCrossDeviceSyncSimulation },
      { name: 'Language Update Persistence', fn: this.testLanguageUpdatePersistence },
      { name: 'Storage Quota Handling', fn: this.testStorageQuotaHandling },
      { name: 'Concurrent Access Handling', fn: this.testConcurrentAccess }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        // Reset storage before each test
        this.chromeMock.clearStorage();
        this.chromeMock.clearError();
        
        const result = await test.fn.call(this);
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ Test "${test.name}" threw an error:`, error);
        failed++;
      }
      
      console.log(''); // Add spacing between tests
    }
    
    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${tests.length}`);
    console.log(`🎯 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    return { passed, failed, total: tests.length };
  }
}

// Export for use in browser testing
export { StoragePersistenceTests, ChromeStorageMock };

// Example usage and manual testing instructions
export const testInstructions = `
📝 Manual Testing Instructions for Language Settings Persistence:

1. **Basic Persistence Test:**
   - Open Chrome extension options page
   - Set default language to "Japanese"
   - Save settings
   - Close and reopen browser
   - Verify language setting is still "Japanese"

2. **Cross-Session Test:**
   - Set language to "Spanish" in options
   - Close browser completely
   - Reopen browser and check extension options
   - Language should still be "Spanish"

3. **Extension Reload Test:**
   - Set language to "French"
   - Go to chrome://extensions/
   - Click "Reload" on the extension
   - Check if language is still "French"

4. **Device Sync Test (requires Chrome sync):**
   - Set language to "German" on Device 1
   - Sign in to Chrome sync
   - Open same Chrome profile on Device 2
   - Check if language setting synced to "German"

5. **Fallback Test:**
   - Disable internet connection
   - Try to access language settings
   - Should show last cached settings or defaults

6. **Storage Quota Test:**
   - Set multiple configurations quickly
   - Verify all changes persist correctly
   - No data loss should occur

🔧 For automated testing, run: new StoragePersistenceTests().runAllTests()
`;