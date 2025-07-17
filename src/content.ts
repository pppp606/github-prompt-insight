import { LLMWrapper, LLMConfig } from './llm';
import { sanitizeForLLM } from './utils/textProcessor';
import { ExtensionConfig, storageManager } from './utils/storage';
import { translateElement, getTranslationPreview, formatTranslationResult } from './utils/translate';
import { summarizeElement, getSummaryPreview, formatSummaryResult, getOptimalSummaryLength } from './utils/summarize';

class GitHubMarkdownEnhancer {
  private config: ExtensionConfig | null = null;
  private llmWrapper: LLMWrapper | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.config = await this.loadConfig();
      if (this.config && this.config.apiKey) {
        const llmConfig: LLMConfig = {
          provider: this.config.llmProvider,
          apiKey: this.config.apiKey,
          model: this.config.model,
        };
        this.llmWrapper = new LLMWrapper(llmConfig);
      }
      this.isInitialized = true;
      this.setupUI();
    } catch (error) {
      console.error('Failed to initialize GitHub Markdown Enhancer:', error);
    }
  }

  private async loadConfig(): Promise<ExtensionConfig | null> {
    try {
      return await storageManager.getConfigViaRuntime();
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  }

  private setupUI(): void {
    if (!this.isGitHubPage()) return;

    const markdownElements = this.detectMarkdownElements();
    
    markdownElements.forEach((element) => {
      this.addEnhancementButtons(element as HTMLElement);
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const markdownNodes = this.detectMarkdownElements(element);
            markdownNodes.forEach((mdElement) => {
              this.addEnhancementButtons(mdElement as HTMLElement);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private isGitHubPage(): boolean {
    return window.location.hostname === 'github.com';
  }

  private detectMarkdownElements(container: HTMLElement | Document = document): HTMLElement[] {
    const selectors = [
      '.markdown-body',           // Main markdown content
      '.js-comment-body',         // Comment bodies
      '.markdown-body[data-type="markdown"]', // Specific markdown files
      '.Box-body .markdown-body', // File content in boxes
    ];

    const elements: HTMLElement[] = [];
    selectors.forEach(selector => {
      const found = container.querySelectorAll(selector);
      found.forEach(el => {
        if (this.isValidMarkdownElement(el as HTMLElement)) {
          elements.push(el as HTMLElement);
        }
      });
    });

    return elements;
  }

  private isValidMarkdownElement(element: HTMLElement): boolean {
    // Check if element has meaningful content
    const textContent = element.textContent?.trim();
    if (!textContent || textContent.length < 10) return false;

    // Only target blob pages as per requirement
    const url = window.location.href;
    const isBlobView = url.includes('/blob/');

    return isBlobView;
  }

  private addEnhancementButtons(element: HTMLElement): void {
    // Check if we've already added buttons
    if (document.querySelector('.github-prompt-insight-translate') || 
        document.querySelector('.github-prompt-insight-summarize')) {
      return;
    }

    // Find the existing button group (usually contains Raw, Copy, Download)
    const buttonGroup = this.findExistingButtonGroup();
    
    if (buttonGroup) {
      // Integrate with existing button group
      this.integrateWithButtonGroup(buttonGroup, element);
    } else {
      // Fallback: Create standalone buttons if no button group found
      this.createStandaloneButtons(element);
    }
  }

  private findExistingButtonGroup(): Element | null {
    // Common selectors for GitHub's button groups on blob pages
    const selectors = [
      '.BtnGroup:has(a[href*="/raw/"])', // Button group containing Raw button
      '.btn-group:has(a[href*="/raw/"])',
      '.d-flex.gap-2:has(a[href*="/raw/"])',
      '.react-blob-header-edit-and-raw-actions .BtnGroup',
      '.Box-header .BtnGroup',
      '.prc-ButtonGroup-ButtonGroup-vcMeG', // New Primer React button group class
      // Fallback: any button group near the file content
      '.repository-content .BtnGroup',
      '.file-navigation .BtnGroup'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
      } catch (e) {
        // :has() might not be supported in all browsers, continue
        continue;
      }
    }

    // Alternative approach: Find Raw button and get its parent group
    const rawButton = document.querySelector('a[href*="/raw/"]');
    if (rawButton) {
      let parent = rawButton.parentElement;
      while (parent && parent !== document.body) {
        if (parent.classList.contains('BtnGroup') || 
            parent.classList.contains('btn-group') ||
            parent.getAttribute('role') === 'group') {
          return parent;
        }
        parent = parent.parentElement;
      }
    }

    return null;
  }

  private integrateWithButtonGroup(buttonGroup: Element, markdownElement: HTMLElement): void {
    const translateButton = this.createPrimerButton('Translate', 'github-prompt-insight-translate', () => {
      this.translateElement(markdownElement);
    });

    const summarizeButton = this.createPrimerButton('Summarize', 'github-prompt-insight-summarize', () => {
      this.summarizeElement(markdownElement);
    });

    // Wrap buttons in div containers for new Primer React structure
    const translateContainer = document.createElement('div');
    translateContainer.appendChild(translateButton);
    
    const summarizeContainer = document.createElement('div');
    summarizeContainer.appendChild(summarizeButton);

    // Insert buttons at the end of the button group
    buttonGroup.appendChild(translateContainer);
    buttonGroup.appendChild(summarizeContainer);
  }

  private createStandaloneButtons(element: HTMLElement): void {
    // Fallback implementation when no button group is found
    console.warn('GitHub Prompt Insight: No button group found, creating standalone buttons');
    
    const container = document.createElement('div');
    container.className = 'github-prompt-insight-buttons d-flex gap-2 mb-3';
    
    const translateButton = this.createPrimerButton('Translate', 'github-prompt-insight-translate', () => {
      this.translateElement(element);
    });

    const summarizeButton = this.createPrimerButton('Summarize', 'github-prompt-insight-summarize', () => {
      this.summarizeElement(element);
    });

    container.appendChild(translateButton);
    container.appendChild(summarizeButton);

    // Insert before the markdown content
    element.parentElement?.insertBefore(container, element);
  }

  private createPrimerButton(text: string, className: string, onclick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    
    // Use GitHub's new Primer React CSS classes
    button.className = `btn btn-sm prc-Button-ButtonBase-c50BI ${className}`;
    button.type = 'button';
    button.textContent = text;
    
    button.addEventListener('click', onclick);
    
    return button;
  }

  // Removed createButton method - now using createPrimerButton instead

  private async translateElement(element: HTMLElement): Promise<void> {
    if (!this.llmWrapper) {
      this.showError('Please configure API settings first');
      return;
    }

    const targetLanguage = this.config?.defaultLanguage || 'Japanese';
    const rawText = sanitizeForLLM(element);
    const preview = getTranslationPreview(rawText, 60);
    
    try {
      this.showLoading(element, `Translating to ${targetLanguage}: "${preview}"...`);
      
      const response = await translateElement(element, targetLanguage, this.llmWrapper);
      
      // Format the result for better presentation
      const formattedResult = formatTranslationResult(
        rawText,
        response.content,
        targetLanguage,
        response.provider
      );
      
      this.showResult(element, formattedResult, `Translation to ${targetLanguage}`);
    } catch (error) {
      this.showError(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async summarizeElement(element: HTMLElement): Promise<void> {
    if (!this.llmWrapper) {
      this.showError('Please configure API settings first');
      return;
    }

    const rawText = sanitizeForLLM(element);
    const preview = getSummaryPreview(rawText, 60);
    
    // Determine optimal summary length based on content
    const optimalLength = getOptimalSummaryLength(rawText, 'documentation');
    
    // Get language from configuration, fallback to English if not set
    const targetLanguage = this.config?.defaultLanguage || 'English';
    
    try {
      this.showLoading(element, `Summarizing in ${targetLanguage}: "${preview}"...`);
      
      const response = await summarizeElement(element, this.llmWrapper, optimalLength, targetLanguage);
      
      // Format the result for better presentation
      const formattedResult = formatSummaryResult(
        rawText,
        response.content,
        response.provider
      );
      
      this.showResult(element, formattedResult, `Summary in ${targetLanguage} (${optimalLength} sentence${optimalLength > 1 ? 's' : ''})`);
    } catch (error) {
      this.showError(`Summarization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private showLoading(element: HTMLElement, message: string): void {
    const existing = element.querySelector('.github-prompt-insight-result');
    if (existing) existing.remove();

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'github-prompt-insight-result';
    loadingDiv.style.cssText = `
      background: #f6f8fa;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #586069;
    `;
    loadingDiv.textContent = message;
    
    element.insertBefore(loadingDiv, element.firstChild);
  }

  private showResult(element: HTMLElement, content: string, type: string): void {
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
    element.insertBefore(resultDiv, element.firstChild);
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #d73a49;
      color: white;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

const enhancer = new GitHubMarkdownEnhancer();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => enhancer.initialize());
} else {
  enhancer.initialize();
}

chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'toggle_sidebar') {
    console.log('Toggle sidebar requested');
  }
});

export {};