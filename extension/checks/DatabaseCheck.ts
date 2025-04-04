import { type SafetyCheck, type CheckResult } from "./types";
import { getApiUrl } from "../utils/config";

export class DatabaseCheck implements SafetyCheck {
    getName(): string {
        return "Database Check";
    }

    getDescription(): string {
        return "Checks if the URL is already known in our database as safe, malicious, or unknown.";
    }

    isFast(): boolean {
        return true; // Fast due to Redis caching and simple DB lookup
    }

    getWeight(): number {
        return 40; // High weight since it's based on prior verified results
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const API_URL = "http://localhost:3000";
            console.log(`[DatabaseCheck] Checking URL in database: ${url}`);
            const response = await fetch(`${API_URL}/check-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                console.error(`[DatabaseCheck] Server returned status ${response.status}`);
                return {
                    name: this.getName(),
                    message: `Failed to check database (status: ${response.status})`,
                    type: "unknown",
                };
            }

            const data = await response.json();
            console.log(`[DatabaseCheck] Database response:`, data);
            const status = data.status; // "safe", "malicious", or "unknown"

            switch (status) {
                case "safe":
                    return {
                        name: this.getName(),
                        message: "URL is marked as safe in our database",
                        type: "safe",
                    };
                case "malicious":
                    return {
                        name: this.getName(),
                        message: "URL is marked as malicious in our database",
                        type: "malicious",
                    };
                case "unknown":
                default:
                    return {
                        name: this.getName(),
                        message: "URL not found in database",
                        type: "unknown",
                    };
            }
        } catch (error) {
            console.error(`[DatabaseCheck] Error checking URL: ${error}`);
            return {
                name: this.getName(),
                message: "Error contacting database",
                type: "unknown",
            };
        }
    }

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Error contacting database")) {
            return "Unable to connect to our security database. This is likely a temporary issue with our service, not a problem with the website.";
        } else if (result.message.includes("Failed to check database")) {
            return "Our security database service is experiencing issues. This does not necessarily mean the site is unsafe.";
        } else if (result.message.includes("marked as malicious")) {
            return "This URL has been previously identified as malicious in our database. Avoid accessing this site.";
        }
        
        return "This check was inconclusive. Consider using other security indicators to evaluate this site.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("marked as malicious")) {
            return `This URL was found in our database of known malicious websites. Our database compiles information from multiple security sources and previous scans to identify dangerous websites.

This URL has been previously identified as malicious, likely for one of these reasons:
- Hosting phishing pages that steal user information
- Distributing malware or unwanted software
- Engaging in scam activities
- Being part of a botnet or command-and-control infrastructure

The presence of this URL in our malicious database is a strong indicator of risk, as it has been verified as harmful by our systems.`;
        } else if (result.message.includes("Error contacting database")) {
            return `Our system was unable to check this URL against our security database. This is most likely due to temporary technical issues with our database service rather than a problem with the URL itself.

The database check is one of several security checks we perform. While this specific check couldn't be completed, the overall safety assessment is based on multiple other checks that were successful.`;
        } else if (result.message.includes("Failed to check database")) {
            return `We encountered an error while checking this URL against our security database. The specific database operation failed, which is typically due to internal service issues rather than properties of the URL itself.

This is a technical limitation of our current checking process and doesn't necessarily indicate anything about the safety of the URL. Other security checks were still performed and contribute to the overall assessment.`;
        }
        
        return `The database check for this URL was inconclusive. Our security database contains information about previously analyzed websites categorized as safe, suspicious, or malicious.

This URL was either not previously analyzed or had conflicting information in our database. This doesn't necessarily indicate the site is unsafe, but means we don't have reliable historical data about its safety profile.`;
    }
}