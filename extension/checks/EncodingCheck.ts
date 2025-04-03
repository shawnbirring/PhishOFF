import { type SafetyCheck, type CheckResult } from "./types";

export class EncodingCheck implements SafetyCheck {
    getName(): string {
        return "URL Encoding Analysis";
    }

    getDescription(): string {
        return "Detects suspicious URL encoding patterns that might hide malicious content";
    }

    getWeight(): number {
        return 15;
    }

    isFast(): boolean {
        return true;
    }

    async check(url: string): Promise<CheckResult> {
        const encodedCount = (url.match(/%[0-9A-Fa-f]{2}/g) || []).length;
        const suspiciousEncodings = /%[2-7][0-9A-Fa-f]/.test(url); // Common ASCII range
        const isSuspicious = encodedCount > 3 || suspiciousEncodings;

        return {
            name: this.getName(),
            message: isSuspicious ? 
                `Suspicious URL encoding detected (${encodedCount} encoded characters)` : 
                "Normal URL encoding pattern",
            type: isSuspicious ? "malicious" : "safe"
        };
    }
} 