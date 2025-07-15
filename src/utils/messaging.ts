import { ExtensionMessage, ExtensionMessageType } from '@/types';

/**
 * Utility functions for Chrome extension messaging
 */
export class MessagingManager {
  /**
   * Send message to background script
   */
  static async sendToBackground<T = any>(
    message: ExtensionMessageType
  ): Promise<T> {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      console.error('Error sending message to background:', error);
      throw error;
    }
  }

  /**
   * Send message to content script
   */
  static async sendToContent<T = any>(
    tabId: number,
    message: ExtensionMessageType
  ): Promise<T> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      console.error('Error sending message to content script:', error);
      throw error;
    }
  }

  /**
   * Send message to active tab
   */
  static async sendToActiveTab<T = any>(
    message: ExtensionMessageType
  ): Promise<T> {
    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      
      if (!activeTab.id) {
        throw new Error('No active tab found');
      }

      return await this.sendToContent(activeTab.id, message);
    } catch (error) {
      console.error('Error sending message to active tab:', error);
      throw error;
    }
  }

  /**
   * Set up message listener
   */
  static onMessage<T = any>(
    callback: (
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: T) => void
    ) => void | Promise<void>
  ): void {
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        const result = callback(message, sender, sendResponse);
        
        // Handle async callbacks
        if (result instanceof Promise) {
          result
            .then((response) => sendResponse(response))
            .catch((error) => {
              console.error('Error in message handler:', error);
              sendResponse({ error: error.message });
            });
          return true; // Keep the message channel open
        }
      }
    );
  }

  /**
   * Get current active tab
   */
  static async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      return activeTab || null;
    } catch (error) {
      console.error('Error getting current tab:', error);
      return null;
    }
  }
}