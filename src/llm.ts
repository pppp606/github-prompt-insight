import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage } from "langchain/schema";

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
    try {
      const response = await this.llm.call([
        {
          role: "user",
          content: prompt,
        } as BaseMessage,
      ]);

      return {
        content: response.content as string,
        provider: this.config.provider,
        model: this.getModelName(),
        usage: this.extractUsage(response),
      };
    } catch (error) {
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<LLMResponse> {
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text without any additional explanation or formatting:

${text}`;
    
    return this.generateResponse(prompt);
  }

  async summarizeText(text: string, maxSentences: number = 3): Promise<LLMResponse> {
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