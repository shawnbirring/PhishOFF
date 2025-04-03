import { VirusTotalCheck } from '../checks/VirusTotalCheck';

export interface ScanResult {
    isSafe: boolean;
    message: string;
    details?: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
    };
}

// API endpoint for our MongoDB service
const API_URL = "http://localhost:3000";

/**
 * Main function to check website security using database first, then VirusTotal API
 * @param url URL to check
 * @returns Promise resolving to scan results
 */
export async function checkWebsite(url: string): Promise<ScanResult> {
    console.log('[PhishOFF] Starting security check for:', url);

    if (!url) {
        console.warn('[PhishOFF] Empty URL provided');
        return { isSafe: false, message: "Empty URL provided" };
    }

    try {
        const urlToCheck = sanitizeUrl(url);
        console.log('[PhishOFF] Sanitized URL:', urlToCheck);

        if (!urlToCheck) {
            console.warn('[PhishOFF] Invalid URL format:', url);
            return { isSafe: false, message: "Invalid URL format" };
        }

        // First check if URL exists in our database
        const dbResult = await checkUrlInDatabase(urlToCheck);
        
        // If found in database with definitive status, return that result
        if (dbResult && dbResult.status !== 'unknown') {
            console.log('[PhishOFF] URL found in database:', dbResult);
            
            // Format result to match ScanResult interface
            return {
                isSafe: dbResult.status === 'safe',
                message: dbResult.status === 'safe' ? 
                    "Website is marked as safe in our database" : 
                    "Warning: Website is marked as malicious in our database",
                details: {
                    harmless: dbResult.status === 'safe' ? 1 : 0,
                    malicious: dbResult.status === 'malicious' ? 1 : 0,
                    suspicious: 0,
                    undetected: 0
                }
            };
        }
        
        // If not found or status is unknown, continue with VirusTotal check
        console.log('[PhishOFF] URL not found in database or status unknown, checking VirusTotal...');
        
        // Use the VirusTotalCheck class for checking
        const virusTotalChecker = new VirusTotalCheck();
        const checkResult = await virusTotalChecker.check(urlToCheck);
        
        // Convert CheckResult to ScanResult format
        const scanResult: ScanResult = {
            isSafe: checkResult.type === 'safe',
            message: checkResult.message,
            details: {
                harmless: checkResult.type === 'safe' ? 1 : 0,
                malicious: checkResult.type === 'malicious' ? 1 : 0,
                suspicious: 0,
                undetected: 0
            }
        };
        
        // Save result to our database for future reference
        await saveUrlToDatabase(urlToCheck, scanResult.isSafe ? 'safe' : 'malicious');
        
        return scanResult;
    } catch (error) {
        console.error('[PhishOFF] Error in checkWebsite:', error);
        return { isSafe: false, message: "Error checking URL" };
    }
}

/**
 * Checks if URL exists in our database
 * @param url URL to check
 * @returns URL status from database or null if not found
 */
async function checkUrlInDatabase(url: string): Promise<{ status: string } | null> {
    try {
        const response = await fetch(`${API_URL}/check-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            console.error('[PhishOFF] Database check failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[PhishOFF] Database check error:', error);
        return null;
    }
}

/**
 * Saves URL and its status to our database
 * @param url URL to save
 * @param status Safety status (safe/malicious/unknown)
 */
async function saveUrlToDatabase(url: string, status: string): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/add-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, status })
        });
        
        if (!response.ok) {
            console.error('[PhishOFF] Failed to save URL to database:', response.status);
        } else {
            console.log('[PhishOFF] URL saved to database:', url, status);
        }
    } catch (error) {
        console.error('[PhishOFF] Database save error:', error);
    }
}

/**
 * Sanitizes and validates URL format
 * @param url Raw URL input
 * @returns Sanitized URL or null if invalid
 */
function sanitizeUrl(url: string): string | null {
    try {
        url = url.trim();
        if (!url.includes('://')) {
            url = 'https://' + url;
        }

        const parsedUrl = new URL(url);
        return parsedUrl.origin;
    } catch (error) {
        console.error('[PhishOFF] URL sanitization error:', error);
        return null;
    }
}

/**
 * Submits URL to VirusTotal for scanning
 * @param url Sanitized URL to scan
 * @param apiKey VirusTotal API key
 * @returns Scan ID if successful, null otherwise
 */
async function submitUrlForScan(url: string, apiKey: string): Promise<string | null> {
    console.log('[PhishOFF] Submitting URL for scan:', url);

    try {
        const response = await fetch("https://www.virustotal.com/api/v3/urls", {
            method: "POST",
            headers: {
                "x-apikey": apiKey,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `url=${encodeURIComponent(url)}`
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PhishOFF] VirusTotal API Error:', errorText);
            return null;
        }

        const data = await response.json();
        console.log('[PhishOFF] Scan submission response:', data);
        return data?.data?.id || null;
    } catch (error) {
        console.error('[PhishOFF] Scan submission error:', error);
        return null;
    }
}

/**
 * Polls VirusTotal API for scan results
 * @param id Analysis ID from scan submission
 * @param apiKey VirusTotal API key
 * @returns Scan results
 */
async function pollResults(id: string, apiKey: string): Promise<ScanResult> {
    console.log('[PhishOFF] Starting to poll for results, ID:', id);
    const maxRetries = 5;
    const pollingDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[PhishOFF] Polling attempt ${attempt}/${maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, pollingDelay));
        
        try {
            const response = await fetch(
                `https://www.virustotal.com/api/v3/analyses/${id}`,
                {
                    headers: {
                        "x-apikey": apiKey
                    }
                }
            );

            if (!response.ok) {
                console.error('[PhishOFF] Polling error:', response.status);
                continue;
            }

            const data = await response.json();
            console.log('[PhishOFF] Poll response:', data);

            if (data?.data?.attributes?.status === "completed") {
                const stats = data.data.attributes.stats;
                const isSafe = stats.malicious === 0 && 
                              stats.suspicious === 0 && 
                              stats.harmless > 0;

                console.log('[PhishOFF] Analysis complete:', {
                    isSafe,
                    stats
                });
                
                return {
                    isSafe,
                    message: isSafe ? 
                        `Site appears safe (${stats.harmless} trusted sources)` : 
                        `Warning: ${stats.malicious} malicious, ${stats.suspicious} suspicious detections`,
                    details: stats
                };
            }
            
            console.log('[PhishOFF] Scan status:', data?.data?.attributes?.status);
        } catch (error) {
            console.error('[PhishOFF] Polling error:', error);
        }
    }
    
    console.warn('[PhishOFF] Polling timeout reached');
    return { 
        isSafe: false, 
        message: "Unable to verify safety - treating as suspicious" 
    };
}