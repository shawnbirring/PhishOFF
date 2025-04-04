import { checkWebsite } from './website_check';

export interface NavigationRequest {
  url: string;
  tabId: number;
  frameId: number;
}

export interface CheckingState {
  originalUrl: string;
  timestamp: number;
  checkResult?: any;
}

// Store for pending checks to avoid duplicates
const pendingChecks = new Map<number, CheckingState>();

// Cache of recently verified safe sites with timestamp (hostname -> timestamp)
const safeSites = new Map<string, number>();
const SAFE_SITE_TTL = 30 * 60 * 1000;

/**
 * Gets the hostname from a URL
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

/**
 * Marks a site as safe in the cache
 */
export function markSiteAsSafe(url: string): void {
  const hostname = getHostname(url);
  safeSites.set(hostname, Date.now());
  console.log(`[PhishOFF] Marked as safe: ${hostname}`);
}

/**
 * Checks if a site is in the safe cache and not expired
 */
function isSiteInSafeCache(url: string): boolean {
  const hostname = getHostname(url);
  if (!safeSites.has(hostname)) return false;
  
  const timestamp = safeSites.get(hostname);
  const isValid = timestamp && (Date.now() - timestamp < SAFE_SITE_TTL);
  
  if (!isValid) {
    safeSites.delete(hostname);
  }
  
  return isValid;
}

/**
 * Intercepts navigation and redirects to checking page
 * 
 * @param details Navigation details from Chrome API
 * @returns Whether to cancel the original navigation
 */
export function interceptNavigation(details: chrome.webNavigation.WebNavigationParentedCallbackDetails): boolean {
  if (!details.url.startsWith('http')) {
    return false;
  }
  
  if (details.frameId !== 0) {
    return false;
  }
  
  const { tabId, url } = details;
  
  if (isSiteInSafeCache(url)) {
    console.log(`[PhishOFF] Skipping check for known safe site: ${getHostname(url)}`);
    return false;
  }
  
  if (pendingChecks.has(tabId)) {
    const existing = pendingChecks.get(tabId);
    if (existing && Date.now() - existing.timestamp < 5000) {
      return false;
    }
  }
  
  console.log(`[PhishOFF] Intercepting navigation to: ${url}`);
  
  pendingChecks.set(tabId, {
    originalUrl: url,
    timestamp: Date.now()
  });
  
  // Redirect to checking page
  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`tabs/checking.html?url=${encodeURIComponent(url)}`)
  });
  
  startSafetyCheck({ url, tabId, frameId: details.frameId });
  
  return true;
}

/**
 * Performs website safety check and handles result
 * 
 * @param request Navigation request details
 */
export async function startSafetyCheck(request: NavigationRequest): Promise<void> {
  try {
    console.log(`[PhishOFF] Starting safety check for: ${request.url}`);
    
    const result = await checkWebsite(request.url, request.tabId);
    console.log(`[PhishOFF] Check result:`, result);
    
    const checkState = pendingChecks.get(request.tabId);
    if (checkState) {
      checkState.checkResult = result;
    }
    
    if (result.isSafe) {
      markSiteAsSafe(request.url);
    }
    
    trySendResultToCheckingPage(request.tabId, result, request.url);
    
  } catch (error) {
    console.error(`[PhishOFF] Safety check failed:`, error);
    
    trySendResultToCheckingPage(request.tabId, { 
      isSafe: false, 
      message: "Error checking website safety" 
    }, request.url);
  }
}

/**
 * Try to send the result to the checking page
 * The result will be stored if the page isn't ready yet
 */
function trySendResultToCheckingPage(tabId: number, result: any, originalUrl: string): void {
  chrome.tabs.sendMessage(tabId, {
    action: 'checkResult',
    result,
    originalUrl
  }, (response) => {
    const lastError = chrome.runtime.lastError;
    if (lastError) {
      console.log(`[PhishOFF] Couldn't send result yet, will retry when page is ready: ${lastError.message}`);
      
    } else {
      console.log(`[PhishOFF] Result delivered to checking page`);
      pendingChecks.delete(tabId);
    }
  });
}

// Add a listener for the checking page to request the result when it's ready
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkingPageReady") {
    const tabId = sender.tab?.id || (message.tabId ? parseInt(message.tabId, 10) : null);
    
    if (tabId) {
      console.log(`[PhishOFF] Checking page ready in tab ${tabId}, sending result`);
      
      const checkState = pendingChecks.get(tabId);
      if (checkState && checkState.checkResult) {
        chrome.tabs.sendMessage(tabId, {
          action: 'checkResult',
          result: checkState.checkResult,
          originalUrl: checkState.originalUrl
        });
        
        pendingChecks.delete(tabId);
      }
    }
  }
  
  if (message.action === "getTabId" && sender.tab?.id) {
    sendResponse(sender.tab.id);
  }
});