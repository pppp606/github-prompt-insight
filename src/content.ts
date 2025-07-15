import { LLMWrapper, LLMConfig } from './llm';
import { sanitizeForLLM, preprocessForTranslation, preprocessForSummarization, isValidContent, getContentPreview } from './utils/textProcessor';
import { ExtensionConfig, storageManager } from './utils/storage';
import { translateElement, getTranslationPreview, formatTranslationResult } from './utils/translate';

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

    // Check if it's on a GitHub file page or issue/PR page
    const url = window.location.href;
    const isFileView = url.includes('/blob/') || url.includes('/tree/');
    const isIssueOrPR = url.includes('/issues/') || url.includes('/pull/');
    const isWiki = url.includes('/wiki/');

    return isFileView || isIssueOrPR || isWiki;
  }

  private addEnhancementButtons(element: HTMLElement): void {
    if (element.querySelector('.github-prompt-insight-buttons')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'github-prompt-insight-buttons';
    buttonContainer.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 6px;
      padding: 2px;
      backdrop-filter: blur(3px);
    `;

    const translateButton = this.createButton('🌐', 'Translate', () => {
      this.translateElement(element);
    });

    const summarizeButton = this.createButton('📋', 'Summarize', () => {
      this.summarizeElement(element);
    });

    buttonContainer.appendChild(translateButton);
    buttonContainer.appendChild(summarizeButton);

    // Ensure the parent element can contain absolutely positioned children
    const currentPosition = window.getComputedStyle(element).position;
    if (currentPosition === 'static') {
      element.style.position = 'relative';
    }
    
    element.appendChild(buttonContainer);

    // Add fade-in animation
    buttonContainer.style.opacity = '0';
    buttonContainer.style.transition = 'opacity 0.3s ease-in-out';
    setTimeout(() => {
      buttonContainer.style.opacity = '1';
    }, 10);
  }

  private createButton(icon: string, title: string, onclick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.style.cssText = `
      background: #24292e;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.8';
    });
    
    button.addEventListener('click', onclick);
    
    return button;
  }

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
    if (!isValidContent(rawText)) {
      this.showError('No meaningful content found to summarize');
      return;
    }

    const processedText = preprocessForSummarization(rawText);
    const preview = getContentPreview(processedText, 80);
    
    try {
      this.showLoading(element, `Summarizing: "${preview}"...`);
      const response = await this.llmWrapper.summarizeText(processedText);
      this.showResult(element, response.content, 'Summary');
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
      margin-top: 12px;
      font-size: 14px;
      color: #586069;
    `;
    loadingDiv.textContent = message;
    
    element.appendChild(loadingDiv);
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
      margin-top: 12px;
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
    element.appendChild(resultDiv);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_sidebar') {
    console.log('Toggle sidebar requested');
  }
});

export {};