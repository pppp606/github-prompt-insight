import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMWrapper } from './llm';
import { ExtensionConfig, StorageManager } from './utils/storage';
import { sanitizeForLLM } from './utils/textProcessor';
import { summarizeElement } from './utils/summarize';

// Mock LangChain dependencies
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}));

describe('Integration Tests', () => {
  let mockLLMResponse: any;
  let storageManager: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLLMResponse = {
      content: 'Mock LLM response',
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75,
      },
    };

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


  describe('End-to-End Summarization Workflow', () => {
    it('should complete full summarization workflow', async () => {
      // Setup test content
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Machine Learning Overview</h1>
          <p>Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.</p>
          <p>There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.</p>
          <p>Supervised learning uses labeled data to train models, unsupervised learning finds patterns in unlabeled data, and reinforcement learning learns through trial and error with rewards and penalties.</p>
          <pre><code>
model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
          </code></pre>
          <p>Applications of machine learning include image recognition, natural language processing, recommendation systems, and autonomous vehicles.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Mock LLM response for summarization
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue({
        content: 'Machine learning is an AI subset that enables computers to learn from data through supervised, unsupervised, and reinforcement learning methods. Applications include image recognition, NLP, recommendation systems, and autonomous vehicles.',
        usage: mockLLMResponse.usage,
      });
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      // Create LLM wrapper
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };
      const llmWrapper = new LLMWrapper(config);

      // Execute summarization
      const result = await summarizeElement(element, llmWrapper, 2);

      // Verify the workflow
      expect(result.content).toContain('Machine learning');
      expect(result.content).toContain('supervised');
      expect(result.content).toContain('applications');
      expect(result.provider).toBe('openai');
      expect(mockInvoke).toHaveBeenCalled();

      // Verify that code blocks were excluded
      const callArguments = mockInvoke.mock.calls[0][0];
      expect(callArguments[0].content).not.toContain('LinearRegression');
      expect(callArguments[0].content).not.toContain('model.fit');
    });

    it('should handle summarization errors gracefully', async () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <p>Content to summarize that is long enough to be meaningful for testing purposes.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Mock LLM error
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };
      const llmWrapper = new LLMWrapper(config);

      // Execute summarization and expect error
      await expect(summarizeElement(element, llmWrapper)).rejects.toThrow('Service unavailable');
    });
  });

  describe('GitHub Page Detection and UI Integration', () => {
    it('should detect GitHub markdown files correctly', () => {
      // Test different GitHub URLs
      const testCases = [
        { url: 'https://github.com/user/repo/blob/main/README.md', expected: true },
        { url: 'https://github.com/user/repo/blob/main/docs/guide.md', expected: true },
        { url: 'https://github.com/user/repo/issues/123', expected: true },
        { url: 'https://github.com/user/repo/pull/456', expected: true },
        { url: 'https://github.com/user/repo/wiki/Home', expected: true },
        { url: 'https://example.com/not-github', expected: false },
        { url: 'https://gitlab.com/user/repo', expected: false },
      ];

      testCases.forEach(({ url, expected }) => {
        Object.defineProperty(window, 'location', {
          value: { href: url, hostname: new URL(url).hostname },
          writable: true,
        });

        const isGitHub = window.location.hostname === 'github.com';
        const isValidPath = url.includes('/blob/') || url.includes('/issues/') || 
                           url.includes('/pull/') || url.includes('/wiki/');
        
        expect(isGitHub && isValidPath).toBe(expected);
      });
    });

    it('should inject UI buttons into markdown elements', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Content</h1>
          <p>This is meaningful markdown content for testing UI injection.</p>
        </div>
      `;

      const markdownElement = document.querySelector('.markdown-body') as HTMLElement;
      
      // Simulate button injection
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'github-prompt-insight-buttons';
      
      const translateButton = document.createElement('button');
      translateButton.innerHTML = '🌐';
      translateButton.title = 'Translate';
      
      const summarizeButton = document.createElement('button');
      summarizeButton.innerHTML = '📋';
      summarizeButton.title = 'Summarize';
      
      buttonContainer.appendChild(translateButton);
      buttonContainer.appendChild(summarizeButton);
      markdownElement.appendChild(buttonContainer);

      // Verify injection
      const injectedButtons = markdownElement.querySelector('.github-prompt-insight-buttons');
      expect(injectedButtons).toBeTruthy();
      
      const buttons = injectedButtons?.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons?.[0].title).toBe('Translate');
      expect(buttons?.[1].title).toBe('Summarize');
    });
  });

  describe('Text Processing Integration', () => {
    it('should properly process complex markdown content', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>API Documentation</h1>
          <p>This API provides <strong>authentication</strong> and <em>user management</em> capabilities.</p>
          <h2>Installation</h2>
          <pre><code>
npm install @api/client
import { APIClient } from '@api/client';
          </code></pre>
          <p>Configure your API client with the following code:</p>
          <p><code>const client = new APIClient(apiKey);</code></p>
          <h2>Usage Examples</h2>
          <ul>
            <li>User authentication</li>
            <li>Profile management</li>
            <li>Data retrieval</li>
          </ul>
          <blockquote>
            <p>Note: Make sure to handle errors appropriately in production.</p>
          </blockquote>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      const processedText = sanitizeForLLM(element);

      // Verify text extraction
      expect(processedText).toContain('API Documentation');
      expect(processedText).toContain('authentication');
      expect(processedText).toContain('User authentication');
      expect(processedText).toContain('handle errors appropriately');

      // Verify code removal
      expect(processedText).not.toContain('npm install');
      expect(processedText).not.toContain('import {');
      expect(processedText).not.toContain('new APIClient');
    });

    it('should handle empty or invalid content gracefully', () => {
      const testCases = [
        '<div></div>',
        '<div>   </div>',
        '<div><code>only code</code></div>',
        '<div><pre>only pre</pre></div>',
      ];

      testCases.forEach(html => {
        document.body.innerHTML = html;
        const element = document.querySelector('div') as HTMLElement;
        const processedText = sanitizeForLLM(element);
        
        // Should return empty or minimal text for invalid content
        expect(processedText.trim().length).toBeLessThan(10);
      });
    });
  });

  describe('Storage and Configuration Integration', () => {
    it('should validate complete configuration workflow', () => {
      const validConfig: ExtensionConfig = {
        llmProvider: 'openai',
        apiKey: 'sk-valid-test-key-123',
        model: 'gpt-4',
        defaultLanguage: 'Japanese',
        temperature: 0.7,
        maxTokens: 2048,
      };

      // Test validation
      expect(() => storageManager.validateConfig(validConfig)).not.toThrow();

      // Test default configuration
      const defaults = storageManager.getDefaultConfig();
      expect(defaults.llmProvider).toBe('openai');
      expect(defaults.defaultLanguage).toBe('Japanese');

      // Test supported languages
      const languages = storageManager.getSupportedLanguages();
      expect(languages).toContain('English');
      expect(languages).toContain('Japanese');
      expect(languages).toContain('Spanish');
    });

    it('should handle configuration errors appropriately', () => {
      const invalidConfigs = [
        { llmProvider: 'invalid' as any, apiKey: 'test' },
        { llmProvider: 'openai', apiKey: '' },
        { llmProvider: 'openai', apiKey: 'sk-test', defaultLanguage: 'InvalidLang' },
        { llmProvider: 'openai', apiKey: 'sk-test', defaultLanguage: 'English', temperature: 5 },
      ];

      invalidConfigs.forEach(config => {
        expect(() => storageManager.validateConfig(config as any)).toThrow();
      });
    });
  });

  describe('Multi-Provider LLM Integration', () => {
    it('should work with different LLM providers', async () => {
      const providers: Array<{ provider: 'openai' | 'anthropic' | 'google', apiKey: string }> = [
        { provider: 'openai', apiKey: 'sk-test-openai' },
        { provider: 'anthropic', apiKey: 'test-anthropic' },
        { provider: 'google', apiKey: 'test-google' },
      ];

      for (const { provider, apiKey } of providers) {
        const config = { provider, apiKey };
        
        // Should not throw when creating LLM wrapper
        expect(() => new LLMWrapper(config)).not.toThrow();
      }
    });

    it('should handle provider-specific errors', async () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };

      const llmWrapper = new LLMWrapper(config);

      // Mock different error scenarios
      const { ChatOpenAI } = await import('@langchain/openai');
      
      const errorScenarios = [
        'Rate limit exceeded',
        'Invalid API key',
        'Quota exceeded',
        'Service unavailable',
      ];

      for (const errorMessage of errorScenarios) {
        const mockInvoke = vi.fn().mockRejectedValue(new Error(errorMessage));
        vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

        await expect(llmWrapper.generateResponse('test')).rejects.toThrow();
      }
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };

      const llmWrapper = new LLMWrapper(config);

      // Mock successful response
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      const startTime = Date.now();
      
      // Make two consecutive requests
      await llmWrapper.generateResponse('First request');
      await llmWrapper.generateResponse('Second request');
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least 1 second due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });

    it('should handle large content appropriately', async () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };

      const llmWrapper = new LLMWrapper(config);

      // Test with content that exceeds limit
      const veryLongContent = 'A'.repeat(60000);
      
      await expect(llmWrapper.generateResponse(veryLongContent)).rejects.toThrow('too long');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary failures', async () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };

      const llmWrapper = new LLMWrapper(config);

      // Mock failure then success
      const { ChatOpenAI } = await import('@langchain/openai');
      const mockInvoke = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockLLMResponse);
      
      vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);

      // First request should fail
      await expect(llmWrapper.generateResponse('test')).rejects.toThrow('Temporary failure');

      // Second request should succeed
      const result = await llmWrapper.generateResponse('test');
      expect(result.content).toBe('Mock LLM response');
    });

    it('should provide meaningful error messages', async () => {
      const config = {
        provider: 'openai' as const,
        apiKey: 'sk-test-key',
      };

      const llmWrapper = new LLMWrapper(config);

      // Test various error conditions
      const errorTests = [
        { input: '', expectedError: 'cannot be empty' },
        { input: 'valid input', mockError: 'rate limit', expectedError: 'Rate limit exceeded' },
        { input: 'valid input', mockError: 'API key', expectedError: 'Invalid API key' },
        { input: 'valid input', mockError: 'quota', expectedError: 'quota exceeded' },
      ];

      for (const { input, mockError, expectedError } of errorTests) {
        if (mockError) {
          const { ChatOpenAI } = await import('@langchain/openai');
          const mockInvoke = vi.fn().mockRejectedValue(new Error(mockError));
          vi.mocked(ChatOpenAI).mockReturnValue({ invoke: mockInvoke } as any);
        }

        await expect(llmWrapper.generateResponse(input)).rejects.toThrow(expectedError);
      }
    });
  });
});