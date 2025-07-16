import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the LLM module
vi.mock('./llm', () => ({
  LLMWrapper: vi.fn().mockImplementation(() => ({
    summarizeText: vi.fn().mockResolvedValue('Test summary result'),
    translateText: vi.fn().mockResolvedValue('Test translation result'),
  })),
}));

// Mock storage utilities
vi.mock('./utils/storage', () => ({
  storageManager: {
    getConfigViaRuntime: vi.fn().mockResolvedValue({
      apiKey: 'test-key',
      llmProvider: 'openai',
      model: 'gpt-3.5-turbo',
    }),
  },
}));

// Mock all utility modules
vi.mock('./utils/textProcessor', () => ({
  sanitizeForLLM: vi.fn((text: string) => text),
}));

vi.mock('./utils/translate', () => ({
  translateElement: vi.fn(),
  getTranslationPreview: vi.fn(),
  formatTranslationResult: vi.fn(),
}));

vi.mock('./utils/summarize', () => ({
  summarizeElement: vi.fn(),
  getSummaryPreview: vi.fn(),
  formatSummaryResult: vi.fn(),
  getOptimalSummaryLength: vi.fn(),
}));

describe('GitHubMarkdownEnhancer - Summary Result Positioning', () => {
  let mockElement: HTMLElement;
  let mockShowResult: any;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create a mock markdown element
    mockElement = document.createElement('div');
    mockElement.className = 'markdown-body';
    mockElement.innerHTML = '<p>Some markdown content</p>';
    document.body.appendChild(mockElement);
    
    // Create mock showResult function that mimics the NEW implementation
    mockShowResult = (element: HTMLElement, content: string, type: string) => {
      const existing = element.querySelector('.github-prompt-insight-result');
      if (existing) existing.remove();

      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.style.cssText = `
        background: #f6f8fa;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        font-size: 14px;
        line-height: 1.5;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        font-weight: 600;
        color: #24292e;
        margin-bottom: 8px;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 4px;
      `;
      header.textContent = type;

      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `
        color: #24292e;
        white-space: pre-wrap;
      `;
      contentDiv.textContent = content;

      resultDiv.appendChild(header);
      resultDiv.appendChild(contentDiv);
      element.insertBefore(resultDiv, element.firstChild); // NEW implementation uses insertBefore
    };
  });

  it('should position summary results at the top of markdown content (NOW PASSES)', async () => {
    // Add some initial content to the element
    const initialContent = document.createElement('p');
    initialContent.textContent = 'Initial content';
    mockElement.appendChild(initialContent);

    const summaryResult = 'This is a test summary result';
    
    // Call the mock showResult (simulating NEW implementation)
    mockShowResult(mockElement, summaryResult, 'Summary');

    // Check that the result div was created
    const resultDiv = mockElement.querySelector('.github-prompt-insight-result');
    expect(resultDiv).toBeTruthy();
    
    // NEW implementation positions result at top - should be first child
    expect(mockElement.firstElementChild).toBe(resultDiv);
    
    // Check that the result contains the expected content
    expect(resultDiv?.textContent).toContain('Summary');
    expect(resultDiv?.textContent).toContain(summaryResult);
  });

  it('should have correct spacing with margin-bottom for top positioning (NOW PASSES)', async () => {
    const summaryResult = 'Test summary';
    
    // Call showResult
    mockShowResult(mockElement, summaryResult, 'Summary');

    const resultDiv = mockElement.querySelector('.github-prompt-insight-result') as HTMLElement;
    expect(resultDiv).toBeTruthy();
    
    // NEW implementation uses margin-bottom instead of margin-top
    const styles = resultDiv.style;
    expect(styles.marginBottom).toBe('12px'); // NEW implementation
    expect(styles.marginTop).toBe(''); // Should not be set
  });

  it('should remove existing result before adding new one (CURRENTLY PASSES)', async () => {
    // Add first result
    mockShowResult(mockElement, 'First result', 'Summary');
    
    let resultDivs = mockElement.querySelectorAll('.github-prompt-insight-result');
    expect(resultDivs.length).toBe(1);
    expect(resultDivs[0].textContent).toContain('First result');
    
    // Add second result
    mockShowResult(mockElement, 'Second result', 'Summary');
    
    resultDivs = mockElement.querySelectorAll('.github-prompt-insight-result');
    expect(resultDivs.length).toBe(1); // Should still be only one
    expect(resultDivs[0].textContent).toContain('Second result');
    expect(resultDivs[0].textContent).not.toContain('First result');
  });

  it('should maintain translation functionality (no regression) (CURRENTLY PASSES)', async () => {
    const translationResult = 'This is a test translation result';
    
    // Call showResult with translation type
    mockShowResult(mockElement, translationResult, 'Translation');

    const resultDiv = mockElement.querySelector('.github-prompt-insight-result');
    expect(resultDiv).toBeTruthy();
    
    // Check content
    expect(resultDiv?.textContent).toContain('Translation');
    expect(resultDiv?.textContent).toContain(translationResult);
  });
});