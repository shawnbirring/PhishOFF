chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === "getAuthToken") {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message })
            } else {
                sendResponse({ token })
            }
        })
        return true // Keeps the message channel open for async response
    }
})

chrome.runtime.onInstalled.addListener(() => {
    // Check if the API Key is already in local storage
    chrome.storage.local.get(['GOOGLE_SAFE_BROWSING_API_KEY'], (result) => {
        if (!result.GOOGLE_SAFE_BROWSING_API_KEY) {
            // Store API key if it doesn't exist
            chrome.storage.local.set({
                GOOGLE_SAFE_BROWSING_API_KEY: '480be386-87f4-4e1b-bec7-f6d91034c387'
            }, () => {
                console.log('API Key stored securely.');
            });
        }
    });
});
