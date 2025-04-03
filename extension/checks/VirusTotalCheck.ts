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
        return 50; // High weight due to VirusTotal’s authoritative reputation
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
}