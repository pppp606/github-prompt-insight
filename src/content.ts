import { LLMWrapper, LLMConfig } from './llm';
import { sanitizeForLLM } from './utils/textProcessor';
import { ExtensionConfig, storageManager } from './utils/storage';
import { summarizeElement, formatSummaryResult, getOptimalSummaryLength } from './utils/summarize';

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

    // Add CSS for loading spinner animation
    this.addLoadingSpinnerStyles();

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
    // Check if we've already added button
    if (document.querySelector('.github-prompt-insight-summarize')) {
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
    const summarizeButton = this.createPrimerButton('Summarize', 'github-prompt-insight-summarize', () => {
      this.summarizeElement(markdownElement);
    });

    // Wrap button in div container for new Primer React structure
    const summarizeContainer = document.createElement('div');
    summarizeContainer.appendChild(summarizeButton);

    // Insert button at the end of the button group
    buttonGroup.appendChild(summarizeContainer);
  }

  private createStandaloneButtons(element: HTMLElement): void {
    // Fallback implementation when no button group is found
    console.warn('GitHub Prompt Insight: No button group found, creating standalone button');
    
    const container = document.createElement('div');
    container.className = 'github-prompt-insight-buttons d-flex gap-2 mb-3';
    
    const summarizeButton = this.createPrimerButton('Summarize', 'github-prompt-insight-summarize', () => {
      this.summarizeElement(element);
    });

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
    
    // Apply inline styles to override default styles
    button.style.cssText = `
      padding: 0px 6px;
      height: 28px;
      border-radius: 0;
    `;
    
    button.addEventListener('click', onclick);
    
    return button;
  }

  // Removed createButton method - now using createPrimerButton instead

  private async summarizeElement(element: HTMLElement): Promise<void> {
    if (!this.llmWrapper) {
      this.showError('Please configure API settings first');
      return;
    }

    const rawText = sanitizeForLLM(element);
    
    // Determine optimal summary length based on content
    const optimalLength = getOptimalSummaryLength(rawText, 'documentation');
    
    // Get language from configuration, fallback to English if not set
    const targetLanguage = this.config?.defaultLanguage || 'English';
    
    // Show loading state in button
    const button = document.querySelector('.github-prompt-insight-summarize') as HTMLButtonElement;
    const originalText = button?.textContent || 'Summarize';
    if (button) {
      button.disabled = true;
      button.innerHTML = `
        <span class="loading-spinner" style="
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid #586069;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 6px;
        "></span>
        Processing...
      `;
    }
    
    try {      
      const response = await summarizeElement(element, this.llmWrapper, optimalLength, targetLanguage);
      
      // Format the result for better presentation
      const formattedResult = formatSummaryResult(
        response.content
      );
      
      this.showResult(element, formattedResult, `Summary`);
    } catch (error) {
      this.showError(`Summarization failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Reset button state
      if (button) {
        button.disabled = false;
        button.innerHTML = originalText;
      }
    }
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
    contentDiv.className = 'markdown-body';
    contentDiv.style.cssText = `
      color: #24292e;
      background: transparent;
      font-size: 14px;
    `;
    contentDiv.innerHTML = this.parseMarkdown(content);

    resultDiv.appendChild(header);
    resultDiv.appendChild(contentDiv);
    element.insertBefore(resultDiv, element.firstChild);
  }

  private parseMarkdown(text: string): string {
    // Simple markdown parser for common elements
    let result = text
      // Headers (process from h4 to h1 to avoid conflicts)
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle nested lists
    result = this.parseNestedLists(result);

    // Continue with other formatting
    result = result
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraphs
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[hul])/g, '$1')
      .replace(/(<\/[hul]>)<\/p>/g, '$1');

    return result;
  }

  private parseNestedLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    const listStack: { type: 'ul' | 'ol'; indent: number }[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)(-|\d+\.) (.*)$/);
      
      if (match) {
        const indent = match[1].length;
        const marker = match[2];
        const content = match[3];
        const listType = marker === '-' ? 'ul' : 'ol';
        
        // Close lists if indentation decreased
        while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
          const closingList = listStack.pop()!;
          result.push(`</${closingList.type}>`);
        }
        
        // Open new list if needed
        if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
          result.push(`<${listType}>`);
          listStack.push({ type: listType, indent });
        }
        
        result.push(`<li>${content}</li>`);
      } else {
        // Close all open lists for non-list lines
        while (listStack.length > 0) {
          const closingList = listStack.pop()!;
          result.push(`</${closingList.type}>`);
        }
        result.push(line);
      }
    }
    
    // Close any remaining open lists
    while (listStack.length > 0) {
      const closingList = listStack.pop()!;
      result.push(`</${closingList.type}>`);
    }
    
    return result.join('\n');
  }

  private addLoadingSpinnerStyles(): void {
    // Check if styles already exist
    if (document.getElementById('github-prompt-insight-styles')) return;

    const style = document.createElement('style');
    style.id = 'github-prompt-insight-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
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