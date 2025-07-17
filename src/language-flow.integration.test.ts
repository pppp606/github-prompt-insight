import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMWrapper } from './llm';
import { ExtensionConfig, StorageManager } from './utils/storage';
import { summarizeElement } from './utils/summarize';

// Mock LangChain dependencies
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}));

vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}));

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

describe('Language Flow Integration Tests', () => {
  let storageManager: StorageManager;
  let mockChromeStorage: any;
  let mockChromeRuntime: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Chrome API mocks
    mockChromeStorage = {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    };

    mockChromeRuntime = {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
      },
      lastError: null,
    };

    global.chrome = {
      storage: mockChromeStorage,
      runtime: mockChromeRuntime,
    } as any;

    storageManager = new StorageManager();

    // Setup DOM
    document.body.innerHTML = '';
    
    // Mock window.location for GitHub page detection
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'github.com',
        href: 'https://github.com/user/repo/blob/main/README.md',
      },
      writable: true,
    });
  });

  describe('Complete Language Flow: Storage → Content → LLM → Output', () => {
    it('should use Japanese language from Chrome storage for summarization', async () => {
      // Setup test configuration in Chrome storage
      const testConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key-123',
        model: 'gpt-3.5-turbo',
        defaultLanguage: 'Japanese',
        temperature: 0.7,
        maxTokens: 2048,
      };

      // Mock Chrome storage to return the configuration
      mockChromeStorage.sync.get.mockImplementation((key: string, callback: Function) => {
        callback({ [key]: testConfig });
      });

      // Mock Chrome runtime message for content script access
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          callback({ [message.key]: testConfig });
        }
      });

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Getting Started Guide</h1>
          <p>This comprehensive guide will walk you through setting up and using our application.</p>
          <p>You'll learn about installation, configuration, and basic usage patterns.</p>
          <p>The application provides powerful features for data processing and analysis.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      // Mock LLM response in Japanese
      const expectedJapaneseSummary = 'このガイドでは、アプリケーションのセットアップと使用方法について説明します。インストール、設定、基本的な使用パターンについて学びます。';
      
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: expectedJapaneseSummary,
        usage: {
          prompt_tokens: 60,
          completion_tokens: 30,
          total_tokens: 90,
        },
      });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      // Simulate the complete flow: retrieve config and create LLM wrapper
      const retrievedConfig = await storageManager.getConfigViaRuntime();
      expect(retrievedConfig).toEqual(testConfig);
      expect(retrievedConfig?.defaultLanguage).toBe('Japanese');

      const llmWrapper = new LLMWrapper({
        provider: retrievedConfig!.llmProvider,
        apiKey: retrievedConfig!.apiKey,
        model: retrievedConfig!.model,
      });

      // Execute summarization with language from config
      const result = await llmWrapper.summarizeText(
        element.textContent || '',
        2,
        retrievedConfig!.defaultLanguage
      );

      // Verify the complete flow
      expect(result.content).toBe(expectedJapaneseSummary);
      expect(result.provider).toBe('openai');
      
      // Verify that the LLM was called with the correct language prompt
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.stringContaining('Summarize the following text in 2 sentences or less in Japanese')
      ]);

      // Verify Chrome storage was accessed
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_storage',
          key: 'extensionConfig'
        }),
        expect.any(Function)
      );
    });

    it('should fallback to English when no language is set in storage', async () => {
      // Setup incomplete configuration (missing defaultLanguage)
      const incompleteConfig = {
        llmProvider: 'anthropic',
        apiKey: 'test-anthropic-key',
        model: 'claude-3-sonnet-20240229',
        // defaultLanguage is missing
      };

      // Mock Chrome storage to return incomplete configuration
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          callback({ [message.key]: incompleteConfig });
        }
      });

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Technical Documentation</h1>
          <p>This document covers advanced topics in software development.</p>
          <p>It includes best practices, design patterns, and implementation strategies.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      // Mock LLM response in English (fallback)
      const expectedEnglishSummary = 'This document covers advanced software development topics including best practices and design patterns.';
      
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: expectedEnglishSummary,
        usage: {
          prompt_tokens: 45,
          completion_tokens: 20,
          total_tokens: 65,
        },
      });
      vi.mocked(ChatAnthropic).mockReturnValue({ invoke: mockInvoke } as any);

      // Simulate the flow with missing language configuration
      const retrievedConfig = await storageManager.getConfigViaRuntime();
      const defaultLanguage = retrievedConfig?.defaultLanguage || 'English'; // Fallback

      const llmWrapper = new LLMWrapper({
        provider: 'anthropic',
        apiKey: incompleteConfig.apiKey,
        model: incompleteConfig.model,
      });

      // Execute summarization with fallback language
      const result = await llmWrapper.summarizeText(
        element.textContent || '',
        2,
        defaultLanguage
      );

      // Verify fallback to English
      expect(defaultLanguage).toBe('English');
      expect(result.content).toBe(expectedEnglishSummary);
      expect(result.provider).toBe('anthropic');
      
      // Verify that the LLM was called with English
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.stringContaining('Summarize the following text in 2 sentences or less in English')
      ]);
    });

    it('should handle different language configurations correctly', async () => {
      const testLanguages = [
        { language: 'Spanish', expectedSummary: 'Esta guía cubre temas avanzados de desarrollo de software.' },
        { language: 'French', expectedSummary: 'Ce guide couvre des sujets avancés de développement logiciel.' },
        { language: 'German', expectedSummary: 'Dieser Leitfaden behandelt fortgeschrittene Themen der Softwareentwicklung.' },
        { language: 'Chinese', expectedSummary: '本指南涵盖软件开发的高级主题。' },
        { language: 'Korean', expectedSummary: '이 가이드는 소프트웨어 개발의 고급 주제를 다룹니다.' },
      ];

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Advanced Software Development</h1>
          <p>This guide covers advanced topics in software development and engineering practices.</p>
          <p>Learn about architectural patterns, code quality, and performance optimization.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      for (const { language, expectedSummary } of testLanguages) {
        // Create configuration for each language
        const config: ExtensionConfig = {
          llmProvider: 'google',
          apiKey: 'test-google-key',
          model: 'gemini-pro',
          defaultLanguage: language,
          temperature: 0.7,
          maxTokens: 1024,
        };

        // Mock Chrome storage for this language
        mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
          if (message.action === 'get_storage') {
            callback({ [message.key]: config });
          }
        });

        // Mock LLM response in the target language
        const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
        const mockInvoke = vi.fn().mockResolvedValue({
          content: expectedSummary,
          usage: {
            prompt_tokens: 50,
            completion_tokens: 25,
            total_tokens: 75,
          },
        });
        vi.mocked(ChatGoogleGenerativeAI).mockReturnValue({ invoke: mockInvoke } as any);

        // Execute the complete flow
        const retrievedConfig = await storageManager.getConfigViaRuntime();
        expect(retrievedConfig?.defaultLanguage).toBe(language);

        const llmWrapper = new LLMWrapper({
          provider: retrievedConfig!.llmProvider,
          apiKey: retrievedConfig!.apiKey,
          model: retrievedConfig!.model,
        });

        const result = await llmWrapper.summarizeText(
          element.textContent || '',
          2,
          retrievedConfig!.defaultLanguage
        );

        // Verify language-specific results
        expect(result.content).toBe(expectedSummary);
        expect(result.provider).toBe('google');
        
        // Verify the prompt included the correct language
        expect(mockInvoke).toHaveBeenCalledWith([
          expect.stringContaining(`Summarize the following text in 2 sentences or less in ${language}`)
        ]);

        // Clear mocks for next iteration
        vi.clearAllMocks();
      }
    });

    it('should maintain language consistency through the summarizeElement flow', async () => {
      // Setup configuration with Portuguese
      const config: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-4',
        defaultLanguage: 'Portuguese',
        temperature: 0.5,
        maxTokens: 2048,
      };

      // Mock Chrome storage
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          callback({ [message.key]: config });
        }
      });

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Machine Learning Fundamentals</h1>
          <p>Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models.</p>
          <p>These systems can learn from data without being explicitly programmed for specific tasks.</p>
          <p>Applications include computer vision, natural language processing, and predictive analytics.</p>
          <pre><code>
          # Example code block
          import sklearn
          model = sklearn.linear_model.LogisticRegression()
          </code></pre>
          <p>Understanding these concepts is crucial for modern software development.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      // Mock LLM response in Portuguese
      const expectedPortugueseSummary = 'O aprendizado de máquina é um subconjunto da inteligência artificial focado em algoritmos que aprendem de dados. As aplicações incluem visão computacional, processamento de linguagem natural e análise preditiva.';
      
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: expectedPortugueseSummary,
        usage: {
          prompt_tokens: 70,
          completion_tokens: 35,
          total_tokens: 105,
        },
      });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      // Simulate the complete content script flow
      const retrievedConfig = await storageManager.getConfigViaRuntime();
      
      const llmWrapper = new LLMWrapper({
        provider: retrievedConfig!.llmProvider,
        apiKey: retrievedConfig!.apiKey,
        model: retrievedConfig!.model,
      });

      // Use summarizeElement with language parameter
      const result = await summarizeElement(
        element,
        llmWrapper,
        2,
        retrievedConfig!.defaultLanguage
      );

      // Verify the complete flow maintained language consistency
      expect(result.content).toBe(expectedPortugueseSummary);
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4');
      
      // Verify the language was correctly passed through
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.stringContaining('Summarize the following text in 2 sentences or less in Portuguese')
      ]);

      // Verify that the text processing happened (the prompt should contain cleaned content)
      const promptContent = mockInvoke.mock.calls[0][0][0];
      expect(promptContent).toContain('Machine Learning Fundamentals');
      expect(promptContent).toContain('artificial intelligence');
    });

    it('should handle Chrome storage errors gracefully', async () => {
      // Mock Chrome storage error
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          // Simulate Chrome runtime error
          global.chrome.runtime.lastError = { message: 'Storage quota exceeded' };
          callback(null);
        }
      });

      // Test configuration retrieval with error
      const retrievedConfig = await storageManager.getConfigViaRuntime();
      
      // Should return null when there's an error
      expect(retrievedConfig).toBeNull();

      // Verify that the application can handle missing configuration
      // and falls back to default behavior (English)
      const defaultLanguage = retrievedConfig?.defaultLanguage || 'English';
      expect(defaultLanguage).toBe('English');

      // Clean up error state
      global.chrome.runtime.lastError = null;
    });

    it('should work with empty or corrupted storage data', async () => {
      const scenarios = [
        { data: null, expectedConfig: null },
        { data: undefined, expectedConfig: null },
        { data: {}, expectedConfig: null },
        { data: { extensionConfig: null }, expectedConfig: null },
        { data: { extensionConfig: undefined }, expectedConfig: null },
        { data: { extensionConfig: { llmProvider: 'openai' } }, expectedConfig: { llmProvider: 'openai' } },
      ];

      for (const { data, expectedConfig } of scenarios) {
        // Mock Chrome storage to return test data
        mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
          if (message.action === 'get_storage') {
            callback(data);
          }
        });

        const retrievedConfig = await storageManager.getConfigViaRuntime();
        
        // Check if config matches expected result
        if (expectedConfig === null) {
          expect(retrievedConfig).toBeNull();
        } else {
          expect(retrievedConfig).toEqual(expectedConfig);
        }
        
        // Application should fall back to default language when config is incomplete
        const defaultLanguage = retrievedConfig?.defaultLanguage || 'English';
        expect(defaultLanguage).toBe('English');

        // Clear mocks for next iteration
        vi.clearAllMocks();
      }
    });
  });

  describe('Content Script Integration with Language Flow', () => {
    it('should pass language from storage through content script methods', async () => {
      // Setup configuration with Italian
      const config: ExtensionConfig = {
        llmProvider: 'anthropic',
        apiKey: 'test-anthropic-key',
        model: 'claude-3-sonnet-20240229',
        defaultLanguage: 'Italian',
        temperature: 0.7,
        maxTokens: 1500,
      };

      // Mock Chrome storage
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          callback({ [message.key]: config });
        }
      });

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Data Science Introduction</h1>
          <p>Data science combines statistics, programming, and domain expertise to extract insights from data.</p>
          <p>Key skills include data cleaning, analysis, visualization, and machine learning.</p>
          <p>Popular tools include Python, R, SQL, and various visualization libraries.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      // Mock LLM response in Italian
      const expectedItalianSummary = 'La data science combina statistica, programmazione e competenze di dominio per estrarre insights dai dati. Le competenze chiave includono pulizia dei dati, analisi, visualizzazione e machine learning.';
      
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: expectedItalianSummary,
        usage: {
          prompt_tokens: 65,
          completion_tokens: 40,
          total_tokens: 105,
        },
      });
      vi.mocked(ChatAnthropic).mockReturnValue({ invoke: mockInvoke } as any);

      // Simulate the GitHubMarkdownEnhancer initialization and summarization
      const retrievedConfig = await storageManager.getConfigViaRuntime();
      
      const llmWrapper = new LLMWrapper({
        provider: retrievedConfig!.llmProvider,
        apiKey: retrievedConfig!.apiKey,
        model: retrievedConfig!.model,
      });

      // Test the flow as it would happen in the content script
      const result = await summarizeElement(element, llmWrapper, 2, retrievedConfig!.defaultLanguage);

      // Verify the complete flow with language support
      expect(result.content).toBe(expectedItalianSummary);
      expect(result.provider).toBe('anthropic');
      
      // Verify the correct language was passed through
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.stringContaining('Summarize the following text in 2 sentences or less in Italian')
      ]);
    });
  });

  describe('Multi-Provider Language Support', () => {
    it('should maintain language consistency across different LLM providers', async () => {
      const providers = [
        { provider: 'openai' as const, apiKey: 'sk-test-openai', expectedSummary: '这是一个关于软件架构的综合指南。' },
        { provider: 'anthropic' as const, apiKey: 'test-anthropic', expectedSummary: '这是一个关于软件架构的综合指南。' },
        { provider: 'google' as const, apiKey: 'test-google', expectedSummary: '这是一个关于软件架构的综合指南。' },
      ];

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Software Architecture Guide</h1>
          <p>This comprehensive guide covers software architecture principles and patterns.</p>
          <p>Learn about microservices, monoliths, and distributed systems design.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      for (const { provider, apiKey, expectedSummary } of providers) {
        // Create configuration for each provider with Chinese language
        const config: ExtensionConfig = {
          llmProvider: provider,
          apiKey: apiKey,
          model: provider === 'openai' ? 'gpt-3.5-turbo' : 
                 provider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gemini-pro',
          defaultLanguage: 'Chinese',
          temperature: 0.7,
          maxTokens: 2048,
        };

        // Mock Chrome storage
        mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
          if (message.action === 'get_storage') {
            callback({ [message.key]: config });
          }
        });

        // Mock the appropriate LLM provider
        if (provider === 'openai') {
          const { ChatOpenAI } = await import('@langchain/openai');
          const mockInvoke = vi.fn().mockResolvedValue({
            content: expectedSummary,
            usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
          });
          vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);
        } else if (provider === 'anthropic') {
          const { ChatAnthropic } = await import('@langchain/anthropic');
          const mockInvoke = vi.fn().mockResolvedValue({
            content: expectedSummary,
            usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
          });
          vi.mocked(ChatAnthropic).mockReturnValue({ invoke: mockInvoke } as any);
        } else if (provider === 'google') {
          const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
          const mockInvoke = vi.fn().mockResolvedValue({
            content: expectedSummary,
            usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 },
          });
          vi.mocked(ChatGoogleGenerativeAI).mockReturnValue({ invoke: mockInvoke } as any);
        }

        // Execute the flow
        const retrievedConfig = await storageManager.getConfigViaRuntime();
        expect(retrievedConfig?.defaultLanguage).toBe('Chinese');

        const llmWrapper = new LLMWrapper({
          provider: retrievedConfig!.llmProvider,
          apiKey: retrievedConfig!.apiKey,
          model: retrievedConfig!.model,
        });

        const result = await llmWrapper.summarizeText(
          element.textContent || '',
          2,
          retrievedConfig!.defaultLanguage
        );

        // Verify consistent language handling across providers
        expect(result.content).toBe(expectedSummary);
        expect(result.provider).toBe(provider);

        // Clear mocks for next provider
        vi.clearAllMocks();
      }
    });
  });

  describe('Error Handling in Language Flow', () => {
    it('should handle LLM errors while preserving language information', async () => {
      // Setup configuration with Russian
      const config: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-test-key',
        model: 'gpt-3.5-turbo',
        defaultLanguage: 'Russian',
        temperature: 0.7,
        maxTokens: 2048,
      };

      // Mock Chrome storage
      mockChromeRuntime.sendMessage.mockImplementation((message: any, callback: Function) => {
        if (message.action === 'get_storage') {
          callback({ [message.key]: config });
        }
      });

      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Content</h1>
          <p>This is test content for error handling.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;

      // Mock LLM error
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('API quota exceeded'));
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const retrievedConfig = await storageManager.getConfigViaRuntime();
      const llmWrapper = new LLMWrapper({
        provider: retrievedConfig!.llmProvider,
        apiKey: retrievedConfig!.apiKey,
        model: retrievedConfig!.model,
      });

      // Verify that errors preserve language context
      await expect(
        llmWrapper.summarizeText(
          element.textContent || '',
          2,
          retrievedConfig!.defaultLanguage
        )
      ).rejects.toThrow('quota exceeded');

      // Verify the correct language was attempted
      expect(mockInvoke).toHaveBeenCalledWith([
        expect.stringContaining('Summarize the following text in 2 sentences or less in Russian')
      ]);
    });
  });
});