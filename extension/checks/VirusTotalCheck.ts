import { type SafetyCheck, type CheckResult } from "./types";
import { getApiKey } from "../utils/config";

// Interface for VirusTotal scan results (based on your provided code)
interface ScanResult {
    isSafe: boolean;
    message: string;
    details?: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
    };
}

// Submit URL to VirusTotal for scanning
async function submitUrlForScan(url: string, apiKey: string): Promise<string | null> {
    console.log('[VirusTotalCheck] Submitting URL for scan:', url);
    try {
        const response = await fetch("https://www.virustotal.com/api/v3/urls", {
            method: "POST",
            headers: {
                "x-apikey": apiKey,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `url=${encodeURIComponent(url)}`,
        });

        if (!response.ok) {
            console.error('[VirusTotalCheck] VirusTotal API Error:', await response.text());
            return null;
        }

        const data = await response.json();
        console.log('[VirusTotalCheck] Scan submission response:', data);
        return data?.data?.id || null;
    } catch (error) {
        console.error('[VirusTotalCheck] Scan submission error:', error);
        return null;
    }
}

// Poll VirusTotal API for scan results
async function pollResults(id: string, apiKey: string): Promise<ScanResult> {
    console.log('[VirusTotalCheck] Starting to poll for results, ID:', id);
    const maxRetries = 5;
    const pollingDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[VirusTotalCheck] Polling attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, pollingDelay));

        try {
            const response = await fetch(`https://www.virustotal.com/api/v3/analyses/${id}`, {
                headers: { "x-apikey": apiKey },
            });

            if (!response.ok) {
                console.error('[VirusTotalCheck] Polling error:', response.status);
                continue;
            }

            const data = await response.json();
            console.log('[VirusTotalCheck] Poll response:', data);

            if (data?.data?.attributes?.status === "completed") {
                const stats = data.data.attributes.stats;
                const isSafe = stats.malicious === 0 && stats.suspicious === 0 && stats.harmless > 0;

                console.log('[VirusTotalCheck] Analysis complete:', { isSafe, stats });
                return {
                    isSafe,
                    message: isSafe
                        ? `Site appears safe (${stats.harmless} trusted sources)`
                        : `Warning: ${stats.malicious} malicious, ${stats.suspicious} suspicious detections`,
                    details: stats,
                };
            }

            console.log('[VirusTotalCheck] Scan status:', data?.data?.attributes?.status);
        } catch (error) {
            console.error('[VirusTotalCheck] Polling error:', error);
        }
    }

    console.warn('[VirusTotalCheck] Polling timeout reached');
    return {
        isSafe: false,
        message: "Unable to verify safety - treating as suspicious",
    };
}

export class VirusTotalCheck implements SafetyCheck {
    getName(): string {
        return "VirusTotal Check";
    }

    getDescription(): string {
        return "Scans the URL using VirusTotal to check for known threats.";
    }

    isFast(): boolean {
        return false; // Slow due to API submission and polling
    }

    getWeight(): number {
        return 50; // High weight due to VirusTotal's authoritative reputation
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const apiKey = getApiKey(); // Fetch API key from environment
            const scanId = await submitUrlForScan(url, apiKey);

            if (!scanId) {
                return {
                    name: this.getName(),
                    message: "Failed to submit URL to VirusTotal",
                    type: "unknown",
                };
            }

            const scanResult = await pollResults(scanId, apiKey);

            return {
                name: this.getName(),
                message: scanResult.message,
                type: scanResult.isSafe ? "safe" : "malicious", // Map isSafe to type
            };
        } catch (error) {
            console.error(`[VirusTotalCheck] Error checking URL: ${error}`);
            return {
                name: this.getName(),
                message: "Error contacting VirusTotal API",
                type: "unknown",
            };
        }
    }

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Unable to verify safety")) {
            return "VirusTotal could not complete the scan in time. This doesn't necessarily mean the site is unsafe, but you should proceed with caution.";
        } else if (result.message.includes("Failed to submit")) {
            return "Unable to check this URL with VirusTotal. Consider using alternative security tools to verify this site.";
        } else if (result.message.includes("Error contacting")) {
            return "Connection to VirusTotal failed. This is a technical issue with our service rather than a problem with the website.";
        } else if (result.message.includes("malicious") || result.message.includes("Warning:")) {
            return "This URL has been flagged by multiple security services as potentially harmful. Visiting it may put your device or personal information at risk.";
        }
        
        return "This URL has been flagged by VirusTotal. Avoid entering sensitive information on this site.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Unable to verify safety")) {
            return `VirusTotal is a service that analyzes URLs and files with multiple antivirus engines and website scanners. Our system was unable to retrieve complete results from VirusTotal within the allotted time.

This doesn't necessarily mean the site is dangerous, but it means we couldn't get definitive information about its safety profile. Possible reasons include:
- The URL may be new and not yet fully analyzed by VirusTotal
- There may be temporary connectivity issues with the VirusTotal service
- The analysis may be taking longer than usual due to complexity

When VirusTotal results are unavailable, you should rely on other security indicators to evaluate the site.`;
        } else if (result.message.includes("Failed to submit")) {
            return `Our system was unable to submit this URL to VirusTotal for analysis. VirusTotal is a service that checks URLs against dozens of security engines and blacklists.

The submission failure could be due to:
- Temporary API connectivity issues
- Rate limiting of our VirusTotal API access
- The URL containing formats or characters that couldn't be properly submitted

This is a technical issue with our checking system rather than a specific indication about the safety of the URL itself.`;
        } else if (result.message.includes("Error contacting")) {
            return `We encountered a technical error when trying to contact the VirusTotal API service to check this URL.

This error is typically caused by:
- Network connectivity issues between our service and VirusTotal
- API authentication problems
- Temporary service outages at VirusTotal

This error relates to the connectivity between our service and VirusTotal, not a security assessment of the URL itself.`;
        } else if (result.message.includes("malicious") || result.message.includes("Warning:")) {
            // Extract the detection counts if available
            const maliciousMatch = result.message.match(/(\d+) malicious/);
            const suspiciousMatch = result.message.match(/(\d+) suspicious/);
            const maliciousCount = maliciousMatch ? maliciousMatch[1] : "multiple";
            const suspiciousCount = suspiciousMatch ? suspiciousMatch[1] : "0";
            
            return `VirusTotal has flagged this URL as potentially malicious. VirusTotal checks URLs against 70+ different security services, antivirus engines, and website reputation systems.

This URL was identified as malicious by ${maliciousCount} security services and suspicious by ${suspiciousCount} services. Each security service uses different detection methods including:
- Known malware or phishing blacklists
- Behavioral analysis of website content
- Reputation scoring systems
- Heuristic detection of suspicious patterns

Multiple independent detections strongly suggest this URL poses a genuine security risk. Visiting it could expose you to phishing attempts, malware downloads, or other security threats.`;
        }
        
        return `VirusTotal detected potential security issues with this URL. VirusTotal is a service that aggregates many different security engines to provide comprehensive threat detection.

One or more security engines identified this URL as potentially malicious. While no detection system is perfect, these results suggest caution is warranted when accessing this site.`;
    }
}