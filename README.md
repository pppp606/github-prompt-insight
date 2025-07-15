# GitHub Markdown AI Extension

A Chrome extension that adds AI-powered translation and summarization features to GitHub Markdown files. Transform your GitHub documentation experience with intelligent content processing.

## Features

- **🌐 Translation**: Translate Markdown content to Japanese (or any target language)
- **📋 Summarization**: Generate concise 1-2 sentence summaries of documentation
- **🔧 Multi-Provider Support**: Works with OpenAI, Google Gemini, and Anthropic Claude
- **🎯 Smart Content Processing**: Automatically excludes code blocks and preserves Markdown structure
- **⚡ GitHub Integration**: Seamlessly integrates with GitHub's file viewer interface
- **🔒 Secure Storage**: API keys stored securely using Chrome's sync storage
- **💻 Modern Development**: Built with TypeScript, Vite, and LangChain

## How It Works

1. **File Detection**: Automatically detects when you're viewing a Markdown file (`.md`, `.mdc`, `.markdown`) on GitHub
2. **UI Integration**: Adds "🌐 Translate" and "📋 Summarize" buttons next to the existing "Raw" button
3. **Content Processing**: Extracts and processes Markdown content while filtering out code blocks and technical elements
4. **AI Processing**: Uses your configured LLM provider to translate or summarize the content
5. **Result Display**: Shows the processed content in a clean, integrated interface below the original content

## Installation

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/pppp606/github-prompt-insight.git
   cd github-prompt-insight
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Configuration

1. **Open Extension Options**:
   - Click the extension icon in Chrome toolbar
   - Select "Options" or right-click and choose "Options"

2. **Configure LLM Provider**:
   - Choose from OpenAI, Google Gemini, or Anthropic Claude
   - Enter your API key
   - Set your preferred target language (default: Japanese)
   - Save settings

3. **Get API Keys**:
   - **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Google Gemini**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/)

## Usage

1. Navigate to any GitHub repository
2. Open a Markdown file (README.md, documentation files, etc.)
3. Look for the "🌐 Translate" and "📋 Summarize" buttons next to the "Raw" button
4. Click either button to process the content
5. View the results displayed below the original content

## Supported File Types

- `.md` - Standard Markdown files
- `.mdc` - Markdown with comments
- `.markdown` - Full Markdown extension

## Project Structure

```
github-prompt-insight/
├── src/
│   ├── background.ts       # Background service worker
│   ├── content.ts         # Content script for GitHub integration
│   ├── content.css        # Styles for injected UI
│   ├── options.html       # Configuration page
│   ├── options.ts         # Options page functionality
│   ├── llm.ts            # LLM wrapper and integration
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── public/
│   ├── manifest.json     # Extension manifest
│   └── icons/            # Extension icons
├── dist/                 # Build output
├── test.html            # Manual testing guide
└── README.md            # This file
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to the `.env` file

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run clean` - Clean build directory
- `npm run zip` - Create extension zip file
- `npm run watch` - Watch mode for development

### Loading in Chrome

1. Run `npm run build` to build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## LLM Providers

The extension supports multiple LLM providers through LangChain:

- **OpenAI** - GPT-3.5, GPT-4, and newer models
- **Google Gemini** - Gemini Pro and other Google models
- **Anthropic Claude** - Claude 3 and other Anthropic models

## Troubleshooting

### Common Issues

**Buttons not appearing**:
- Ensure you're on a GitHub Markdown file (`.md`, `.mdc`, `.markdown`)
- Check that the extension is enabled in Chrome
- Refresh the GitHub page

**API errors**:
- Verify your API key is correct and active
- Check that you have sufficient API credits/quota
- Ensure the selected model is available for your provider

**Translation/summarization not working**:
- Configure the extension through the Options page
- Make sure you've selected a provider and entered an API key
- Check the browser console for error messages

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key configuration
3. Try refreshing the GitHub page
4. Open an issue on the GitHub repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.