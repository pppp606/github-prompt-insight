import { GitHubContext } from '@/types';

/**
 * Utility functions for GitHub integration
 */
export class GitHubUtils {
  /**
   * Extract GitHub context from current page
   */
  static extractContext(): GitHubContext | null {
    try {
      const url = new URL(window.location.href);
      const pathSegments = url.pathname.split('/').filter(Boolean);

      if (url.hostname !== 'github.com' || pathSegments.length < 2) {
        return null;
      }

      const [owner, repository, ...rest] = pathSegments;
      const branch = this.extractBranch(rest);
      const path = this.extractPath(rest);

      return {
        owner,
        repository,
        branch,
        path,
        fileContent: this.extractFileContent(),
        language: this.detectLanguage(path),
      };
    } catch (error) {
      console.error('Error extracting GitHub context:', error);
      return null;
    }
  }

  /**
   * Extract branch from path segments
   */
  private static extractBranch(segments: string[]): string {
    const blobIndex = segments.indexOf('blob');
    const treeIndex = segments.indexOf('tree');
    
    if (blobIndex !== -1 && segments[blobIndex + 1]) {
      return segments[blobIndex + 1];
    }
    
    if (treeIndex !== -1 && segments[treeIndex + 1]) {
      return segments[treeIndex + 1];
    }

    return 'main';
  }

  /**
   * Extract file path from URL segments
   */
  private static extractPath(segments: string[]): string {
    const blobIndex = segments.indexOf('blob');
    
    if (blobIndex !== -1 && segments.length > blobIndex + 2) {
      return segments.slice(blobIndex + 2).join('/');
    }

    return '';
  }

  /**
   * Extract file content from GitHub page
   */
  private static extractFileContent(): string | undefined {
    // Try to find file content in various GitHub page layouts
    const codeElement = document.querySelector('table.js-file-line-container');
    if (codeElement) {
      return codeElement.textContent || undefined;
    }

    const markdownElement = document.querySelector('article.markdown-body');
    if (markdownElement) {
      return markdownElement.textContent || undefined;
    }

    const readmeElement = document.querySelector('#readme');
    if (readmeElement) {
      return readmeElement.textContent || undefined;
    }

    return undefined;
  }

  /**
   * Detect programming language from file path
   */
  private static detectLanguage(path: string): string | undefined {
    const extension = path.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'zsh',
      'fish': 'fish',
      'ps1': 'powershell',
      'sql': 'sql',
      'r': 'r',
      'matlab': 'matlab',
      'tex': 'latex',
      'vue': 'vue',
      'svelte': 'svelte',
    };

    return extension ? languageMap[extension] : undefined;
  }

  /**
   * Check if current page is a GitHub repository
   */
  static isGitHubRepo(): boolean {
    try {
      const url = new URL(window.location.href);
      return url.hostname === 'github.com' && 
             url.pathname.split('/').filter(Boolean).length >= 2;
    } catch {
      return false;
    }
  }

  /**
   * Check if current page is a file view
   */
  static isFileView(): boolean {
    try {
      const url = new URL(window.location.href);
      return url.pathname.includes('/blob/');
    } catch {
      return false;
    }
  }

  /**
   * Check if current page is a markdown file
   */
  static isMarkdownFile(): boolean {
    try {
      const context = this.extractContext();
      return context?.language === 'markdown' || 
             context?.path.toLowerCase().endsWith('.md') || 
             !!document.querySelector('article.markdown-body');
    } catch {
      return false;
    }
  }
}