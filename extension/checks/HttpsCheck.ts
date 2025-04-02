import { type SafetyCheck, type CheckResult } from "./types";

export class HttpsCheck implements SafetyCheck {
    getName(): string {
        return "HTTPS Check";
    }

    getDescription(): string {
        return "Checks if the site uses a secure HTTPS connection.";
    }

    isFast(): boolean {
        return true;
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol !== "https:") {
                return {
                    message: "Site does not use HTTPS",
                    type: "malicious"
                };
            }
            return {
                message: "Site uses HTTPS",
                type: "safe"
            };
        } catch {
            return {
                message: "Invalid URL",
                type: "unknown"
            };
        }
    }
}