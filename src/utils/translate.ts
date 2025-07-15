/**
 * Translation utilities for GitHub Markdown content
 */

import { LLMWrapper, LLMResponse } from '../llm';
import { sanitizeForLLM, preprocessForTranslation, isValidContent } from './textProcessor';

export class TranslateService {
  constructor(private llmWrapper: LLMWrapper) {}

  /**
   * Translate text to target language with preprocessing
   */
  async translate(text: string, targetLanguage: string): Promise<LLMResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }

    if (!targetLanguage || targetLanguage.trim().length === 0) {
      throw new Error('Target language must be specified');
    }

    // Preprocess the text to remove code blocks and clean up formatting
    const processedText = preprocessForTranslation(text);

    // Validate that we have meaningful content to translate
    if (!isValidContent(processedText)) {
      throw new Error('Invalid content for translation');
    }

    try {
      const result = await this.llmWrapper.translateText(processedText, targetLanguage);
      
      // Trim whitespace from the result
      result.content = result.content.trim();
      
      // Validate that we got a meaningful translation
      if (!result.content || result.content.length === 0) {
        throw new Error('Empty translation result');
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Translation failed: ${String(error)}`);
    }
  }

  /**
   * Translate with retry logic for rate limiting
   */
  async translateWithRetry(
    text: string, 
    targetLanguage: string, 
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.translate(text, targetLanguage);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If it's not a rate limit error, don't retry
        if (!lastError.message.toLowerCase().includes('rate limit')) {
          throw lastError;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw lastError || new Error('Translation failed after retries');
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[], 
    targetLanguage: string,
    batchDelay: number = 1000
  ): Promise<LLMResponse[]> {
    const results: LLMResponse[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.translate(texts[i], targetLanguage);
        results.push(result);
        
        // Add delay between batch requests to avoid rate limiting
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        throw new Error(`Batch translation failed at item ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }
}

/**
 * Translate an HTML element's content
 */
export async function translateElement(
  element: HTMLElement,
  targetLanguage: string,
  llmWrapper: LLMWrapper
): Promise<LLMResponse> {
  if (!element) {
    throw new Error('Element is required');
  }

  // Extract and clean the text content from the element
  const rawText = sanitizeForLLM(element);
  
  if (!isValidContent(rawText)) {
    throw new Error('No valid content to translate');
  }

  const service = new TranslateService(llmWrapper);
  return service.translate(rawText, targetLanguage);
}

/**
 * Get a preview of text that will be translated
 */
export function getTranslationPreview(text: string, maxLength: number = 100): string {
  if (!text) return '';
  
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength - 3) + '...';
}

/**
 * Detect if text is likely in a specific language (basic heuristics)
 */
export function detectLanguage(text: string): string {
  if (!text) return 'unknown';
  
  // Simple heuristics for common languages
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  const chineseRegex = /[\u4E00-\u9FFF]/;
  const koreanRegex = /[\uAC00-\uD7AF]/;
  const cyrillicRegex = /[\u0400-\u04FF]/;
  const arabicRegex = /[\u0600-\u06FF]/;
  
  if (japaneseRegex.test(text)) return 'Japanese';
  if (chineseRegex.test(text)) return 'Chinese';
  if (koreanRegex.test(text)) return 'Korean';
  if (cyrillicRegex.test(text)) return 'Russian';
  if (arabicRegex.test(text)) return 'Arabic';
  
  return 'English'; // Default fallback
}

/**
 * Get supported translation languages
 */
export function getSupportedTranslationLanguages(): string[] {
  return [
    'English',
    'Japanese',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Korean',
    'Italian',
    'Portuguese',
    'Russian',
    'Arabic',
    'Hindi',
    'Dutch',
    'Swedish',
    'Norwegian',
    'Danish',
  ];
}

/**
 * Validate if a language is supported for translation
 */
export function isLanguageSupported(language: string): boolean {
  return getSupportedTranslationLanguages().includes(language);
}

/**
 * Create a translation service instance
 */
export function createTranslationService(llmWrapper: LLMWrapper): TranslateService {
  return new TranslateService(llmWrapper);
}

/**
 * Format translation result for display
 */
export function formatTranslationResult(
  originalText: string,
  translatedText: string,
  targetLanguage: string,
  provider: string
): string {
  const preview = getTranslationPreview(originalText, 50);
  
  return `
**Translation to ${targetLanguage}**
*Original: "${preview}"*

${translatedText}

*Translated using ${provider}*
  `.trim();
}

/**
 * Estimate translation cost (tokens)
 */
export function estimateTranslationTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English
  // Translation typically doubles the token count (input + output)
  const baseTokens = Math.ceil(text.length / 4);
  return baseTokens * 2;
}

export default TranslateService;