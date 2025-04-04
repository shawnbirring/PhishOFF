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

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        return "Unusual encoding in this URL could be hiding malicious content. Exercise caution.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        return `This URL contains suspicious encoding patterns that are frequently used to disguise malicious URLs. Encoding converts characters into a format that can be transmitted over the Internet but can also be used to hide the true destination of a link.

Suspicious encoding patterns include:
- Excessive use of percent-encoding (e.g., %20, %3D) when not necessary
- Double-encoding (encoding already encoded characters)
- Encoding alphabetic characters that don't need to be encoded
- Using hexadecimal or other representations to obscure the actual URL

These techniques are often used to bypass security filters or to trick users about the actual destination of a link.`;
    }
} 