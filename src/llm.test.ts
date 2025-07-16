import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMWrapper, LLMConfig, LLMProvider, createLLMWrapper } from './llm';

// Mock the LangChain modules
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}));

vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}));

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

describe('LLM Integration', () => {
  let mockLLMResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLLMResponse = {
      content: 'Mock response content',
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75,
      },
    };
  });

  describe('LLMWrapper initialization', () => {
    it('should create OpenAI LLM with correct configuration', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-openai-key',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1000,
      };

      const wrapper = new LLMWrapper(config);
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should create Anthropic LLM with correct configuration', () => {
      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-anthropic-key',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.3,
        maxTokens: 2000,
      };

      const wrapper = new LLMWrapper(config);
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should create Google LLM with correct configuration', () => {
      const config: LLMConfig = {
        provider: 'google',
        apiKey: 'test-google-key',
        model: 'gemini-pro',
        temperature: 0.8,
        maxTokens: 1500,
      };

      const wrapper = new LLMWrapper(config);
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });

    it('should throw error for unsupported provider', () => {
      const config: LLMConfig = {
        provider: 'unsupported' as LLMProvider,
        apiKey: 'test-key',
      };

      expect(() => new LLMWrapper(config)).toThrow('Unsupported provider: unsupported');
    });

    it('should use default values when optional parameters are not provided', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });
  });

  describe('generateResponse', () => {
    it('should generate response with OpenAI', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.generateResponse('Test prompt');

      expect(mockInvoke).toHaveBeenCalledWith(['Test prompt']);

      expect(result).toEqual({
        content: 'Mock response content',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75,
        },
      });
    });

    it('should generate response with Anthropic', async () => {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatAnthropic).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.generateResponse('Test prompt');

      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-3-opus-20240229');
    });

    it('should generate response with Google', async () => {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatGoogleGenerativeAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'google',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.generateResponse('Test prompt');

      expect(result.provider).toBe('google');
      expect(result.model).toBe('gemini-pro');
    });

    it('should handle LLM call errors gracefully', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('API call failed'));
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      
      await expect(wrapper.generateResponse('Test prompt')).rejects.toThrow('LLM generation failed: API call failed');
    });

    it('should handle response without usage information', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const responseWithoutUsage = { content: 'Test response' };
      const mockInvoke = vi.fn().mockResolvedValue(responseWithoutUsage);
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.generateResponse('Test prompt');

      expect(result.usage).toBeUndefined();
      expect(result.content).toBe('Test response');
    });
  });

  describe('translateText', () => {
    it('should create correct translation prompt', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({ content: 'こんにちは世界' });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      await wrapper.translateText('Hello world', 'Japanese');

      const expectedPrompt = `Translate the following text to Japanese. Only return the translated text without any additional explanation or formatting:

Hello world`;

      expect(mockInvoke).toHaveBeenCalledWith([expectedPrompt]);
    });

    it('should return translated text', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({ 
        content: 'Bonjour le monde',
        usage: mockLLMResponse.usage,
      });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.translateText('Hello world', 'French');

      expect(result.content).toBe('Bonjour le monde');
      expect(result.provider).toBe('openai');
    });

    it('should handle translation errors', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Translation failed'));
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      
      await expect(wrapper.translateText('Hello', 'Spanish')).rejects.toThrow('LLM generation failed: Translation failed');
    });
  });

  describe('summarizeText', () => {
    it('should create correct summarization prompt with default sentences', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({ content: 'Summary of the text.' });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const longText = 'This is a long text that needs to be summarized. It contains multiple sentences and ideas.';
      await wrapper.summarizeText(longText);

      const expectedPrompt = `Summarize the following text in 2 sentences or less. Be concise and capture the main points:

${longText}`;

      expect(mockInvoke).toHaveBeenCalledWith([expectedPrompt]);
    });

    it('should create correct summarization prompt with custom sentence count', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({ content: 'Brief summary.' });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const longText = 'Text to summarize.';
      await wrapper.summarizeText(longText, 1);

      const expectedPrompt = `Summarize the following text in 1 sentences or less. Be concise and capture the main points:

${longText}`;

      expect(mockInvoke).toHaveBeenCalledWith([expectedPrompt]);
    });

    it('should return summarized text', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({ 
        content: 'This is a concise summary of the original text.',
        usage: mockLLMResponse.usage,
      });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.summarizeText('Long text content here...');

      expect(result.content).toBe('This is a concise summary of the original text.');
      expect(result.provider).toBe('openai');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and recreate LLM instance', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'original-key',
      };

      const wrapper = new LLMWrapper(config);
      
      wrapper.updateConfig({
        apiKey: 'new-key',
        temperature: 0.5,
      });

      // The internal config should be updated (we can't directly test this due to private fields)
      // but we can verify the method doesn't throw
      expect(() => wrapper.updateConfig({ model: 'gpt-4' })).not.toThrow();
    });

    it('should allow switching providers through updateConfig', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = new LLMWrapper(config);
      
      expect(() => wrapper.updateConfig({
        provider: 'anthropic',
        apiKey: 'new-anthropic-key',
      })).not.toThrow();
    });
  });

  describe('createLLMWrapper factory function', () => {
    it('should create LLMWrapper instance', async () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
      };

      const wrapper = await createLLMWrapper(config);
      expect(wrapper).toBeInstanceOf(LLMWrapper);
    });
  });

  describe('model name resolution', () => {
    it('should return correct default model names for each provider', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const configs = [
        { provider: 'openai' as LLMProvider, expectedModel: 'gpt-3.5-turbo' },
        { provider: 'anthropic' as LLMProvider, expectedModel: 'claude-3-sonnet-20240229' },
        { provider: 'google' as LLMProvider, expectedModel: 'gemini-pro' },
      ];

      for (const { provider, expectedModel } of configs) {
        const config: LLMConfig = {
          provider,
          apiKey: 'test-key',
        };

        const wrapper = new LLMWrapper(config);
        const result = await wrapper.generateResponse('test');
        expect(result.model).toBe(expectedModel);
      }
    });

    it('should use custom model when specified', async () => {
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4-turbo',
      };

      const wrapper = new LLMWrapper(config);
      const result = await wrapper.generateResponse('test');
      expect(result.model).toBe('gpt-4-turbo');
    });
  });
});