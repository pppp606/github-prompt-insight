import { ChromeStorageData } from '@/types';

/**
 * Utility functions for Chrome storage operations
 */
export class StorageManager {
  /**
   * Get data from Chrome storage
   */
  static async get<T extends keyof ChromeStorageData>(
    key: T
  ): Promise<ChromeStorageData[T] | undefined> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key];
    } catch (error) {
      console.error('Error getting storage data:', error);
      return undefined;
    }
  }

  /**
   * Get all data from Chrome storage
   */
  static async getAll(): Promise<ChromeStorageData> {
    try {
      const result = await chrome.storage.sync.get();
      return result as ChromeStorageData;
    } catch (error) {
      console.error('Error getting all storage data:', error);
      return {};
    }
  }

  /**
   * Set data in Chrome storage
   */
  static async set<T extends keyof ChromeStorageData>(
    key: T,
    value: ChromeStorageData[T]
  ): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('Error setting storage data:', error);
      throw error;
    }
  }

  /**
   * Set multiple values in Chrome storage
   */
  static async setMultiple(data: Partial<ChromeStorageData>): Promise<void> {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.error('Error setting multiple storage data:', error);
      throw error;
    }
  }

  /**
   * Remove data from Chrome storage
   */
  static async remove(key: keyof ChromeStorageData): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error('Error removing storage data:', error);
      throw error;
    }
  }

  /**
   * Clear all data from Chrome storage
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Error clearing storage data:', error);
      throw error;
    }
  }
}