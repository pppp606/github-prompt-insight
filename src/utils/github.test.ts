import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isGitHubPage, 
  isMarkdownFile, 
  extractRepoInfo, 
  getFileType,
  isValidGitHubUrl,
  getContentType 
} from './github';

describe('GitHub Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isGitHubPage', () => {
    it('should detect GitHub pages correctly', () => {
      const testCases = [
        { hostname: 'github.com', expected: true },
        { hostname: 'www.github.com', expected: true },
        { hostname: 'gitlab.com', expected: false },
        { hostname: 'bitbucket.org', expected: false },
        { hostname: 'example.com', expected: false },
      ];

      testCases.forEach(({ hostname, expected }) => {
        Object.defineProperty(window, 'location', {
          value: { hostname },
          writable: true,
        });

        expect(isGitHubPage()).toBe(expected);
      });
    });
  });

  describe('isMarkdownFile', () => {
    it('should detect markdown files correctly', () => {
      const testCases = [
        { url: 'https://github.com/user/repo/blob/main/README.md', expected: true },
        { url: 'https://github.com/user/repo/blob/main/docs/guide.md', expected: true },
        { url: 'https://github.com/user/repo/blob/main/CHANGELOG.mdc', expected: true },
        { url: 'https://github.com/user/repo/blob/main/file.markdown', expected: true },
        { url: 'https://github.com/user/repo/blob/main/script.js', expected: false },
        { url: 'https://github.com/user/repo/blob/main/style.css', expected: false },
        { url: 'https://github.com/user/repo/tree/main', expected: false },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(isMarkdownFile(url)).toBe(expected);
      });
    });
  });

  describe('extractRepoInfo', () => {
    it('should extract repository information correctly', () => {
      const testCases = [
        {
          url: 'https://github.com/owner/repo/blob/main/README.md',
          expected: { owner: 'owner', repo: 'repo', branch: 'main', path: 'README.md' }
        },
        {
          url: 'https://github.com/user/project/blob/develop/docs/guide.md',
          expected: { owner: 'user', repo: 'project', branch: 'develop', path: 'docs/guide.md' }
        },
        {
          url: 'https://github.com/org/repo-name/blob/feature-branch/src/components/Component.md',
          expected: { owner: 'org', repo: 'repo-name', branch: 'feature-branch', path: 'src/components/Component.md' }
        },
        {
          url: 'https://github.com/user/repo',
          expected: null
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractRepoInfo(url)).toEqual(expected);
      });
    });
  });

  describe('getFileType', () => {
    it('should determine file types correctly', () => {
      const testCases = [
        { filename: 'README.md', expected: 'markdown' },
        { filename: 'guide.markdown', expected: 'markdown' },
        { filename: 'notes.mdc', expected: 'markdown' },
        { filename: 'script.js', expected: 'javascript' },
        { filename: 'style.css', expected: 'css' },
        { filename: 'app.py', expected: 'python' },
        { filename: 'main.cpp', expected: 'cpp' },
        { filename: 'config.json', expected: 'json' },
        { filename: 'data.xml', expected: 'xml' },
        { filename: 'unknown.xyz', expected: 'unknown' },
        { filename: 'noextension', expected: 'unknown' },
      ];

      testCases.forEach(({ filename, expected }) => {
        expect(getFileType(filename)).toBe(expected);
      });
    });
  });

  describe('isValidGitHubUrl', () => {
    it('should validate GitHub URLs correctly', () => {
      const testCases = [
        { url: 'https://github.com/user/repo/blob/main/README.md', expected: true },
        { url: 'https://github.com/user/repo/issues/123', expected: true },
        { url: 'https://github.com/user/repo/pull/456', expected: true },
        { url: 'https://github.com/user/repo/wiki/Home', expected: true },
        { url: 'https://github.com/user/repo', expected: true },
        { url: 'https://gitlab.com/user/repo', expected: false },
        { url: 'https://example.com', expected: false },
        { url: 'not-a-url', expected: false },
        { url: '', expected: false },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(isValidGitHubUrl(url)).toBe(expected);
      });
    });
  });

  describe('getContentType', () => {
    it('should determine content types for GitHub pages', () => {
      const testCases = [
        { 
          url: 'https://github.com/user/repo/blob/main/README.md',
          expected: 'file'
        },
        { 
          url: 'https://github.com/user/repo/issues/123',
          expected: 'issue'
        },
        { 
          url: 'https://github.com/user/repo/pull/456',
          expected: 'pull_request'
        },
        { 
          url: 'https://github.com/user/repo/wiki/Home',
          expected: 'wiki'
        },
        { 
          url: 'https://github.com/user/repo',
          expected: 'repository'
        },
        { 
          url: 'https://github.com/user/repo/tree/main/docs',
          expected: 'directory'
        },
        { 
          url: 'https://example.com',
          expected: 'unknown'
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(getContentType(url)).toBe(expected);
      });
    });
  });

  describe('Complex URL parsing', () => {
    it('should handle URLs with special characters', () => {
      const complexUrls = [
        'https://github.com/user-name/repo_name/blob/feature/branch-name/docs/api-guide.md',
        'https://github.com/org123/project.name/blob/v1.0.0/README.md',
        'https://github.com/user/repo/blob/main/path%20with%20spaces/file.md',
      ];

      complexUrls.forEach(url => {
        expect(isValidGitHubUrl(url)).toBe(true);
        expect(isMarkdownFile(url)).toBe(true);
        
        const repoInfo = extractRepoInfo(url);
        expect(repoInfo).not.toBeNull();
        expect(repoInfo?.owner).toBeTruthy();
        expect(repoInfo?.repo).toBeTruthy();
      });
    });

    it('should handle edge cases in URL parsing', () => {
      const edgeCases = [
        'https://github.com/user/repo/blob/main/', // trailing slash
        'https://github.com/user/repo/blob/main', // no file
        'https://github.com/user/repo/blob/', // incomplete path
        'https://github.com/user/', // incomplete repo path
        'https://github.com/', // just domain
      ];

      edgeCases.forEach(url => {
        // Should not throw errors
        expect(() => isValidGitHubUrl(url)).not.toThrow();
        expect(() => getContentType(url)).not.toThrow();
        expect(() => extractRepoInfo(url)).not.toThrow();
      });
    });
  });

  describe('GitHub-specific features', () => {
    it('should detect different GitHub page types', () => {
      const pageTypes = [
        { 
          url: 'https://github.com/microsoft/vscode/blob/main/README.md',
          isFile: true,
          isMarkdown: true,
          contentType: 'file'
        },
        { 
          url: 'https://github.com/facebook/react/issues/12345',
          isFile: false,
          isMarkdown: false,
          contentType: 'issue'
        },
        { 
          url: 'https://github.com/nodejs/node/pull/67890',
          isFile: false,
          isMarkdown: false,
          contentType: 'pull_request'
        },
        { 
          url: 'https://github.com/torvalds/linux/wiki/KernelNewbies',
          isFile: false,
          isMarkdown: false,
          contentType: 'wiki'
        },
      ];

      pageTypes.forEach(({ url, isFile, isMarkdown, contentType }) => {
        expect(isValidGitHubUrl(url)).toBe(true);
        expect(isMarkdownFile(url)).toBe(isMarkdown);
        expect(getContentType(url)).toBe(contentType);
      });
    });

    it('should handle GitHub Enterprise URLs', () => {
      // Test with custom GitHub domains (if supported)
      const enterpriseUrls = [
        'https://github.enterprise.com/user/repo/blob/main/README.md',
        'https://git.company.com/team/project/blob/main/docs.md',
      ];

      enterpriseUrls.forEach(url => {
        // These would fail current implementation but show extensibility
        expect(isValidGitHubUrl(url)).toBe(false);
        // Could be extended to support enterprise instances
      });
    });
  });

  describe('Performance considerations', () => {
    it('should handle URL parsing efficiently', () => {
      const manyUrls = Array(1000).fill(0).map((_, i) => 
        `https://github.com/user${i}/repo${i}/blob/main/file${i}.md`
      );

      const startTime = Date.now();
      
      manyUrls.forEach(url => {
        isValidGitHubUrl(url);
        isMarkdownFile(url);
        getContentType(url);
        extractRepoInfo(url);
      });
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should process 1000 URLs in reasonable time (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });
  });
});