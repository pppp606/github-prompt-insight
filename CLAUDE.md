# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Prompt Insight is a Chrome extension that enhances GitHub's Markdown file viewing experience by providing AI-powered translation and summarization features. It integrates with popular LLM providers (OpenAI, Anthropic, Google) through LangChain.

## Key Commands

### Development
- `npm run dev` - Start Vite development server for extension development
- `npm run build` - Build the extension for production (compiles TypeScript and bundles with Vite)
- `npm run preview` - Preview the built extension

### Extension Testing
To test the extension:
1. Run `npm run build` to create the production build
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## Architecture Overview

### Core Components

1. **Content Script** (`src/content.ts`)
   - Main entry point that runs on GitHub pages
   - Detects Markdown content areas (`.markdown-body`, `.js-comment-body`)
   - Injects translation and summarization buttons
   - Handles UI interactions and displays results

2. **LLM Integration** (`src/llm.ts`)
   - Wrapper around LangChain for multiple LLM providers
   - Supports OpenAI, Anthropic, and Google models
   - Provides `translateText()` and `summarizeText()` methods
   - Handles API configuration and error management

3. **Background Service Worker** (`src/background.ts`)
   - Manages Chrome storage API operations
   - Handles cross-component messaging
   - Minimal service worker for extension lifecycle

4. **Options Page** (`src/options.ts`)
   - Settings management UI
   - Configures LLM provider, API key, model selection
   - Sets default translation language

### Build Configuration
- **Vite** handles bundling with multiple entry points (content, background, options, popup)
- **TypeScript** with strict mode enabled
- Output goes to `dist/` directory
- Chrome Manifest V3 configuration in `public/manifest.json`

### Key Design Patterns
- **Class-based architecture** with `GitHubMarkdownEnhancer` and `LLMWrapper`
- **Message passing** between content script and background worker
- **Chrome Storage API** for persistent configuration
- **Mutation Observer** for dynamic GitHub page content
- **Promise-based async operations** throughout

### Dependencies
- **LangChain** ecosystem: Core library with provider-specific packages
- **Chrome Types** for extension API TypeScript support
- **Vite** for modern build tooling

## Important Notes
- No test framework is currently configured (based on package.json)
- No linting or formatting tools are set up
- Extension permissions are limited to GitHub domain and storage API
- All LLM API keys are stored in Chrome's sync storage

## Pre-commit Requirements
Before creating any commit, you MUST:
1. Run `npm run build` to ensure the build passes
2. Verify that TypeScript compilation succeeds with `npx tsc --noEmit`
3. Only proceed with commit if both commands complete successfully without errors