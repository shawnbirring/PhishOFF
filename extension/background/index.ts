import { checkWebsite } from './website_check';
import { interceptNavigation, startSafetyCheck } from './navigation_interceptor';

console.log('[PhishOFF] Background service worker initialized');

// Set up navigation interception
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  interceptNavigation(details);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkWebsite") {
        console.log('[PhishOFF] Received check request for:', message.url);
        checkWebsite(message.url)
            .then(result => {
                console.log('[PhishOFF] Check completed:', result);
                sendResponse(result);
            })
            .catch(error => {
                console.error('[PhishOFF] Check failed:', error);
                sendResponse({ isSafe: false, message: "Error checking URL" });
            });
        return true;
    }
    
    if (message.action === "proceedToSite") {
      // Allow user to proceed to site they acknowledge risk
      if (sender.tab?.id) {
        chrome.tabs.update(sender.tab.id, { url: message.url });
      }
      return false;
    }
    
    if (message.action === "openUrlsList") {
      // Open the URLs list page in a new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL("tabs/phishoff_urls.html")
      });
      return false;
    }
    
    if (message.action === "getTabId" && sender.tab?.id) {
      sendResponse(sender.tab.id);
      return true;
    }
});