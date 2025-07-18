import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SummarizeService, summarizeElement } from './summarize';
import { LLMWrapper } from '../llm';
import { preprocessForSummarization, isValidContent, sanitizeForLLM } from './textProcessor';

// Mock dependencies
vi.mock('../llm');
vi.mock('./textProcessor');

describe('Summarization Functionality', () => {
  let mockLLMWrapper: Partial<LLMWrapper>;
  let mockPreprocessForSummarization: Mock;
  let mockIsValidContent: Mock;
  let mockSanitizeForLLM: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLLMWrapper = {
      summarizeText: vi.fn(),
    };

    mockPreprocessForSummarization = preprocessForSummarization as Mock;
    mockIsValidContent = isValidContent as Mock;
    mockSanitizeForLLM = sanitizeForLLM as Mock;

    // Setup default mocks
    mockPreprocessForSummarization.mockImplementation((text: string) => text.trim());
    mockIsValidContent.mockReturnValue(true);
    mockSanitizeForLLM.mockImplementation((element: HTMLElement) => element.textContent || '');
  });

  describe('SummarizeService', () => {
    it('should summarize text with default sentence count', async () => {
      const longText = 'This is a long document with multiple paragraphs and detailed information that needs to be condensed into a shorter summary for quick understanding.';
      const mockResponse = {
        content: 'This document contains detailed information. It needs condensing for quick understanding.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const result = await service.summarize(longText);

      expect(mockLLMWrapper.summarizeText).toHaveBeenCalledWith(longText, 2);
      expect(result).toEqual(mockResponse);
    });

    it('should summarize text with custom sentence count', async () => {
      const longText = 'This is a comprehensive document that covers multiple topics and contains extensive details that should be summarized.';
      const mockResponse = {
        content: 'Document covers multiple topics with extensive details.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const result = await service.summarize(longText, 1);

      expect(mockLLMWrapper.summarizeText).toHaveBeenCalledWith(longText, 1);
      expect(result).toEqual(mockResponse);
    });

    it('should preprocess text before summarization', async () => {
      const rawText = 'Text with `code blocks` and **formatting** that should be cleaned.';
      const processedText = 'Text with  and formatting that should be cleaned.';
      
      mockPreprocessForSummarization.mockReturnValue(processedText);
      
      const mockResponse = {
        content: 'Text should be cleaned.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      await service.summarize(rawText);

      expect(mockPreprocessForSummarization).toHaveBeenCalledWith(rawText);
      expect(mockLLMWrapper.summarizeText).toHaveBeenCalledWith(processedText, 2);
    });

    it('should validate content before summarization', async () => {
      mockIsValidContent.mockReturnValue(false);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize('')).rejects.toThrow('Text to summarize cannot be empty');
      expect(mockLLMWrapper.summarizeText).not.toHaveBeenCalled();
    });

    it('should handle summarization errors gracefully', async () => {
      (mockLLMWrapper.summarizeText as Mock).mockRejectedValue(new Error('API error'));

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize('Text to summarize')).rejects.toThrow('API error');
    });

    it('should validate sentence count parameters', async () => {
      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      // Test invalid sentence counts
      await expect(service.summarize('Text', 0)).rejects.toThrow('Sentence count must be between 1 and 10');
      await expect(service.summarize('Text', 11)).rejects.toThrow('Sentence count must be between 1 and 10');
      await expect(service.summarize('Text', -1)).rejects.toThrow('Sentence count must be between 1 and 10');
    });

    it('should trim whitespace from summary results', async () => {
      const mockResponse = {
        content: '  This is a summary with whitespace.  ',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const result = await service.summarize('Text to summarize');

      expect(result.content).toBe('This is a summary with whitespace.');
    });

    it('should handle empty summary results', async () => {
      const mockResponse = {
        content: '',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize('Text')).rejects.toThrow('Empty summary result');
    });

    it('should handle very short text that does not need summarization', async () => {
      const shortText = 'Short text.';
      mockIsValidContent.mockReturnValue(false);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize(shortText)).rejects.toThrow('Invalid content for summarization');
    });
  });

  describe('summarizeElement function', () => {
    it('should extract text from element and summarize', async () => {
      document.body.innerHTML = `
        <div id="test-element">
          <h1>Introduction to Machine Learning</h1>
          <p>Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.</p>
          <p>It includes supervised learning, unsupervised learning, and reinforcement learning approaches.</p>
          <code>model.fit(X, y)</code>
          <p>Applications include image recognition, natural language processing, and recommendation systems.</p>
        </div>
      `;

      const element = document.getElementById('test-element') as HTMLElement;
      const mockResponse = {
        content: 'Machine learning is an AI subset focusing on data-learning algorithms. It includes supervised, unsupervised, and reinforcement learning with applications in image recognition and NLP.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const result = await summarizeElement(element, mockLLMWrapper as LLMWrapper);

      expect(result).toEqual(mockResponse);
      // summarizeElement uses sanitizeForLLM, not preprocessForSummarization
    });

    it('should handle elements with no meaningful content', async () => {
      document.body.innerHTML = '<div id="empty-element">   </div>';
      
      const element = document.getElementById('empty-element') as HTMLElement;
      mockIsValidContent.mockReturnValue(false);

      await expect(
        summarizeElement(element, mockLLMWrapper as LLMWrapper)
      ).rejects.toThrow('No valid content to summarize');
    });

    it('should handle null elements gracefully', async () => {
      await expect(
        summarizeElement(null as any, mockLLMWrapper as LLMWrapper)
      ).rejects.toThrow('Element is required');
    });

    it('should handle custom sentence counts for elements', async () => {
      document.body.innerHTML = `
        <div id="test-element">
          <p>This is a detailed explanation of a complex topic that requires a comprehensive summary.</p>
        </div>
      `;

      const element = document.getElementById('test-element') as HTMLElement;
      const mockResponse = {
        content: 'Complex topic requires comprehensive summary.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const result = await summarizeElement(element, mockLLMWrapper as LLMWrapper, 1);

      expect(mockLLMWrapper.summarizeText).toHaveBeenCalledWith(expect.any(String), 1, undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Different content types', () => {
    beforeEach(() => {
      // Reset mocks to simulate actual preprocessing
      mockPreprocessForSummarization.mockImplementation((text: string) => {
        // Simulate removing code blocks but keeping structure
        return text
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`[^`]*`/g, '')
          .trim();
      });

      mockIsValidContent.mockImplementation((text: string) => {
        return text && text.trim().length > 20;
      });
    });

    it('should handle markdown documentation', async () => {
      const markdownDoc = `
# API Documentation

This API provides authentication and user management capabilities.

## Features

- User registration and login
- JWT token authentication
- Role-based access control
- Password reset functionality

\`\`\`javascript
const api = new API();
api.authenticate(token);
\`\`\`

## Usage

The API is RESTful and supports JSON responses.
      `;

      const mockResponse = {
        content: 'API provides authentication and user management with JWT tokens and role-based access. It is RESTful and supports JSON responses.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const result = await service.summarize(markdownDoc);

      expect(result).toEqual(mockResponse);
    });

    it('should handle HTML documentation', async () => {
      document.body.innerHTML = `
        <div id="html-doc">
          <h1>Product Features</h1>
          <p>Our product offers comprehensive project management capabilities.</p>
          <ul>
            <li>Task tracking and assignment</li>
            <li>Team collaboration tools</li>
            <li>Progress reporting and analytics</li>
          </ul>
          <pre><code>npm install project-manager</code></pre>
          <p>Integration is simple and requires minimal setup.</p>
        </div>
      `;

      const element = document.getElementById('html-doc') as HTMLElement;
      
      const mockResponse = {
        content: 'Product offers project management with task tracking, team collaboration, and analytics. Integration is simple with minimal setup.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const result = await summarizeElement(element, mockLLMWrapper as LLMWrapper);

      expect(result).toEqual(mockResponse);
    });

    it('should handle technical README content', async () => {
      const readmeContent = `
# GitHub Prompt Insight

A Chrome extension for translating and summarizing GitHub markdown files.

## Installation

1. Clone the repository
2. Install dependencies
3. Build the extension
4. Load in Chrome

## Configuration

Set up your API keys in the extension options page.

## Supported Providers

- OpenAI GPT models
- Anthropic Claude
- Google Gemini
      `;

      const mockResponse = {
        content: 'Chrome extension for translating and summarizing GitHub markdown files. Supports multiple LLM providers including OpenAI, Anthropic, and Google.',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.summarizeText as Mock).mockResolvedValue(mockResponse);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const result = await service.summarize(readmeContent);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle service unavailable errors', async () => {
      (mockLLMWrapper.summarizeText as Mock).mockRejectedValue(new Error('Service temporarily unavailable'));

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize('Text to summarize')).rejects.toThrow('Service temporarily unavailable');
    });

    it('should handle rate limiting errors', async () => {
      (mockLLMWrapper.summarizeText as Mock).mockRejectedValue(new Error('Rate limit exceeded. Please wait.'));

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize('Text to summarize')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed content gracefully', async () => {
      const malformedContent = '\x00\x01\x02invalid characters';
      mockIsValidContent.mockReturnValue(false);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize(malformedContent)).rejects.toThrow('Invalid content for summarization');
    });

    it('should handle very long content that exceeds limits', async () => {
      const veryLongContent = 'A'.repeat(100000); // 100k characters
      (mockLLMWrapper.summarizeText as Mock).mockRejectedValue(new Error('Content too long'));

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarize(veryLongContent)).rejects.toThrow('Content too long');
    });
  });

  describe('Batch summarization', () => {
    it('should summarize multiple texts in batch', async () => {
      const texts = [
        'First document about machine learning concepts.',
        'Second document about web development practices.',
        'Third document about database optimization techniques.'
      ];

      const mockResponses = [
        { content: 'Document about ML concepts.', provider: 'openai' as const, model: 'gpt-3.5-turbo' },
        { content: 'Document about web development.', provider: 'openai' as const, model: 'gpt-3.5-turbo' },
        { content: 'Document about DB optimization.', provider: 'openai' as const, model: 'gpt-3.5-turbo' },
      ];

      (mockLLMWrapper.summarizeText as Mock)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      const results = await service.summarizeBatch(texts);

      expect(results).toEqual(mockResponses);
      expect(mockLLMWrapper.summarizeText).toHaveBeenCalledTimes(3);
    });

    it('should handle batch errors appropriately', async () => {
      const texts = ['First text', 'Second text'];
      
      (mockLLMWrapper.summarizeText as Mock)
        .mockResolvedValueOnce({ content: 'First summary', provider: 'openai' as const, model: 'gpt-3.5-turbo' })
        .mockRejectedValueOnce(new Error('Second text failed'));

      const service = new SummarizeService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.summarizeBatch(texts)).rejects.toThrow('Batch summarization failed at item 2');
    });
  });
});