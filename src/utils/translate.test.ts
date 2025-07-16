import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { TranslateService, translateElement, getTranslationPreview } from './translate';
import { LLMWrapper } from '../llm';
import { preprocessForTranslation, isValidContent } from './textProcessor';

// Mock dependencies
vi.mock('../llm');
vi.mock('./textProcessor');

describe('Translation Functionality', () => {
  let mockLLMWrapper: Partial<LLMWrapper>;
  let mockPreprocessForTranslation: Mock;
  let mockIsValidContent: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockLLMWrapper = {
      translateText: vi.fn(),
    };

    mockPreprocessForTranslation = preprocessForTranslation as Mock;
    mockIsValidContent = isValidContent as Mock;

    // Setup default mocks
    mockPreprocessForTranslation.mockImplementation((text: string) => text.trim());
    mockIsValidContent.mockReturnValue(true);
  });

  describe('TranslateService', () => {
    it('should translate text to target language', async () => {
      const mockResponse = {
        content: 'こんにちは世界',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      const result = await service.translate('Hello world', 'Japanese');

      expect(mockLLMWrapper.translateText).toHaveBeenCalledWith('Hello world', 'Japanese');
      expect(result).toEqual(mockResponse);
    });

    it('should preprocess text before translation', async () => {
      const rawText = 'Hello world with `code` and **formatting**';
      const processedText = 'Hello world with  and formatting';
      
      mockPreprocessForTranslation.mockReturnValue(processedText);
      
      const mockResponse = {
        content: 'こんにちは世界',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      await service.translate(rawText, 'Japanese');

      expect(mockPreprocessForTranslation).toHaveBeenCalledWith(rawText);
      expect(mockLLMWrapper.translateText).toHaveBeenCalledWith(processedText, 'Japanese');
    });

    it('should validate content before translation', async () => {
      mockIsValidContent.mockReturnValue(false);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('', 'Japanese')).rejects.toThrow('Invalid content for translation');
      expect(mockLLMWrapper.translateText).not.toHaveBeenCalled();
    });

    it('should handle translation errors gracefully', async () => {
      (mockLLMWrapper.translateText as Mock).mockRejectedValue(new Error('API error'));

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('Hello', 'Japanese')).rejects.toThrow('API error');
    });

    it('should support multiple target languages', async () => {
      const languages = ['Japanese', 'Spanish', 'French', 'German'];
      const mockResponse = {
        content: 'Translated text',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);

      for (const language of languages) {
        await service.translate('Hello', language);
        expect(mockLLMWrapper.translateText).toHaveBeenCalledWith('Hello', language);
      }
    });

    it('should trim whitespace from translation results', async () => {
      const mockResponse = {
        content: '  こんにちは世界  ',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      const result = await service.translate('Hello', 'Japanese');

      expect(result.content).toBe('こんにちは世界');
    });

    it('should handle empty translation results', async () => {
      const mockResponse = {
        content: '',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('Hello', 'Japanese')).rejects.toThrow('Empty translation result');
    });
  });

  describe('translateElement function', () => {
    it('should extract text from element and translate', async () => {
      document.body.innerHTML = `
        <div id="test-element">
          <h1>Hello World</h1>
          <p>This is a test paragraph.</p>
          <code>console.log("code")</code>
        </div>
      `;

      const element = document.getElementById('test-element') as HTMLElement;
      const mockResponse = {
        content: 'こんにちは世界\nこれはテストの段落です。',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const result = await translateElement(element, 'Japanese', mockLLMWrapper as LLMWrapper);

      expect(result).toEqual(mockResponse);
      expect(mockPreprocessForTranslation).toHaveBeenCalled();
    });

    it('should handle elements with no meaningful content', async () => {
      document.body.innerHTML = '<div id="empty-element">   </div>';
      
      const element = document.getElementById('empty-element') as HTMLElement;
      mockIsValidContent.mockReturnValue(false);

      await expect(
        translateElement(element, 'Japanese', mockLLMWrapper as LLMWrapper)
      ).rejects.toThrow('No valid content to translate');
    });

    it('should handle null elements gracefully', async () => {
      await expect(
        translateElement(null as any, 'Japanese', mockLLMWrapper as LLMWrapper)
      ).rejects.toThrow('Element is required');
    });
  });

  describe('getTranslationPreview function', () => {
    it('should generate preview for long text', () => {
      const longText = 'This is a very long text that should be truncated for preview purposes to avoid showing too much content to the user.';
      
      const preview = getTranslationPreview(longText, 50);
      
      expect(preview).toBe('This is a very long text that should be truncat...');
      expect(preview.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('should return full text if within limit', () => {
      const shortText = 'Short text';
      
      const preview = getTranslationPreview(shortText, 50);
      
      expect(preview).toBe('Short text');
    });

    it('should handle empty text', () => {
      const preview = getTranslationPreview('', 50);
      expect(preview).toBe('');
    });

    it('should handle custom length limits', () => {
      const text = 'This is a test text for preview';
      
      const preview10 = getTranslationPreview(text, 10);
      const preview20 = getTranslationPreview(text, 20);
      
      expect(preview10).toBe('This is a ...');
      expect(preview20).toBe('This is a test text ...');
    });
  });

  describe('Translation with different content types', () => {
    beforeEach(() => {
      // Reset mocks to original behavior for integration-like tests
      mockPreprocessForTranslation.mockImplementation((text: string) => {
        // Simulate removing code blocks and markdown
        return text
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`[^`]*`/g, '')
          .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
          .trim();
      });

      mockIsValidContent.mockImplementation((text: string) => {
        return text.trim().length > 10;
      });
    });

    it('should handle markdown content with code blocks', async () => {
      const markdownText = `
# Hello World

This is a paragraph with **bold text**.

\`\`\`javascript
console.log("This should be removed");
\`\`\`

Another paragraph with \`inline code\`.
      `;

      const expectedProcessed = 'Hello World\n\nThis is a paragraph with bold text.\n\nAnother paragraph with .';
      
      const mockResponse = {
        content: 'こんにちは世界\n\nこれは太字のテキストを含む段落です。\n\n別の段落。',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      const result = await service.translate(markdownText, 'Japanese');

      expect(mockLLMWrapper.translateText).toHaveBeenCalledWith(expect.any(String), 'Japanese');
      expect(result).toEqual(mockResponse);
    });

    it('should handle HTML content', async () => {
      document.body.innerHTML = `
        <div id="html-content">
          <h2>Title</h2>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          <pre><code>Code block</code></pre>
          <p>Final paragraph.</p>
        </div>
      `;

      const element = document.getElementById('html-content') as HTMLElement;
      
      const mockResponse = {
        content: 'タイトル\n太字と斜体のテキストを含む段落。\n最後の段落。',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const result = await translateElement(element, 'Japanese', mockLLMWrapper as LLMWrapper);

      expect(result).toEqual(mockResponse);
    });

    it('should handle lists and structured content', async () => {
      document.body.innerHTML = `
        <div id="list-content">
          <h3>Features</h3>
          <ul>
            <li>Feature one</li>
            <li>Feature two</li>
            <li>Feature three</li>
          </ul>
          <ol>
            <li>Step one</li>
            <li>Step two</li>
          </ol>
        </div>
      `;

      const element = document.getElementById('list-content') as HTMLElement;
      
      const mockResponse = {
        content: '機能\n機能1\n機能2\n機能3\nステップ1\nステップ2',
        provider: 'openai' as const,
        model: 'gpt-3.5-turbo',
      };

      (mockLLMWrapper.translateText as Mock).mockResolvedValue(mockResponse);

      const result = await translateElement(element, 'Japanese', mockLLMWrapper as LLMWrapper);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error scenarios', () => {
    it('should handle LLM service unavailable', async () => {
      (mockLLMWrapper.translateText as Mock).mockRejectedValue(new Error('Service unavailable'));

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('Hello', 'Japanese')).rejects.toThrow('Service unavailable');
    });

    it('should handle rate limiting errors', async () => {
      (mockLLMWrapper.translateText as Mock).mockRejectedValue(new Error('Rate limit exceeded'));

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('Hello', 'Japanese')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle invalid language errors', async () => {
      (mockLLMWrapper.translateText as Mock).mockRejectedValue(new Error('Invalid target language'));

      const service = new TranslateService(mockLLMWrapper as LLMWrapper);
      
      await expect(service.translate('Hello', 'InvalidLanguage')).rejects.toThrow('Invalid target language');
    });
  });
});