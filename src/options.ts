import { StorageManager } from '@/utils';
import { LLMProvider, ChromeStorageData } from '@/types';

interface ExtensionConfig {
  llmProvider: LLMProvider;
  apiKey: string;
  model?: string;
  defaultLanguage: string;
}

class OptionsManager {
  private form: HTMLFormElement;
  private providerSelect: HTMLSelectElement;
  private apiKeyInput: HTMLInputElement;
  private modelInput: HTMLInputElement;
  private modelSection: HTMLElement;
  private modelHelp: HTMLElement;
  private defaultLanguageInput: HTMLInputElement;
  private statusDiv: HTMLElement;

  constructor() {
    this.form = document.getElementById('settingsForm') as HTMLFormElement;
    this.providerSelect = document.getElementById('llmProvider') as HTMLSelectElement;
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.modelInput = document.getElementById('model') as HTMLInputElement;
    this.modelSection = document.getElementById('modelSection') as HTMLElement;
    this.modelHelp = document.getElementById('modelHelp') as HTMLElement;
    this.defaultLanguageInput = document.getElementById('defaultLanguage') as HTMLInputElement;
    this.statusDiv = document.getElementById('status') as HTMLElement;

    this.setupEventListeners();
    this.loadSettings();
  }

  private setupEventListeners(): void {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.providerSelect.addEventListener('change', () => this.handleProviderChange());
  }

  private handleProviderChange(): void {
    const provider = this.providerSelect.value as LLMProvider;
    
    if (provider) {
      this.modelSection.style.display = 'block';
      this.updateModelHelp(provider);
    } else {
      this.modelSection.style.display = 'none';
    }
  }

  private updateModelHelp(provider: LLMProvider): void {
    const modelInfo = {
      openai: 'Default: gpt-3.5-turbo (e.g., gpt-4, gpt-3.5-turbo)',
      anthropic: 'Default: claude-3-sonnet-20240229 (e.g., claude-3-opus-20240229, claude-3-haiku-20240307)',
      google: 'Default: gemini-pro (e.g., gemini-1.5-pro, gemini-1.0-pro)',
    };

    this.modelHelp.textContent = modelInfo[provider];
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const config: ExtensionConfig = {
      llmProvider: this.providerSelect.value as LLMProvider,
      apiKey: this.apiKeyInput.value,
      model: this.modelInput.value || undefined,
      defaultLanguage: this.defaultLanguageInput.value,
    };

    try {
      await this.saveSettings(config);
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus(`Error saving settings: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  private async saveSettings(config: ExtensionConfig): Promise<void> {
    const storageData: ChromeStorageData = {
      selectedProvider: config.llmProvider,
      [`${config.llmProvider}ApiKey`]: config.apiKey,
      userPreferences: {
        theme: 'auto',
        language: config.defaultLanguage,
        autoTranslate: false,
        showSummary: true,
      },
    };

    // Store API key in the appropriate field
    if (config.llmProvider === 'openai') {
      storageData.openaiApiKey = config.apiKey;
    } else if (config.llmProvider === 'google') {
      storageData.googleApiKey = config.apiKey;
    } else if (config.llmProvider === 'anthropic') {
      storageData.anthropicApiKey = config.apiKey;
    }

    await StorageManager.setMultiple(storageData);
  }

  private async loadSettings(): Promise<void> {
    try {
      const config = await this.getStoredSettings();
      if (config) {
        this.providerSelect.value = config.llmProvider;
        this.apiKeyInput.value = config.apiKey;
        this.modelInput.value = config.model || '';
        this.defaultLanguageInput.value = config.defaultLanguage;
        this.handleProviderChange();
      }
    } catch (error) {
      this.showStatus(`Error loading settings: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  private async getStoredSettings(): Promise<ExtensionConfig | null> {
    const storageData = await StorageManager.getAll();
    
    if (!storageData.selectedProvider) {
      return null;
    }

    const provider = storageData.selectedProvider;
    let apiKey = '';
    
    if (provider === 'openai') {
      apiKey = storageData.openaiApiKey || '';
    } else if (provider === 'google') {
      apiKey = storageData.googleApiKey || '';
    } else if (provider === 'anthropic') {
      apiKey = storageData.anthropicApiKey || '';
    }

    return {
      llmProvider: provider,
      apiKey,
      model: undefined, // Model not stored currently
      defaultLanguage: storageData.userPreferences?.language || 'Japanese',
    };
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    this.statusDiv.style.display = 'block';
    
    setTimeout(() => {
      this.statusDiv.style.display = 'none';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});

export {};