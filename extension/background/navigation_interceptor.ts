import { checkWebsite } from './website_check';

export interface NavigationRequest {
  url: string;
  tabId: number;
  frameId: number;
}

export interface CheckingState {
  originalUrl: string;
  timestamp: number;
}

// Store for pending checks to avoid duplicates
const pendingChecks = new Map<number, CheckingState>();

// Cache of recently verified safe sites with timestamp (hostname -> timestamp)
const safeSites = new Map<string, number>();
// How long a site stays in the safe cache (30 minutes)
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
    // Clean up expired entries
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
  // Skip extension pages, chrome:// pages, etc.
  if (!details.url.startsWith('http')) {
    return false;
  }
  
  // Skip subframes
  if (details.frameId !== 0) {
    return false;
  }
  
  const { tabId, url } = details;
  
  // Skip if site is in safe cache
  if (isSiteInSafeCache(url)) {
    console.log(`[PhishOFF] Skipping check for known safe site: ${getHostname(url)}`);
    return false;
  }
  
  // Check if we're already handling this URL in this tab
  if (pendingChecks.has(tabId)) {
    // Skip if check was initiated in the last 5 seconds (avoid loops)
    const existing = pendingChecks.get(tabId);
    if (existing && Date.now() - existing.timestamp < 5000) {
      return false;
    }
  }
  
  console.log(`[PhishOFF] Intercepting navigation to: ${url}`);
  
  // Store the check state
  pendingChecks.set(tabId, {
    originalUrl: url,
    timestamp: Date.now()
  });
  
  // Redirect to checking page
  chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`tabs/checking.html?url=${encodeURIComponent(url)}`)
  });
  
  // Begin safety check
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
    
    const result = await checkWebsite(request.url);
    console.log(`[PhishOFF] Check result:`, result);
    
    // Clean up pending check record
    pendingChecks.delete(request.tabId);
    
    // If safe, add to safe sites cache
    if (result.isSafe) {
      markSiteAsSafe(request.url);
    }
    
    // Send result to checking page for handling
    chrome.tabs.sendMessage(request.tabId, {
      action: 'checkResult',
      result,
      originalUrl: request.url
    });
    
  } catch (error) {
    console.error(`[PhishOFF] Safety check failed:`, error);
    pendingChecks.delete(request.tabId);
    
    // Send error to checking page
    chrome.tabs.sendMessage(request.tabId, {
      action: 'checkResult',
      result: { isSafe: false, message: "Error checking website safety" },
      originalUrl: request.url
    });
  }
}