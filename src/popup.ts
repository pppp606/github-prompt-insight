import { StorageManager, GitHubUtils } from '@/utils';
import { ChromeStorageData } from '@/types';

/**
 * Popup script for GitHub Prompt Insight extension
 */
class PopupManager {
  private optionsButton: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  private setupUI(): void {
    this.optionsButton = document.getElementById('optionsLink');
    this.statusElement = document.getElementById('status');

    if (this.optionsButton) {
      this.optionsButton.addEventListener('click', this.openOptions.bind(this));
    }

    // Load and display current configuration status
    this.loadStatus();
  }

  private async loadStatus(): Promise<void> {
    try {
      const config = await StorageManager.getAll();
      this.updateStatus(config);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  private updateStatus(config: ChromeStorageData): void {
    if (!this.statusElement) return;

    const hasApiKey = !!(
      config.openaiApiKey || 
      config.googleApiKey || 
      config.anthropicApiKey
    );

    const isGitHubPage = this.isGitHubPage();

    if (hasApiKey && isGitHubPage) {
      this.statusElement.textContent = '✅ Ready to use';
      this.statusElement.style.color = '#28a745';
    } else if (!hasApiKey) {
      this.statusElement.textContent = '⚠️ API key required';
      this.statusElement.style.color = '#ffa500';
    } else if (!isGitHubPage) {
      this.statusElement.textContent = '📍 Navigate to GitHub';
      this.statusElement.style.color = '#0366d6';
    } else {
      this.statusElement.textContent = '❌ Setup required';
      this.statusElement.style.color = '#dc3545';
    }
  }

  private isGitHubPage(): boolean {
    try {
      // Check if we're on GitHub by examining the current tab
      return window.location.hostname === 'github.com';
    } catch {
      return false;
    }
  }

  private openOptions(): void {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when script loads
new PopupManager();