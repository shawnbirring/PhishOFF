/**
 * HttpsCheck.ts - Implements HTTPS protocol verification for URLs
 * 
 * This check verifies whether a URL uses the secure HTTPS protocol instead of the insecure HTTP protocol.
 * Websites using HTTP are considered potentially unsafe as they don't encrypt data transmitted between
 * the browser and the server, making them vulnerable to data interception.
 */

import { type SafetyCheck, type CheckResult } from "./types";

/**
 * HttpsCheck verifies that a website uses the secure HTTPS protocol
 * Sites using HTTP instead of HTTPS are considered potentially unsafe
 * as they don't encrypt data transmitted between browser and server
 */
export class HttpsCheck implements SafetyCheck {
    /**
     * @returns The display name of this check
     */
    getName(): string {
        return "HTTPS Check";
    }

    /**
     * @returns A description of what this check does
     */
    getDescription(): string {
        return "Checks if the site uses a secure HTTPS connection.";
    }

    /**
     * @returns The weight of this check for scoring calculations (out of 100)
     */
    getWeight(): number {
        return 10;
    }

    /**
     * @returns True because this is a fast check that doesn't require network requests
     */
    isFast(): boolean {
        return true;
    }

    /**
     * Checks if the URL uses the HTTPS protocol
     * @param url - The URL to check
     * @returns A CheckResult indicating whether the URL uses HTTPS
     */
    async check(url: string): Promise<CheckResult> {
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== "https:") {
                return {
                    name: this.getName(),
                    message: "Site does not use HTTPS",
                    type: "malicious"
                };
            }
            return {
                name: this.getName(),
                message: "Site uses HTTPS",
                type: "safe"
            };
        } catch {
            return {
                name: this.getName(),
                message: "Invalid URL",
                type: "unknown"
            };
        }
    }

    /**
     * Provides a recommendation when a site doesn't use HTTPS
     * @param result - The check result
     * @returns A recommendation string or null if the check passed
     */
    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        return "This site does not use secure HTTPS. Avoid entering sensitive information like passwords or credit card details.";
    }

    /**
     * Provides a detailed explanation about HTTPS importance and risks of HTTP
     * @param result - The check result
     * @param url - The URL that was checked
     * @returns A detailed explanation or null if the check passed
     */
    getDetailedExplanation(result: CheckResult, url: string): string | null {
        if (result.type === "safe") return null;
        
        return `HTTPS (Hypertext Transfer Protocol Secure) is the secure version of HTTP, the protocol over which data is sent between your browser and the website. HTTPS ensures that all communications between your browser and the website are encrypted.

This website is using HTTP instead of HTTPS. Without encryption, attackers can potentially intercept data transmitted between you and the website, including passwords, credit card numbers, or other sensitive information. This is especially risky when connected to public Wi-Fi networks.

Modern secure websites should always use HTTPS to protect user data. Major browsers like Chrome now mark HTTP sites as "Not Secure" in the address bar.`;
    }
}