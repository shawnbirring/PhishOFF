import { type SafetyCheck, type CheckResult } from "./types";

export class HttpsCheck implements SafetyCheck {
    getName(): string {
        return "HTTPS Check";
    }

    getDescription(): string {
        return "Checks if the site uses a secure HTTPS connection.";
    }

    getWeight(): number {
        return 10;
    }

    isFast(): boolean {
        return true;
    }

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

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        return "This site does not use secure HTTPS. Avoid entering sensitive information like passwords or credit card details.";
    }

    getDetailedExplanation(result: CheckResult, url: string): string | null {
        if (result.type === "safe") return null;
        
        return `HTTPS (Hypertext Transfer Protocol Secure) is the secure version of HTTP, the protocol over which data is sent between your browser and the website. HTTPS ensures that all communications between your browser and the website are encrypted.

This website is using HTTP instead of HTTPS. Without encryption, attackers can potentially intercept data transmitted between you and the website, including passwords, credit card numbers, or other sensitive information. This is especially risky when connected to public Wi-Fi networks.

Modern secure websites should always use HTTPS to protect user data. Major browsers like Chrome now mark HTTP sites as "Not Secure" in the address bar.`;
    }
}