// Chrome Extension Types
export interface ChromeStorageData {
  openaiApiKey?: string;
  googleApiKey?: string;
  anthropicApiKey?: string;
  selectedProvider?: LLMProvider;
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  autoTranslate: boolean;
  showSummary: boolean;
}

// LLM Provider Types
export type LLMProvider = 'openai' | 'google' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// GitHub Types
export interface GitHubContext {
  repository: string;
  owner: string;
  path: string;
  branch: string;
  fileContent?: string;
  language?: string;
}

// Message Types for Extension Communication
export interface ExtensionMessage {
  type: string;
  payload?: any;
}

export interface TranslateRequest extends ExtensionMessage {
  type: 'translate';
  payload: {
    text: string;
    targetLanguage: string;
    context?: GitHubContext;
  };
}

export interface SummaryRequest extends ExtensionMessage {
  type: 'summary';
  payload: {
    text: string;
    context?: GitHubContext;
  };
}

export interface ConfigUpdateRequest extends ExtensionMessage {
  type: 'config_update';
  payload: {
    config: Partial<ChromeStorageData>;
  };
}

// Error Types
export interface ExtensionError {
  code: string;
  message: string;
  details?: any;
}

// UI Types
export interface UIState {
  isLoading: boolean;
  error?: ExtensionError;
  activeTab: 'translate' | 'summary' | 'settings';
}

// Export all message types
export type ExtensionMessageType = 
  | TranslateRequest
  | SummaryRequest
  | ConfigUpdateRequest;