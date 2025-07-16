/**
 * Text processing utilities for extracting and cleaning markdown content
 * for LLM processing while excluding code blocks.
 */

/**
 * Extracts plain text content from an HTML element, preserving structure
 * but removing HTML tags.
 */
export function extractTextContent(element: HTMLElement): string {
  if (!element) return '';
  
  // Use textContent to get plain text without HTML tags
  const textContent = element.textContent || '';
  
  // Clean up extra whitespace and normalize line breaks
  return textContent
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n\n')  // Preserve paragraph breaks
    .trim();
}

/**
 * Removes code blocks from markdown text to focus on natural language content.
 * Removes:
 * - Fenced code blocks (```...```)
 * - Inline code (`...`)
 * - HTML code blocks (<pre>, <code>)
 */
export function removeCodeBlocks(text: string): string {
  if (!text) return '';
  
  let cleanedText = text;
  
  // Remove fenced code blocks (```...```)
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code blocks (`...`)
  cleanedText = cleanedText.replace(/`[^`\n]*`/g, '');
  
  // Remove HTML code blocks (<pre>...</pre>)
  cleanedText = cleanedText.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '');
  
  // Remove HTML code elements (<code>...</code>)
  cleanedText = cleanedText.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '');
  
  // Clean up extra whitespace that might be left after removing code blocks
  cleanedText = cleanedText
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Replace multiple line breaks with double
    .replace(/^\s+|\s+$/g, '')  // Trim start and end
    .replace(/[ \t]+/g, ' ');  // Replace multiple spaces/tabs with single space
  
  return cleanedText;
}

/**
 * Sanitizes HTML element content for LLM processing by extracting text
 * and removing code blocks.
 */
export function sanitizeForLLM(element: HTMLElement): string {
  const textContent = extractTextContent(element);
  return removeCodeBlocks(textContent);
}

/**
 * Validates if the content is suitable for processing (has meaningful text).
 */
export function isValidContent(content: string): boolean {
  if (!content) return false;
  
  const trimmed = content.trim();
  
  // Check minimum length
  if (trimmed.length < 10) return false;
  
  // Check if it's not just whitespace or punctuation
  const meaningfulChars = trimmed.replace(/[\s\n\r\t.,!?;:()[\]{}"'-]/g, '');
  if (meaningfulChars.length < 5) return false;
  
  return true;
}

/**
 * Preprocesses content for specific LLM tasks.
 */
export function preprocessForTranslation(content: string): string {
  const cleaned = removeCodeBlocks(content);
  
  // Additional preprocessing for translation
  return cleaned
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert markdown links to plain text
    .replace(/#{1,6}\s*/g, '')  // Remove markdown headers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // Remove markdown emphasis
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')  // Remove markdown emphasis
    .trim();
}

/**
 * Preprocesses content for summarization.
 */
export function preprocessForSummarization(content: string): string {
  const cleaned = removeCodeBlocks(content);
  
  // Keep structure markers for better summarization
  return cleaned
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert links to plain text
    .trim();
}

/**
 * Gets a preview of the content for user confirmation.
 */
export function getContentPreview(content: string, maxLength: number = 100): string {
  if (!content) return '';
  
  const cleaned = content.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength - 3) + '...';
}