/**
 * Storage management utilities for Chrome extension configuration
 */

export interface ExtensionConfig {
  llmProvider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
  defaultLanguage: string;
  temperature?: number;
  maxTokens?: number;
}

const STORAGE_KEY = 'extensionConfig';
const SUPPORTED_LANGUAGES = [
  'English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese', 'Korean', 'Italian', 'Portuguese', 'Russian'
];

export class StorageManager {
  /**
   * Get configuration from Chrome storage
   */
  async getConfig(): Promise<ExtensionConfig | null> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(STORAGE_KEY, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          const config = result[STORAGE_KEY];
          resolve(config || null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set configuration in Chrome storage
   */
  async setConfig(config: ExtensionConfig): Promise<void> {
    this.validateConfig(config);
    
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set({ [STORAGE_KEY]: config }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Update partial configuration
   */
  async updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates } as ExtensionConfig;
    
    await this.setConfig(newConfig);
  }

  /**
   * Clear configuration from storage
   */
  async clearConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.remove(STORAGE_KEY, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get API key from configuration
   */
  async getApiKey(): Promise<string | null> {
    const config = await this.getConfig();
    return config?.apiKey || null;
  }

  /**
   * Get configuration via chrome.runtime.sendMessage (for content scripts)
   */
  async getConfigViaRuntime(): Promise<ExtensionConfig | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'get_storage', key: STORAGE_KEY },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            resolve(null);
            return;
          }
          
          const config = response[STORAGE_KEY];
          resolve(config || null);
        }
      );
    });
  }

  /**
   * Set configuration via chrome.runtime.sendMessage (for content scripts)
   */
  async setConfigViaRuntime(config: ExtensionConfig): Promise<boolean> {
    this.validateConfig(config);
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { 
          action: 'set_storage', 
          key: STORAGE_KEY,
          value: config,
        },
        (response) => {
          if (chrome.runtime.lastError || !response?.success) {
            resolve(false);
            return;
          }
          resolve(true);
        }
      );
    });
  }

  /**
   * Validate configuration object
   */
  validateConfig(config: ExtensionConfig): void {
    if (!config) {
      throw new Error('Configuration is required');
    }

    if (!config.llmProvider) {
      throw new Error('LLM provider is required');
    }

    if (!['openai', 'anthropic', 'google'].includes(config.llmProvider)) {
      throw new Error(`Invalid LLM provider: ${config.llmProvider}`);
    }

    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    // Validate API key format for specific providers
    if (config.llmProvider === 'openai' && !config.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format (should start with "sk-")');
    }

    if (!config.defaultLanguage) {
      throw new Error('Default language is required');
    }

    if (!SUPPORTED_LANGUAGES.includes(config.defaultLanguage)) {
      throw new Error(`Unsupported language: ${config.defaultLanguage}`);
    }

    // Validate optional numeric parameters
    if (config.temperature !== undefined) {
      if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
        throw new Error('Temperature must be a number between 0 and 2');
      }
    }

    if (config.maxTokens !== undefined) {
      if (typeof config.maxTokens !== 'number' || config.maxTokens < 1 || config.maxTokens > 4096) {
        throw new Error('Max tokens must be a number between 1 and 4096');
      }
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): Partial<ExtensionConfig> {
    return {
      llmProvider: 'openai',
      defaultLanguage: 'Japanese',
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  /**
   * Check if configuration is complete and valid
   */
  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config) return false;
      
      this.validateConfig(config);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get supported languages list
   */
  getSupportedLanguages(): string[] {
    return [...SUPPORTED_LANGUAGES];
  }
}

// Singleton instance
const storageManager = new StorageManager();

// Helper functions for easier usage
export async function getConfig(): Promise<ExtensionConfig | null> {
  return storageManager.getConfig();
}

export async function setConfig(config: ExtensionConfig): Promise<void> {
  return storageManager.setConfig(config);
}

export async function updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
  return storageManager.updateConfig(updates);
}

export async function clearConfig(): Promise<void> {
  return storageManager.clearConfig();
}

export async function getApiKey(): Promise<string | null> {
  return storageManager.getApiKey();
}

export async function isConfigured(): Promise<boolean> {
  return storageManager.isConfigured();
}

export function getSupportedLanguages(): string[] {
  return storageManager.getSupportedLanguages();
}

export { storageManager };
export default StorageManager;