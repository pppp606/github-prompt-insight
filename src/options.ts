import { getModelsForProvider, getDefaultModelForProvider, ModelInfo } from './models';

interface ExtensionConfig {
  llmProvider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
  defaultLanguage: string;
}

class OptionsManager {
  private form: HTMLFormElement;
  private providerSelect: HTMLSelectElement;
  private apiKeyInput: HTMLInputElement;
  private modelSelect: HTMLSelectElement;
  private modelSection: HTMLElement;
  private modelHelp: HTMLElement;
  private defaultLanguageInput: HTMLInputElement;
  private statusDiv: HTMLElement;

  constructor() {
    this.form = document.getElementById('settingsForm') as HTMLFormElement;
    this.providerSelect = document.getElementById('llmProvider') as HTMLSelectElement;
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.modelSelect = document.getElementById('model') as HTMLSelectElement;
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
    const provider = this.providerSelect.value as 'openai' | 'anthropic' | 'google';
    
    if (provider) {
      this.modelSection.style.display = 'block';
      this.populateModelOptions(provider);
      this.updateModelHelp(provider);
    } else {
      this.modelSection.style.display = 'none';
    }
  }

  private populateModelOptions(provider: 'openai' | 'anthropic' | 'google'): void {
    this.modelSelect.innerHTML = '';
    
    const defaultModel = getDefaultModelForProvider(provider);
    const models = getModelsForProvider(provider);
    
    models.forEach((model: ModelInfo) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name + (model.description ? ` - ${model.description}` : '');
      if (model.id === defaultModel) {
        option.textContent += ' (Default)';
      }
      this.modelSelect.appendChild(option);
    });
  }

  private updateModelHelp(provider: 'openai' | 'anthropic' | 'google'): void {
    const defaultModel = getDefaultModelForProvider(provider);
    this.modelHelp.textContent = `Default: ${defaultModel}`;
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const config: ExtensionConfig = {
      llmProvider: this.providerSelect.value as 'openai' | 'anthropic' | 'google',
      apiKey: this.apiKeyInput.value,
      model: this.modelSelect.value || undefined,
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
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          action: 'set_storage', 
          key: 'extensionConfig',
          value: config
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response.success) {
            resolve();
          } else {
            reject(new Error('Failed to save settings'));
          }
        }
      );
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const config = await this.getStoredSettings();
      if (config) {
        this.providerSelect.value = config.llmProvider;
        this.apiKeyInput.value = config.apiKey;
        if (config.model) {
          this.modelSelect.value = config.model;
        }
        this.defaultLanguageInput.value = config.defaultLanguage;
        this.handleProviderChange();
      }
    } catch (error) {
      this.showStatus(`Error loading settings: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  private async getStoredSettings(): Promise<ExtensionConfig | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'get_storage', key: 'extensionConfig' },
        (response) => {
          resolve(response.extensionConfig || null);
        }
      );
    });
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