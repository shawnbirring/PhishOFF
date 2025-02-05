import { checkWebsite } from './website_check';

console.log('[PhishOFF] Background service worker initialized');

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
});