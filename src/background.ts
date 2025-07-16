chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub Prompt Insight extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('github.com')) {
    chrome.tabs.sendMessage(tab.id!, { action: 'toggle_sidebar' });
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'get_storage') {
    chrome.storage.sync.get(request.key, (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse(result);
      }
    });
    return true;
  }
  
  if (request.action === 'set_storage') {
    chrome.storage.sync.set({ [request.key]: request.value }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

export {};