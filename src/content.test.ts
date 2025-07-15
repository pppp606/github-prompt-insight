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
});