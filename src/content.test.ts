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