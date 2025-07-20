export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderModels {
  [key: string]: ModelInfo[];
}

export const OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest and most capable model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance model' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning model' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
];

export const ANTHROPIC_MODELS: ModelInfo[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)', description: 'Most capable Claude model' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Latest)', description: 'Fast and efficient' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Highest intelligence model' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and lightweight' },
];

export const GOOGLE_MODELS: ModelInfo[] = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable Gemini model' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Reliable and stable' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'General purpose model' },
];

export const PROVIDER_MODELS: ProviderModels = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
};

export const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-3-sonnet-20240229',
  google: 'gemini-pro',
};

export function getModelsForProvider(provider: string): ModelInfo[] {
  return PROVIDER_MODELS[provider] || [];
}

export function getDefaultModelForProvider(provider: string): string {
  return DEFAULT_MODELS[provider] || '';
}

export function isValidModelForProvider(provider: string, modelId: string): boolean {
  const models = getModelsForProvider(provider);
  return models.some(model => model.id === modelId);
}