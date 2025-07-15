import { describe, it, expect } from 'vitest';
import { extractTextContent, removeCodeBlocks, sanitizeForLLM } from './textProcessor';

describe('Text Processing Utilities', () => {
  describe('extractTextContent', () => {
    it('should extract plain text from markdown element', () => {
      const html = `
        <div class="markdown-body">
          <h1>Main Title</h1>
          <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      `;
      
      const element = document.createElement('div');
      element.innerHTML = html;
      
      const result = extractTextContent(element);
      expect(result).toContain('Main Title');
      expect(result).toContain('This is a paragraph');
      expect(result).toContain('List item 1');
      expect(result).not.toContain('<h1>');
      expect(result).not.toContain('<strong>');
    });

    it('should handle elements with mixed content', () => {
      const html = `
        <div>
          <h2>Section Title</h2>
          <p>Some text content.</p>
          <div class="nested">Nested content</div>
        </div>
      `;
      
      const element = document.createElement('div');
      element.innerHTML = html;
      
      const result = extractTextContent(element);
      expect(result).toContain('Section Title');
      expect(result).toContain('Some text content');
      expect(result).toContain('Nested content');
    });

    it('should return empty string for empty elements', () => {
      const element = document.createElement('div');
      const result = extractTextContent(element);
      expect(result).toBe('');
    });
  });

  describe('removeCodeBlocks', () => {
    it('should remove fenced code blocks from markdown text', () => {
      const text = `
# Title

Some text before code.

\`\`\`javascript
function example() {
  console.log("This should be removed");
}
\`\`\`

Some text after code.

\`\`\`python
def another_function():
    print("This should also be removed")
\`\`\`

Final text.
      `;

      const result = removeCodeBlocks(text);
      expect(result).toContain('Title');
      expect(result).toContain('Some text before code');
      expect(result).toContain('Some text after code');
      expect(result).toContain('Final text');
      expect(result).not.toContain('function example()');
      expect(result).not.toContain('console.log');
      expect(result).not.toContain('def another_function');
      expect(result).not.toContain('print(');
    });

    it('should remove inline code snippets', () => {
      const text = `
This is text with \`inline code\` and more text.
Another line with \`const variable = "value"\` should be cleaned.
      `;

      const result = removeCodeBlocks(text);
      expect(result).toContain('This is text with');
      expect(result).toContain('and more text');
      expect(result).toContain('Another line with');
      expect(result).toContain('should be cleaned');
      expect(result).not.toContain('inline code');
      expect(result).not.toContain('const variable');
    });

    it('should remove HTML code blocks', () => {
      const text = `
Text before code.

<pre><code>
const example = "code";
console.log(example);
</code></pre>

Text after code.
      `;

      const result = removeCodeBlocks(text);
      expect(result).toContain('Text before code');
      expect(result).toContain('Text after code');
      expect(result).not.toContain('const example');
      expect(result).not.toContain('console.log');
    });

    it('should handle mixed code block types', () => {
      const text = `
# Documentation

Here's some \`inline code\` in text.

\`\`\`bash
echo "terminal command"
\`\`\`

More text with <code>html code</code> element.

<pre>
preformatted text
</pre>

Final paragraph.
      `;

      const result = removeCodeBlocks(text);
      expect(result).toContain('Documentation');
      expect(result).toContain('in text');
      expect(result).toContain('More text with');
      expect(result).toContain('element');
      expect(result).toContain('Final paragraph');
      expect(result).not.toContain('inline code');
      expect(result).not.toContain('echo');
      expect(result).not.toContain('html code');
      expect(result).not.toContain('preformatted text');
    });

    it('should preserve non-code content unchanged', () => {
      const text = `
# Simple Title

This is just regular text without any code blocks.
Multiple paragraphs should be preserved exactly.

- List item 1
- List item 2

## Subtitle

More content here.
      `;

      const result = removeCodeBlocks(text);
      expect(result.trim()).toBe(text.trim());
    });
  });

  describe('sanitizeForLLM', () => {
    it('should combine extraction and code removal', () => {
      const html = `
        <div class="markdown-body">
          <h1>API Documentation</h1>
          <p>This API provides authentication functionality.</p>
          <pre><code>
const api = require('./api');
api.authenticate(token);
          </code></pre>
          <p>The above code shows how to use the API.</p>
          <p>Here's an inline example: <code>api.login()</code> for logging in.</p>
        </div>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;

      const result = sanitizeForLLM(element);
      expect(result).toContain('API Documentation');
      expect(result).toContain('authentication functionality');
      expect(result).toContain('shows how to use the API');
      expect(result).toContain('for logging in');
      expect(result).not.toContain('const api');
      expect(result).not.toContain('require(');
      expect(result).not.toContain('api.login()');
    });

    it('should handle empty or whitespace-only content', () => {
      const element = document.createElement('div');
      element.innerHTML = '   <p>   </p>   ';

      const result = sanitizeForLLM(element);
      expect(result.trim()).toBe('');
    });

    it('should preserve important formatting while removing code', () => {
      const html = `
        <div>
          <h1>Installation Guide</h1>
          <p>Follow these steps:</p>
          <ol>
            <li>Download the package</li>
            <li>Install using: <code>npm install package</code></li>
            <li>Configure your settings</li>
          </ol>
          <p><strong>Important:</strong> Make sure to restart after installation.</p>
        </div>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;

      const result = sanitizeForLLM(element);
      expect(result).toContain('Installation Guide');
      expect(result).toContain('Follow these steps');
      expect(result).toContain('Download the package');
      expect(result).toContain('Configure your settings');
      expect(result).toContain('Important:');
      expect(result).toContain('restart after installation');
      expect(result).not.toContain('npm install');
    });

    it('should handle large content efficiently', () => {
      const largeContent = Array(100).fill(0).map((_, i) => 
        `<p>Paragraph ${i} with some content.</p>`
      ).join('\n');

      const html = `
        <div>
          ${largeContent}
          <pre><code>
// This is code that should be removed
for (let i = 0; i < 100; i++) {
  console.log(i);
}
          </code></pre>
          <p>Final paragraph after code.</p>
        </div>
      `;

      const element = document.createElement('div');
      element.innerHTML = html;

      const result = sanitizeForLLM(element);
      expect(result).toContain('Paragraph 0');
      expect(result).toContain('Paragraph 99');
      expect(result).toContain('Final paragraph');
      expect(result).not.toContain('console.log');
      expect(result).not.toContain('for (let i');
    });
  });
});