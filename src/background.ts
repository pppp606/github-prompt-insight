chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub Prompt Insight extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('github.com')) {
    chrome.tabs.sendMessage(tab.id!, { action: 'toggle_sidebar' });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_storage') {
    chrome.storage.sync.get(request.key, (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'set_storage') {
    chrome.storage.sync.set({ [request.key]: request.value }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'get_extension_config') {
    chrome.storage.sync.get(null, (result) => {
      const config = buildExtensionConfig(result);
      sendResponse({ extensionConfig: config });
    });
    return true;
  }
});

function buildExtensionConfig(storageData: any): any {
  const provider = storageData.selectedProvider;
  if (!provider) return null;

  let apiKey = '';
  if (provider === 'openai') {
    apiKey = storageData.openaiApiKey || '';
  } else if (provider === 'google') {
    apiKey = storageData.googleApiKey || '';
  } else if (provider === 'anthropic') {
    apiKey = storageData.anthropicApiKey || '';
  }

  return {
    llmProvider: provider,
    apiKey,
    model: storageData.selectedModel,
    defaultLanguage: storageData.userPreferences?.language || 'Japanese',
  };
}

export {};