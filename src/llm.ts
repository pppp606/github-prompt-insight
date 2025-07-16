import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type LLMProvider = "openai" | "anthropic" | "google";

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

export class LLMWrapper {
  private config: LLMConfig;
  private llm: ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // 1 second between requests

  constructor(config: LLMConfig) {
    this.config = config;
    this.llm = this.createLLM(config);
  }

  private createLLM(config: LLMConfig): ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI {
    switch (config.provider) {
      case "openai":
        return new ChatOpenAI({
          openAIApiKey: config.apiKey,
          modelName: config.model || "gpt-3.5-turbo",
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2048,
        });
      
      case "anthropic":
        return new ChatAnthropic({
          anthropicApiKey: config.apiKey,
          modelName: config.model || "claude-3-sonnet-20240229",
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2048,
        });
      
      case "google":
        return new ChatGoogleGenerativeAI({
          apiKey: config.apiKey,
          modelName: config.model || "gemini-pro",
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 2048,
        });
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    // Rate limiting
    await this.enforceRateLimit();
    
    // Input validation
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (prompt.length > 50000) {
      throw new Error('Prompt is too long (max 50,000 characters)');
    }

    try {
      const response = await this.llm.invoke([prompt]);

      if (!response || !response.content) {
        throw new Error('Empty response from LLM');
      }

      return {
        content: response.content as string,
        provider: this.config.provider,
        model: this.getModelName(),
        usage: this.extractUsage(response),
      };
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific API errors
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your configuration.');
        }
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your billing.');
        }
        throw new Error(`LLM generation failed: ${error.message}`);
      }
      throw new Error(`LLM generation failed: ${String(error)}`);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async translateText(text: string, targetLanguage: string): Promise<LLMResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }
    
    if (!targetLanguage || targetLanguage.trim().length === 0) {
      throw new Error('Target language must be specified');
    }

    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text without any additional explanation or formatting:

${text}`;
    
    return this.generateResponse(prompt);
  }

  async summarizeText(text: string, maxSentences: number = 2): Promise<LLMResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    if (maxSentences < 1 || maxSentences > 10) {
      throw new Error('Number of sentences must be between 1 and 10');
    }

    const prompt = `Summarize the following text in ${maxSentences} sentences or less. Be concise and capture the main points:

${text}`;
    
    return this.generateResponse(prompt);
  }

  private getModelName(): string {
    switch (this.config.provider) {
      case "openai":
        return this.config.model || "gpt-3.5-turbo";
      case "anthropic":
        return this.config.model || "claude-3-sonnet-20240229";
      case "google":
        return this.config.model || "gemini-pro";
      default:
        return "unknown";
    }
  }

  private extractUsage(response: any): { promptTokens: number; completionTokens: number; totalTokens: number } | undefined {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }
    return undefined;
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.llm = this.createLLM(this.config);
  }
}

export async function createLLMWrapper(config: LLMConfig): Promise<LLMWrapper> {
  return new LLMWrapper(config);
}