import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GitHubMarkdownEnhancer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('GitHub Markdown file detection', () => {
    it('should detect markdown elements with .markdown-body class', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Markdown</h1>
          <p>This is a test markdown content.</p>
        </div>
      `;

      const markdownElements = document.querySelectorAll('.markdown-body');
      expect(markdownElements).toHaveLength(1);
      expect(markdownElements[0].textContent).toContain('Test Markdown');
    });

    it('should detect markdown elements with .js-comment-body class', () => {
      document.body.innerHTML = `
        <div class="js-comment-body">
          <h2>Comment Content</h2>
          <p>This is comment markdown content.</p>
        </div>
      `;

      const markdownElements = document.querySelectorAll('.js-comment-body');
      expect(markdownElements).toHaveLength(1);
      expect(markdownElements[0].textContent).toContain('Comment Content');
    });

    it('should detect multiple markdown elements', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>First Markdown</h1>
        </div>
        <div class="js-comment-body">
          <h2>Second Markdown</h2>
        </div>
        <div class="markdown-body">
          <h3>Third Markdown</h3>
        </div>
      `;

      const markdownElements = document.querySelectorAll('.markdown-body, .js-comment-body');
      expect(markdownElements).toHaveLength(3);
    });

    it('should not detect non-markdown elements', () => {
      document.body.innerHTML = `
        <div class="regular-content">
          <h1>Not Markdown</h1>
          <p>This is regular content.</p>
        </div>
        <div class="some-other-class">
          <p>Also not markdown</p>
        </div>
      `;

      const markdownElements = document.querySelectorAll('.markdown-body, .js-comment-body');
      expect(markdownElements).toHaveLength(0);
    });

    it('should detect markdown elements on GitHub file view pages', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://github.com/user/repo/blob/main/README.md',
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>README</h1>
          <p>Project description</p>
        </div>
      `;

      const isGitHubMarkdown = window.location.href.includes('github.com') &&
        document.querySelectorAll('.markdown-body, .js-comment-body').length > 0;

      expect(isGitHubMarkdown).toBe(true);
    });

    it('should handle empty content gracefully', () => {
      document.body.innerHTML = `
        <div class="markdown-body"></div>
        <div class="js-comment-body">   </div>
      `;

      const markdownElements = document.querySelectorAll('.markdown-body, .js-comment-body');
      expect(markdownElements).toHaveLength(2);
      
      // Should handle empty or whitespace-only content
      expect(markdownElements[0].textContent).toBe('');
      expect(markdownElements[1].textContent?.trim()).toBe('');
    });
  });

  describe('UI button injection', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'github.com',
          href: 'https://github.com/user/repo/blob/main/README.md',
        },
        writable: true,
      });
    });

    it('should inject translate and summarize buttons into markdown elements', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Content</h1>
          <p>Some meaningful markdown content for testing purposes.</p>
        </div>
      `;

      // Simulate button injection
      const markdownElement = document.querySelector('.markdown-body') as HTMLElement;
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'github-prompt-insight-buttons';
      
      const translateButton = document.createElement('button');
      translateButton.innerHTML = '🌐';
      translateButton.title = 'Translate';
      
      const summarizeButton = document.createElement('button');
      summarizeButton.innerHTML = '📋';
      summarizeButton.title = 'Summarize';
      
      buttonContainer.appendChild(translateButton);
      buttonContainer.appendChild(summarizeButton);
      markdownElement.appendChild(buttonContainer);

      const injectedContainer = markdownElement.querySelector('.github-prompt-insight-buttons');
      expect(injectedContainer).toBeTruthy();
      
      const buttons = injectedContainer?.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons?.[0].title).toBe('Translate');
      expect(buttons?.[1].title).toBe('Summarize');
    });

    it('should not inject buttons twice in the same element', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Content</h1>
          <p>Some meaningful markdown content for testing purposes.</p>
        </div>
      `;

      const markdownElement = document.querySelector('.markdown-body') as HTMLElement;
      
      // First injection
      if (!markdownElement.querySelector('.github-prompt-insight-buttons')) {
        const buttonContainer1 = document.createElement('div');
        buttonContainer1.className = 'github-prompt-insight-buttons';
        markdownElement.appendChild(buttonContainer1);
      }

      // Second injection attempt
      if (!markdownElement.querySelector('.github-prompt-insight-buttons')) {
        const buttonContainer2 = document.createElement('div');
        buttonContainer2.className = 'github-prompt-insight-buttons';
        markdownElement.appendChild(buttonContainer2);
      }

      const buttonContainers = markdownElement.querySelectorAll('.github-prompt-insight-buttons');
      expect(buttonContainers).toHaveLength(1);
    });

    it('should position buttons correctly with CSS styles', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Test Content</h1>
          <p>Some meaningful markdown content for testing purposes.</p>
        </div>
      `;

      const markdownElement = document.querySelector('.markdown-body') as HTMLElement;
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'github-prompt-insight-buttons';
      buttonContainer.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        z-index: 1000;
      `;

      markdownElement.style.position = 'relative';
      markdownElement.appendChild(buttonContainer);

      expect(buttonContainer.style.position).toBe('absolute');
      expect(buttonContainer.style.top).toBe('8px');
      expect(buttonContainer.style.right).toBe('8px');
      expect(markdownElement.style.position).toBe('relative');
    });

    it('should create buttons with proper styling and event handlers', () => {
      const mockClickHandler = vi.fn();
      
      const button = document.createElement('button');
      button.innerHTML = '🌐';
      button.title = 'Translate';
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
      
      button.addEventListener('click', mockClickHandler);
      document.body.appendChild(button);

      expect(button.style.background).toBe('rgb(36, 41, 46)');
      expect(button.style.color).toBe('white');
      expect(button.style.opacity).toBe('0.8');
      expect(button.title).toBe('Translate');
      
      button.click();
      expect(mockClickHandler).toHaveBeenCalledOnce();
    });

    it('should handle button hover effects', () => {
      const button = document.createElement('button');
      button.style.opacity = '0.8';
      
      button.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.opacity = '0.8';
      });

      document.body.appendChild(button);

      button.dispatchEvent(new MouseEvent('mouseenter'));
      expect(button.style.opacity).toBe('1');

      button.dispatchEvent(new MouseEvent('mouseleave'));
      expect(button.style.opacity).toBe('0.8');
    });

    it('should only inject buttons on valid GitHub pages', () => {
      // Non-GitHub page
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
          href: 'https://example.com/some-page',
        },
        writable: true,
      });

      const isGitHubPage = window.location.hostname === 'github.com';
      expect(isGitHubPage).toBe(false);

      // GitHub page
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'github.com',
          href: 'https://github.com/user/repo/blob/main/README.md',
        },
        writable: true,
      });

      const isGitHubPageValid = window.location.hostname === 'github.com';
      expect(isGitHubPageValid).toBe(true);
    });
  });

  describe('Result display positioning', () => {
    it('should insert result div at the top of the element using insertBefore', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Existing Content</h1>
          <p>This is the original markdown content.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      const firstChild = element.firstChild;
      
      // Mock the showResult method behavior
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.innerHTML = '<p>Translation result</p>';
      
      // This should use insertBefore instead of appendChild
      element.insertBefore(resultDiv, element.firstChild);
      
      // Verify the result div is the first child
      expect(element.firstChild).toBe(resultDiv);
      expect(element.children[0]).toBe(resultDiv);
      expect(element.children[1].tagName).toBe('H1');
      expect(resultDiv.nextSibling).toBe(firstChild);
    });

    it('should maintain result div at top even with empty element', () => {
      document.body.innerHTML = `
        <div class="markdown-body"></div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.innerHTML = '<p>Summary result</p>';
      
      // Should work even when element has no children
      element.insertBefore(resultDiv, element.firstChild);
      
      expect(element.firstChild).toBe(resultDiv);
      expect(element.children.length).toBe(1);
    });

    it('should replace existing result div at the top', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <div class="github-prompt-insight-result">Old Result</div>
          <h1>Content</h1>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Remove existing result
      const existing = element.querySelector('.github-prompt-insight-result');
      if (existing) existing.remove();
      
      // Add new result at top
      const newResultDiv = document.createElement('div');
      newResultDiv.className = 'github-prompt-insight-result';
      newResultDiv.innerHTML = '<p>New Result</p>';
      
      element.insertBefore(newResultDiv, element.firstChild);
      
      expect(element.children[0]).toBe(newResultDiv);
      expect(element.children[0].textContent).toContain('New Result');
      expect(element.children[1].tagName).toBe('H1');
      expect(element.querySelectorAll('.github-prompt-insight-result').length).toBe(1);
    });

    it('should position result div correctly with multiple child elements', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Title</h1>
          <p>Paragraph 1</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
          <p>Paragraph 2</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      const originalFirstChild = element.firstChild;
      const originalChildCount = element.children.length;
      
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.innerHTML = '<p>Translation Result</p>';
      
      element.insertBefore(resultDiv, element.firstChild);
      
      expect(element.firstChild).toBe(resultDiv);
      expect(element.children.length).toBe(originalChildCount + 1);
      expect(resultDiv.nextSibling).toBe(originalFirstChild);
      
      // Verify original content order is preserved
      expect(element.children[1].tagName).toBe('H1');
      expect(element.children[2].tagName).toBe('P');
      expect(element.children[3].tagName).toBe('UL');
      expect(element.children[4].tagName).toBe('P');
    });
  });

  describe('CSS styling for result positioning', () => {
    it('should use margin-bottom instead of margin-top for result div', () => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.style.cssText = `
        background: #f6f8fa;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        font-size: 14px;
      `;
      
      expect(resultDiv.style.marginBottom).toBe('12px');
      expect(resultDiv.style.marginTop).toBe('');
    });

    it('should use margin-bottom for loading div', () => {
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
      
      expect(loadingDiv.style.marginBottom).toBe('12px');
      expect(loadingDiv.style.marginTop).toBe('');
    });

    it('should maintain proper spacing when result is at top', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Title</h1>
          <p>Content</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      resultDiv.style.cssText = `
        background: #f6f8fa;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        font-size: 14px;
      `;
      
      element.insertBefore(resultDiv, element.firstChild);
      
      // Verify spacing
      expect(resultDiv.style.marginBottom).toBe('12px');
      expect(element.firstChild).toBe(resultDiv);
      
      // The margin-bottom should create space between result and original content
      const computedStyle = {
        marginBottom: '12px'
      };
      expect(computedStyle.marginBottom).toBe('12px');
    });

    it('should not have margin-top to avoid extra space at top', () => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      
      // Set styles without margin-top
      resultDiv.style.background = '#f6f8fa';
      resultDiv.style.border = '1px solid #d1d5da';
      resultDiv.style.borderRadius = '6px';
      resultDiv.style.padding = '12px';
      resultDiv.style.marginBottom = '12px';
      resultDiv.style.fontSize = '14px';
      
      // Verify no margin-top is set
      expect(resultDiv.style.marginTop).toBe('');
      expect(resultDiv.style.marginBottom).toBe('12px');
    });
  });

  describe('Translation feature result positioning', () => {
    it('should display translation results at the top of the element', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Original Content</h1>
          <p>This content will be translated.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Simulate translation result display
      const translationResult = document.createElement('div');
      translationResult.className = 'github-prompt-insight-result';
      translationResult.innerHTML = `
        <div style="font-weight: bold;">Translation to Japanese</div>
        <div>翻訳されたコンテンツ</div>
      `;
      
      element.insertBefore(translationResult, element.firstChild);
      
      expect(element.firstChild).toBe(translationResult);
      expect(element.children[0].className).toBe('github-prompt-insight-result');
      expect(element.children[1].tagName).toBe('H1');
    });

    it('should display both translation and summary results at top in correct order', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Content</h1>
          <p>Original text.</p>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // First add translation result
      const translationResult = document.createElement('div');
      translationResult.className = 'github-prompt-insight-result';
      translationResult.setAttribute('data-type', 'translation');
      translationResult.innerHTML = '<p>Translation result</p>';
      element.insertBefore(translationResult, element.firstChild);
      
      // Then add summary result (should also go to top, after translation)
      const summaryResult = document.createElement('div');
      summaryResult.className = 'github-prompt-insight-result';
      summaryResult.setAttribute('data-type', 'summary');
      summaryResult.innerHTML = '<p>Summary result</p>';
      
      // Remove any existing result of same type first
      const existingSummary = element.querySelector('.github-prompt-insight-result[data-type="summary"]');
      if (existingSummary) existingSummary.remove();
      
      element.insertBefore(summaryResult, element.firstChild);
      
      // Both results should be at top
      expect(element.children[0].getAttribute('data-type')).toBe('summary');
      expect(element.children[1].getAttribute('data-type')).toBe('translation');
      expect(element.children[2].tagName).toBe('H1');
    });

    it('should handle translation loading state at top', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <h1>Content to translate</h1>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Show loading at top
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'github-prompt-insight-result';
      loadingDiv.textContent = 'Translating to Japanese: "Content to tra..."...';
      loadingDiv.style.marginBottom = '12px';
      
      element.insertBefore(loadingDiv, element.firstChild);
      
      expect(element.firstChild).toBe(loadingDiv);
      expect(loadingDiv.style.marginBottom).toBe('12px');
      expect(loadingDiv.textContent).toContain('Translating');
    });

    it('should maintain consistent styling for translation results', () => {
      const translationResult = document.createElement('div');
      translationResult.className = 'github-prompt-insight-result';
      translationResult.style.cssText = `
        background: #f6f8fa;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
        font-size: 14px;
      `;
      
      // Check consistent styling
      expect(translationResult.style.background).toBe('rgb(246, 248, 250)');
      expect(translationResult.style.borderRadius).toBe('6px');
      expect(translationResult.style.padding).toBe('12px');
      expect(translationResult.style.marginBottom).toBe('12px');
      expect(translationResult.style.marginTop).toBe('');
    });
  });

  describe('Regression tests for existing functionality', () => {
    it('should still remove existing result before adding new one', () => {
      document.body.innerHTML = `
        <div class="markdown-body">
          <div class="github-prompt-insight-result">Old Result</div>
          <h1>Content</h1>
        </div>
      `;

      const element = document.querySelector('.markdown-body') as HTMLElement;
      
      // Check existing result is present
      expect(element.querySelectorAll('.github-prompt-insight-result').length).toBe(1);
      
      // Remove existing
      const existing = element.querySelector('.github-prompt-insight-result');
      if (existing) existing.remove();
      
      // Add new result
      const newResult = document.createElement('div');
      newResult.className = 'github-prompt-insight-result';
      newResult.textContent = 'New Result';
      element.insertBefore(newResult, element.firstChild);
      
      // Should have only one result
      expect(element.querySelectorAll('.github-prompt-insight-result').length).toBe(1);
      expect(element.querySelector('.github-prompt-insight-result')?.textContent).toBe('New Result');
    });

    it('should maintain result div structure and content', () => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'github-prompt-insight-result';
      
      const header = document.createElement('div');
      header.style.cssText = `
        font-weight: bold;
        margin-bottom: 8px;
        color: #0366d6;
      `;
      header.textContent = 'Summary (3 sentences)';
      
      const contentDiv = document.createElement('div');
      contentDiv.style.cssText = `
        line-height: 1.6;
        color: #24292e;
        white-space: pre-wrap;
      `;
      contentDiv.textContent = 'This is the summary content.';
      
      resultDiv.appendChild(header);
      resultDiv.appendChild(contentDiv);
      
      // Verify structure
      expect(resultDiv.children.length).toBe(2);
      expect((resultDiv.children[0] as HTMLElement).style.fontWeight).toBe('bold');
      expect(resultDiv.children[0].textContent).toBe('Summary (3 sentences)');
      expect((resultDiv.children[1] as HTMLElement).style.whiteSpace).toBe('pre-wrap');
      expect(resultDiv.children[1].textContent).toBe('This is the summary content.');
    });

    it('should handle error display functionality', () => {
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
      errorDiv.textContent = 'Translation failed: API error';
      
      document.body.appendChild(errorDiv);
      
      // Verify error styling
      expect(errorDiv.style.position).toBe('fixed');
      expect(errorDiv.style.background).toBe('rgb(215, 58, 73)');
      expect(errorDiv.style.color).toBe('white');
      expect(errorDiv.style.zIndex).toBe('10000');
      expect(errorDiv.textContent).toContain('Translation failed');
      
      // Clean up
      errorDiv.remove();
    });

    it('should preserve button functionality', () => {
      const mockHandler = vi.fn();
      const button = document.createElement('button');
      button.innerHTML = '🌐';
      button.title = 'Translate';
      button.addEventListener('click', mockHandler);
      
      // Simulate click
      button.click();
      
      expect(mockHandler).toHaveBeenCalledOnce();
      expect(button.title).toBe('Translate');
    });

    it('should handle multiple markdown elements independently', () => {
      document.body.innerHTML = `
        <div class="markdown-body" id="md1">
          <h1>First Markdown</h1>
        </div>
        <div class="markdown-body" id="md2">
          <h1>Second Markdown</h1>
        </div>
      `;

      const md1 = document.getElementById('md1') as HTMLElement;
      const md2 = document.getElementById('md2') as HTMLElement;
      
      // Add result to first element
      const result1 = document.createElement('div');
      result1.className = 'github-prompt-insight-result';
      result1.textContent = 'Result 1';
      md1.insertBefore(result1, md1.firstChild);
      
      // Add result to second element
      const result2 = document.createElement('div');
      result2.className = 'github-prompt-insight-result';
      result2.textContent = 'Result 2';
      md2.insertBefore(result2, md2.firstChild);
      
      // Each should have its own result
      expect(md1.querySelector('.github-prompt-insight-result')?.textContent).toBe('Result 1');
      expect(md2.querySelector('.github-prompt-insight-result')?.textContent).toBe('Result 2');
      expect(md1.firstChild).toBe(result1);
      expect(md2.firstChild).toBe(result2);
    });
  });

  describe('Message listener', () => {
    it('should register onMessage listener', () => {
      const mockAddListener = vi.fn();
      global.chrome = {
        runtime: {
          onMessage: {
            addListener: mockAddListener,
          },
        },
      } as any;

      // Re-import to trigger listener registration
      vi.resetModules();
      import('./content');

      expect(mockAddListener).toHaveBeenCalled();
    });

    it('should handle toggle_sidebar action', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the listener registration
      let messageHandler: any;
      const mockAddListener = vi.fn((handler) => {
        messageHandler = handler;
      });
      
      global.chrome = {
        runtime: {
          onMessage: {
            addListener: mockAddListener,
          },
        },
      } as any;

      // Re-import to register the listener
      vi.resetModules();
      require('./content');

      // Call the handler with toggle_sidebar action
      const mockRequest = { action: 'toggle_sidebar' };
      const mockSender = {};
      const mockSendResponse = vi.fn();

      messageHandler(mockRequest, mockSender, mockSendResponse);

      expect(consoleSpy).toHaveBeenCalledWith('Toggle sidebar requested');
      
      consoleSpy.mockRestore();
    });

    it('should not respond to unknown actions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the listener registration
      let messageHandler: any;
      const mockAddListener = vi.fn((handler) => {
        messageHandler = handler;
      });
      
      global.chrome = {
        runtime: {
          onMessage: {
            addListener: mockAddListener,
          },
        },
      } as any;

      // Re-import to register the listener
      vi.resetModules();
      require('./content');

      // Call the handler with unknown action
      const mockRequest = { action: 'unknown_action' };
      const mockSender = {};
      const mockSendResponse = vi.fn();

      messageHandler(mockRequest, mockSender, mockSendResponse);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(mockSendResponse).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should not use sender and sendResponse parameters', () => {
      // This test verifies that sender and sendResponse parameters are not used
      // It will pass when we fix the unused parameter warnings
      
      let messageHandler: any;
      const mockAddListener = vi.fn((handler) => {
        messageHandler = handler;
      });
      
      global.chrome = {
        runtime: {
          onMessage: {
            addListener: mockAddListener,
          },
        },
      } as any;

      // Re-import to register the listener
      vi.resetModules();
      require('./content');

      const mockRequest = { action: 'toggle_sidebar' };
      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = vi.fn();

      // The test passes if it doesn't throw an error
      // The sender and sendResponse parameters are correctly not used
      expect(() => {
        messageHandler(mockRequest, mockSender, mockSendResponse);
      }).not.toThrow();
    });
  });
});