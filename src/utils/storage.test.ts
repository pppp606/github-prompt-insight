import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { StorageManager, ExtensionConfig, getConfig, setConfig, clearConfig } from './storage';

// Mock chrome storage API
const mockChromeStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
};

Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
    runtime: {
      sendMessage: vi.fn(),
    },
  },
  writable: true,
});

describe('Storage Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StorageManager', () => {
    it('should get configuration from storage', async () => {
      const mockConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        defaultLanguage: 'Japanese',
      };

      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({ [key]: mockConfig });
      });

      const storage = new StorageManager();
      const result = await storage.getConfig();

      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith('extensionConfig');
      expect(result).toEqual(mockConfig);
    });

    it('should return null when no configuration exists', async () => {
      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({});
      });

      const storage = new StorageManager();
      const result = await storage.getConfig();

      expect(result).toBeNull();
    });

    it('should set configuration in storage', async () => {
      const config: ExtensionConfig = {
        llmProvider: 'anthropic',
        apiKey: 'test-anthropic-key',
        model: 'claude-3-sonnet-20240229',
        defaultLanguage: 'Spanish',
      };

      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const storage = new StorageManager();
      await storage.setConfig(config);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { extensionConfig: config },
        expect.any(Function)
      );
    });

    it('should update partial configuration', async () => {
      const existingConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'old-key',
        model: 'gpt-3.5-turbo',
        defaultLanguage: 'Japanese',
      };

      const updates = {
        apiKey: 'new-key',
        model: 'gpt-4',
      };

      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({ [key]: existingConfig });
      });

      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const storage = new StorageManager();
      await storage.updateConfig(updates);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        {
          extensionConfig: {
            ...existingConfig,
            ...updates,
          },
        },
        expect.any(Function)
      );
    });

    it('should handle update when no existing config', async () => {
      const updates = {
        llmProvider: 'google' as const,
        apiKey: 'new-key',
      };

      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({});
      });

      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const storage = new StorageManager();
      await storage.updateConfig(updates);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { extensionConfig: updates },
        expect.any(Function)
      );
    });

    it('should clear configuration from storage', async () => {
      mockChromeStorage.sync.remove.mockImplementation((key, callback) => {
        callback();
      });

      const storage = new StorageManager();
      await storage.clearConfig();

      expect(mockChromeStorage.sync.remove).toHaveBeenCalledWith(
        'extensionConfig',
        expect.any(Function)
      );
    });

    it('should validate configuration before storing', async () => {
      const invalidConfig = {
        llmProvider: 'invalid-provider',
        apiKey: '',
      } as any;

      const storage = new StorageManager();

      await expect(storage.setConfig(invalidConfig)).rejects.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        // Simulate storage error
        throw new Error('Storage access denied');
      });

      const storage = new StorageManager();

      await expect(storage.getConfig()).rejects.toThrow('Storage access denied');
    });

    it('should get stored API key securely', async () => {
      const config: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key-12345',
        defaultLanguage: 'English',
      };

      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({ [key]: config });
      });

      const storage = new StorageManager();
      const apiKey = await storage.getApiKey();

      expect(apiKey).toBe('sk-test-key-12345');
    });

    it('should return null when no API key is stored', async () => {
      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({});
      });

      const storage = new StorageManager();
      const apiKey = await storage.getApiKey();

      expect(apiKey).toBeNull();
    });
  });

  describe('Helper functions', () => {
    it('should get config using helper function', async () => {
      const mockConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'test-key',
        defaultLanguage: 'French',
      };

      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({ [key]: mockConfig });
      });

      const result = await getConfig();
      expect(result).toEqual(mockConfig);
    });

    it('should set config using helper function', async () => {
      const config: ExtensionConfig = {
        llmProvider: 'google',
        apiKey: 'test-google-key',
        defaultLanguage: 'German',
      };

      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await setConfig(config);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { extensionConfig: config },
        expect.any(Function)
      );
    });

    it('should clear config using helper function', async () => {
      mockChromeStorage.sync.remove.mockImplementation((key, callback) => {
        callback();
      });

      await clearConfig();

      expect(mockChromeStorage.sync.remove).toHaveBeenCalledWith(
        'extensionConfig',
        expect.any(Function)
      );
    });
  });

  describe('Configuration validation', () => {
    it('should validate required fields', () => {
      const invalidConfigs = [
        { llmProvider: 'openai' }, // missing apiKey
        { apiKey: 'test-key' }, // missing llmProvider
        { llmProvider: 'invalid', apiKey: 'test-key' }, // invalid provider
        { llmProvider: 'openai', apiKey: '' }, // empty apiKey
      ];

      const storage = new StorageManager();

      invalidConfigs.forEach(config => {
        expect(() => storage.validateConfig(config as any)).toThrow();
      });
    });

    it('should accept valid configurations', () => {
      const validConfigs: ExtensionConfig[] = [
        {
          llmProvider: 'openai',
          apiKey: 'sk-test-key',
          defaultLanguage: 'English',
        },
        {
          llmProvider: 'anthropic',
          apiKey: 'test-anthropic-key',
          model: 'claude-3-opus-20240229',
          defaultLanguage: 'Japanese',
        },
        {
          llmProvider: 'google',
          apiKey: 'test-google-key',
          model: 'gemini-pro',
          defaultLanguage: 'Spanish',
        },
      ];

      const storage = new StorageManager();

      validConfigs.forEach(config => {
        expect(() => storage.validateConfig(config)).not.toThrow();
      });
    });

    it('should validate API key format for different providers', () => {
      const storage = new StorageManager();

      // OpenAI API keys should start with 'sk-'
      expect(() => storage.validateConfig({
        llmProvider: 'openai',
        apiKey: 'invalid-key',
        defaultLanguage: 'English',
      })).toThrow('Invalid OpenAI API key format');

      // Valid OpenAI key
      expect(() => storage.validateConfig({
        llmProvider: 'openai',
        apiKey: 'sk-valid-key-12345',
        defaultLanguage: 'English',
      })).not.toThrow();
    });

    it('should validate default language options', () => {
      const storage = new StorageManager();

      const validLanguages = ['English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese'];
      
      validLanguages.forEach(language => {
        expect(() => storage.validateConfig({
          llmProvider: 'openai',
          apiKey: 'sk-test-key',
          defaultLanguage: language,
        })).not.toThrow();
      });

      expect(() => storage.validateConfig({
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        defaultLanguage: 'InvalidLanguage',
      })).toThrow('Unsupported language');
    });
  });

  describe('Chrome runtime integration', () => {
    it('should use chrome.runtime.sendMessage for storage operations', async () => {
      const mockSendMessage = chrome.runtime.sendMessage as Mock;
      mockSendMessage.mockImplementation((message, callback) => {
        if (message.action === 'get_storage') {
          callback({ extensionConfig: { llmProvider: 'openai', apiKey: 'test-key' } });
        }
      });

      const storage = new StorageManager();
      const result = await storage.getConfigViaRuntime();

      expect(mockSendMessage).toHaveBeenCalledWith(
        { action: 'get_storage', key: 'extensionConfig' },
        expect.any(Function)
      );
    });

    it('should handle runtime message errors', async () => {
      const mockSendMessage = chrome.runtime.sendMessage as Mock;
      mockSendMessage.mockImplementation((message, callback) => {
        // Simulate error
        callback(null);
      });

      const storage = new StorageManager();
      const result = await storage.getConfigViaRuntime();

      expect(result).toBeNull();
    });
  });
});