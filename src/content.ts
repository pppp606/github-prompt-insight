import { LLMWrapper, LLMConfig } from './llm';

interface ExtensionConfig {
  llmProvider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model?: string;
  defaultLanguage: string;
}

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
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'get_extension_config' },
        (response) => {
          resolve(response.extensionConfig || null);
        }
      );
    });
  }

  private setupUI(): void {
    if (this.isMarkdownFile()) {
      this.addButtonsToMarkdownFile();
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (this.isMarkdownFile()) {
              this.addButtonsToMarkdownFile();
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private isMarkdownFile(): boolean {
    const pathname = window.location.pathname;
    const supportedExtensions = ['.md', '.mdc', '.markdown'];
    return supportedExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes('/blob/') && supportedExtensions.some(ext => pathname.includes(ext));
  }

  private addButtonsToMarkdownFile(): void {
    const fileActions = document.querySelector('.Box-header .d-flex .BtnGroup, .Box-header .d-flex .btn-group');
    if (!fileActions || fileActions.querySelector('.github-markdown-ai-buttons')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'github-markdown-ai-buttons BtnGroup ml-2';
    buttonContainer.style.cssText = `
      display: flex;
      margin-left: 8px;
    `;

    const translateButton = this.createActionButton('🌐', 'Translate to Japanese', () => {
      this.translateMarkdownFile();
    });

    const summarizeButton = this.createActionButton('📋', 'Summarize', () => {
      this.summarizeMarkdownFile();
    });

    buttonContainer.appendChild(translateButton);
    buttonContainer.appendChild(summarizeButton);

    fileActions.appendChild(buttonContainer);
  }

  private createActionButton(icon: string, title: string, onclick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = `${icon} ${title.split(' ')[0]}`;
    button.title = title;
    button.className = 'btn btn-sm';
    button.style.cssText = `
      background: #f6f8fa;
      border: 1px solid #d1d5da;
      color: #24292e;
      border-radius: 6px;
      padding: 5px 12px;
      cursor: pointer;
      font-size: 12px;
      margin-right: 4px;
      transition: background-color 0.2s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#e1e4e8';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#f6f8fa';
    });
    
    button.addEventListener('click', onclick);
    
    return button;
  }

  private async translateMarkdownFile(): Promise<void> {
    const markdownBody = document.querySelector('.markdown-body') || document.querySelector('.js-comment-body');
    if (markdownBody) {
      await this.translateElement(markdownBody as HTMLElement);
    }
  }

  private async summarizeMarkdownFile(): Promise<void> {
    const markdownBody = document.querySelector('.markdown-body') || document.querySelector('.js-comment-body');
    if (markdownBody) {
      await this.summarizeElement(markdownBody as HTMLElement);
    }
  }


  private async translateElement(element: HTMLElement): Promise<void> {
    if (!this.llmWrapper) {
      this.showError('Please configure API settings first');
      return;
    }

    const processedText = this.extractAndProcessMarkdownContent(element);
    if (!processedText.trim()) {
      this.showError('No content found to translate');
      return;
    }

    const targetLanguage = this.config?.defaultLanguage || 'Japanese';
    
    try {
      this.showLoading(element, 'Translating...');
      const response = await this.llmWrapper.translateText(processedText, targetLanguage);
      this.showResult(element, response.content, 'Translation');
    } catch (error) {
      this.showError(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async summarizeElement(element: HTMLElement): Promise<void> {
    if (!this.llmWrapper) {
      this.showError('Please configure API settings first');
      return;
    }

    const processedText = this.extractAndProcessMarkdownContent(element);
    if (!processedText.trim()) {
      this.showError('No content found to summarize');
      return;
    }
    
    try {
      this.showLoading(element, 'Summarizing...');
      const response = await this.llmWrapper.summarizeText(processedText);
      this.showResult(element, response.content, 'Summary');
    } catch (error) {
      this.showError(`Summarization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractAndProcessMarkdownContent(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove code blocks, inline code, and other elements that shouldn't be processed
    const elementsToRemove = [
      'pre', 'code', 
      '.highlight', '.js-file-line-container',
      '.diff-table', '.js-diff-table',
      '.github-markdown-ai-buttons', '.github-prompt-insight-result',
      '.js-details-container', '.js-navigation-container'
    ];
    
    elementsToRemove.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Extract text content while preserving structure
    const textContent = clone.textContent || '';
    
    // Clean up the text
    return textContent
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
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