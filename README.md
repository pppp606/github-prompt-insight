# GitHub Prompt Insight

A Chrome extension for GitHub prompt insights with LangChain integration supporting OpenAI, Google Gemini, and Anthropic Claude.

## Features

- TypeScript support with strict typing
- Vite build system for fast development
- LangChain integration for multiple LLM providers
- Modern Chrome Extension Manifest V3
- ESLint configuration for code quality
- Development and production builds

## Project Structure

```
github-prompt-insight/
├── src/                    # Source files
│   ├── background.ts       # Background script
│   ├── content.ts         # Content script
│   ├── content.css        # Content styles
│   ├── popup.html         # Popup HTML
│   ├── options.html       # Options page HTML
│   ├── options.ts         # Options page script
│   ├── llm.ts            # LLM integration
│   └── utils/            # Utility functions
├── public/                # Static assets
│   ├── manifest.json     # Extension manifest
│   └── icon*.png         # Extension icons
├── dist/                 # Build output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── .eslintrc.json        # ESLint configuration
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

## Configuration

Configure API keys and settings through the extension's options page or by setting environment variables during development.

## License

MIT