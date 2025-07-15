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
});

export {};