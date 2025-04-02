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
}