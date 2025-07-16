/**
 * GitHub-specific utilities for URL parsing and page detection
 */

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

/**
 * Check if current page is on GitHub
 */
export function isGitHubPage(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'github.com' || hostname === 'www.github.com';
}

/**
 * Check if URL points to a markdown file
 */
export function isMarkdownFile(url: string): boolean {
  if (!url) return false;
  
  const markdownExtensions = ['.md', '.markdown', '.mdc'];
  return markdownExtensions.some(ext => url.toLowerCase().includes(ext));
}

/**
 * Extract repository information from GitHub URL
 */
export function extractRepoInfo(url: string): GitHubRepoInfo | null {
  if (!url || !isValidGitHubUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    // Expected format: /owner/repo/blob/branch/path...
    if (pathParts.length < 4 || pathParts[2] !== 'blob') {
      return null;
    }
    
    const owner = pathParts[0];
    const repo = pathParts[1];
    const branch = pathParts[3];
    const path = pathParts.slice(4).join('/');
    
    return { owner, repo, branch, path };
  } catch {
    return null;
  }
}

/**
 * Determine file type from filename
 */
export function getFileType(filename: string): string {
  if (!filename) return 'unknown';
  
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  const typeMap: Record<string, string> = {
    'md': 'markdown',
    'markdown': 'markdown',
    'mdc': 'markdown',
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
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'html': 'html',
    'xml': 'xml',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'cfg': 'config',
    'conf': 'config',
    'txt': 'text',
    'log': 'log',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'sql': 'sql',
    'dockerfile': 'docker',
    'makefile': 'makefile',
  };
  
  return typeMap[extension] || 'unknown';
}

/**
 * Validate if URL is a GitHub URL
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com';
  } catch {
    return false;
  }
}

/**
 * Determine content type of GitHub page
 */
export function getContentType(url: string): string {
  if (!isValidGitHubUrl(url)) return 'unknown';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname.includes('/blob/')) return 'file';
    if (pathname.includes('/tree/')) return 'directory';
    if (pathname.includes('/issues/')) return 'issue';
    if (pathname.includes('/pull/')) return 'pull_request';
    if (pathname.includes('/wiki/')) return 'wiki';
    if (pathname.includes('/releases/')) return 'releases';
    if (pathname.includes('/commits/')) return 'commits';
    if (pathname.includes('/branches/')) return 'branches';
    if (pathname.includes('/tags/')) return 'tags';
    if (pathname.includes('/settings/')) return 'settings';
    if (pathname.includes('/actions/')) return 'actions';
    if (pathname.includes('/projects/')) return 'projects';
    if (pathname.includes('/security/')) return 'security';
    if (pathname.includes('/pulse/')) return 'insights';
    if (pathname.includes('/graphs/')) return 'insights';
    
    // Check if it's a user/org profile
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length === 1) return 'profile';
    if (pathParts.length === 2) return 'repository';
    
    return 'repository';
  } catch {
    return 'unknown';
  }
}

/**
 * Check if current page is suitable for translation/summarization
 */
export function isPageSuitableForProcessing(): boolean {
  if (!isGitHubPage()) return false;
  
  const contentType = getContentType(window.location.href);
  const suitableTypes = ['file', 'issue', 'pull_request', 'wiki'];
  
  return suitableTypes.includes(contentType);
}

/**
 * Get GitHub API URL for current file
 */
export function getApiUrl(url: string): string | null {
  const repoInfo = extractRepoInfo(url);
  if (!repoInfo) return null;
  
  const { owner, repo, branch, path } = repoInfo;
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
}

/**
 * Get raw file URL for GitHub file
 */
export function getRawUrl(url: string): string | null {
  const repoInfo = extractRepoInfo(url);
  if (!repoInfo) return null;
  
  const { owner, repo, branch, path } = repoInfo;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Extract issue/PR number from URL
 */
export function extractIssueNumber(url: string): number | null {
  if (!url) return null;
  
  const match = url.match(/\/(issues|pull)\/(\d+)/);
  return match ? parseInt(match[2], 10) : null;
}

/**
 * Check if page has meaningful markdown content
 */
export function hasMarkdownContent(): boolean {
  const markdownSelectors = [
    '.markdown-body',
    '.js-comment-body',
    '[data-type="markdown"]',
    '.Box-body .markdown-body',
  ];
  
  return markdownSelectors.some(selector => {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).some(element => {
      const text = element.textContent?.trim() || '';
      return text.length > 50; // Meaningful content threshold
    });
  });
}

/**
 * Get page title for context
 */
export function getPageTitle(): string {
  const title = document.title;
  
  // Extract repository and file information from title
  if (title.includes('·')) {
    const parts = title.split('·');
    return parts[0].trim();
  }
  
  return title;
}

/**
 * Get repository name from current page
 */
export function getCurrentRepo(): string | null {
  const pathname = window.location.pathname;
  const pathParts = pathname.split('/').filter(part => part.length > 0);
  
  if (pathParts.length >= 2) {
    return `${pathParts[0]}/${pathParts[1]}`;
  }
  
  return null;
}

/**
 * Check if user is viewing a specific file
 */
export function isViewingFile(): boolean {
  return getContentType(window.location.href) === 'file';
}

/**
 * Check if user is viewing an issue or PR
 */
export function isViewingIssueOrPR(): boolean {
  const contentType = getContentType(window.location.href);
  return contentType === 'issue' || contentType === 'pull_request';
}

/**
 * Get language from file extension for syntax highlighting context
 */
export function getLanguageFromUrl(url: string): string | null {
  const repoInfo = extractRepoInfo(url);
  if (!repoInfo) return null;
  
  const fileType = getFileType(repoInfo.path);
  
  // Map file types to language codes
  const languageMap: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'markdown': 'md',
    'cpp': 'cpp',
    'java': 'java',
    'go': 'go',
    'rust': 'rs',
    'shell': 'sh',
  };
  
  return languageMap[fileType] || fileType;
}

/**
 * Build permalink for current file
 */
export function buildPermalink(): string | null {
  const repoInfo = extractRepoInfo(window.location.href);
  if (!repoInfo) return null;
  
  const { owner, repo, branch, path } = repoInfo;
  
  // Get current commit SHA if available (for permalink)
  const commitSha = getCommitShaFromPage();
  const ref = commitSha || branch;
  
  return `https://github.com/${owner}/${repo}/blob/${ref}/${path}`;
}

/**
 * Extract commit SHA from page if available
 */
function getCommitShaFromPage(): string | null {
  // Look for commit SHA in various page elements
  const selectors = [
    '[data-commit-sha]',
    '.commit-sha',
    '.js-permalink-shortcut',
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const sha = element.getAttribute('data-commit-sha') || 
                  element.getAttribute('data-sha') ||
                  element.textContent?.trim();
      
      if (sha && sha.length >= 7) {
        return sha;
      }
    }
  }
  
  return null;
}

export default {
  isGitHubPage,
  isMarkdownFile,
  extractRepoInfo,
  getFileType,
  isValidGitHubUrl,
  getContentType,
  isPageSuitableForProcessing,
  hasMarkdownContent,
  getPageTitle,
  getCurrentRepo,
  isViewingFile,
  isViewingIssueOrPR,
};