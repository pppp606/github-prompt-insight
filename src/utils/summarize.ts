/**
 * Summarization utilities for GitHub Markdown content
 */

import { LLMWrapper, LLMResponse } from '../llm';
import { sanitizeForLLM, preprocessForSummarization, isValidContent } from './textProcessor';

export class SummarizeService {
  constructor(private llmWrapper: LLMWrapper) {}

  /**
   * Summarize text with preprocessing and validation
   */
  async summarize(text: string, maxSentences: number = 2): Promise<LLMResponse> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to summarize cannot be empty');
    }

    if (maxSentences < 1 || maxSentences > 10) {
      throw new Error('Sentence count must be between 1 and 10');
    }

    // Preprocess the text to remove code blocks and clean up formatting
    const processedText = preprocessForSummarization(text);

    // Validate that we have meaningful content to summarize
    if (!isValidContent(processedText)) {
      throw new Error('Invalid content for summarization');
    }

    try {
      const result = await this.llmWrapper.summarizeText(processedText, maxSentences);
      
      // Trim whitespace from the result
      result.content = result.content.trim();
      
      // Validate that we got a meaningful summary
      if (!result.content || result.content.length === 0) {
        throw new Error('Empty summary result');
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Summarization failed: ${String(error)}`);
    }
  }

  /**
   * Summarize with retry logic for rate limiting
   */
  async summarizeWithRetry(
    text: string, 
    maxSentences: number = 2,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.summarize(text, maxSentences);
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

    throw lastError || new Error('Summarization failed after retries');
  }

  /**
   * Batch summarize multiple texts
   */
  async summarizeBatch(
    texts: string[], 
    maxSentences: number = 2,
    batchDelay: number = 1000
  ): Promise<LLMResponse[]> {
    const results: LLMResponse[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.summarize(texts[i], maxSentences);
        results.push(result);
        
        // Add delay between batch requests to avoid rate limiting
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        throw new Error(`Batch summarization failed at item ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return results;
  }
}

/**
 * Summarize an HTML element's content
 */
export async function summarizeElement(
  element: HTMLElement,
  llmWrapper: LLMWrapper,
  maxSentences: number = 2,
  language?: string
): Promise<LLMResponse> {
  if (!element) {
    throw new Error('Element is required');
  }

  // Extract and clean the text content from the element
  const rawText = sanitizeForLLM(element);
  
  if (!isValidContent(rawText)) {
    throw new Error('No valid content to summarize');
  }

  // Use LLMWrapper's summarizeText method which supports language parameter
  return llmWrapper.summarizeText(rawText, maxSentences, language);
}

/**
 * Estimate reading time for text (approximate)
 */
export function estimateReadingTime(text: string): string {
  if (!text) return '0 min';
  
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

/**
 * Calculate summary compression ratio
 */
export function calculateCompressionRatio(originalText: string, summaryText: string): number {
  if (!originalText || !summaryText) return 0;
  
  const originalLength = originalText.trim().length;
  const summaryLength = summaryText.trim().length;
  
  return summaryLength / originalLength;
}

/**
 * Get optimal summary length based on content type and length
 */
export function getOptimalSummaryLength(text: string, contentType?: string): number {
  const textLength = text.trim().length;
  
  // Adjust based on content type
  let baseSentences = 2;
  
  if (contentType === 'documentation') {
    baseSentences = 3;
  } else if (contentType === 'code') {
    baseSentences = 1;
  } else if (contentType === 'article') {
    baseSentences = 2;
  }
  
  // Adjust based on text length
  if (textLength < 500) {
    return 1;
  } else if (textLength > 2000) {
    return Math.min(baseSentences + 1, 4);
  }
  
  return baseSentences;
}

/**
 * Validate if content is suitable for summarization
 */
export function isSuitableForSummary(text: string): boolean {
  if (!text || text.trim().length < 50) return false;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Need at least 3 sentences to create a meaningful summary
  return sentences.length >= 3;
}

/**
 * Create a summarization service instance
 */
export function createSummarizationService(llmWrapper: LLMWrapper): SummarizeService {
  return new SummarizeService(llmWrapper);
}

/**
 * Format summary result for display
 */
export function formatSummaryResult(
  summaryText: string,
): string {  
  return `
${summaryText}
  `.trim();
}

/**
 * Extract key topics from text (simple keyword extraction)
 */
export function extractKeyTopics(text: string, maxTopics: number = 5): string[] {
  if (!text) return [];
  
  // Simple keyword extraction based on frequency
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter short words
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and return top topics
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTopics)
    .map(([word]) => word);
}

/**
 * Estimate summary quality score (0-1)
 */
export function estimateSummaryQuality(originalText: string, summaryText: string): number {
  if (!originalText || !summaryText) return 0;
  
  const originalTopics = extractKeyTopics(originalText, 10);
  const summaryTopics = extractKeyTopics(summaryText, 10);
  
  // Calculate topic coverage
  const commonTopics = originalTopics.filter(topic => 
    summaryTopics.some(summaryTopic => summaryTopic.includes(topic) || topic.includes(summaryTopic))
  );
  
  const topicCoverage = commonTopics.length / Math.min(originalTopics.length, 5);
  
  // Calculate compression ratio (optimal is around 0.1-0.3)
  const compressionRatio = calculateCompressionRatio(originalText, summaryText);
  const compressionScore = compressionRatio > 0.5 ? 0.5 : (compressionRatio < 0.05 ? 0.5 : 1);
  
  // Combine scores
  return Math.min((topicCoverage * 0.7 + compressionScore * 0.3), 1);
}

export default SummarizeService;