import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getDefaultModelForProvider } from "./models";

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
          modelName: config.model || getDefaultModelForProvider("openai"),
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 8192,
        });
      
      case "anthropic":
        return new ChatAnthropic({
          anthropicApiKey: config.apiKey,
          modelName: config.model || getDefaultModelForProvider("anthropic"),
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 8192,
        });
      
      case "google":
        return new ChatGoogleGenerativeAI({
          apiKey: config.apiKey,
          modelName: config.model || getDefaultModelForProvider("google"),
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 8192,
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

  async summarizeText(text: string, maxSentences: number = 2, language?: string): Promise<LLMResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    if (maxSentences < 1 || maxSentences > 10) {
      throw new Error('Number of sentences must be between 1 and 10');
    }

    // Default to English if no language is specified or if language is empty/whitespace
    const targetLanguage = language && language.trim().length > 0 ? language.trim() : 'English';

    const prompt = `
You are a prompt analysis expert. Your task is to help humans understand the structure, intent, and design of any given prompt — regardless of its format, style, or purpose.
The prompt may be a plain instruction, a dialogue turn, a system prompt for an AI agent, a code-generating directive, or anything else.
Please analyze the given prompt according to the following structure. Return your output in clearly structured Markdown, using numbered or bulleted lists for readability. Avoid long paragraphs.

---

### Output Format (Markdown):

#### 1. Purpose
- What is the goal of this prompt?
- What task is the AI expected to complete?
- Is the prompt intended for a human-facing response, internal processing, or agent execution?

#### 2. Internal Structure and Information Flow
- What internal components or modules does the prompt define or rely on?
  (e.g., agent state, file system, browser state, memory, user request, history)
- How is information passed into the system (input types, state descriptions)?
- How is information expected to be maintained, updated, or reasoned about across steps?
- Are there distinct stages/phases (e.g., planning → acting → reporting)?
- Does the prompt define a loop, single-shot task, multi-turn conversation, or another control flow?

#### 3. Behavioral Instructions or Constraints
- Are there rules or priorities the AI is instructed to follow?
- Are there forbidden actions or behaviors?
- Is reasoning style or planning methodology specified?

---

### Output Requirements:
- Use **clear bullet points or numbered lists** under each section.
- Keep the output concise and human-readable.
- Target audience: software engineers. Use precise, technical language and structure your output accordingly.
- Output language: ${targetLanguage}

---

Text to analyze:
${text}`;
    
    return this.generateResponse(prompt);
  }

  private getModelName(): string {
    return this.config.model || getDefaultModelForProvider(this.config.provider) || "unknown";
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