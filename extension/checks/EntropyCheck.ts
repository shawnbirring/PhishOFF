import { type SafetyCheck, type CheckResult } from "./types";

/**
 * EntropyCheck examines the randomness (entropy) of characters in a URL
 * High entropy URLs often contain random-looking strings that are commonly 
 * associated with malicious sites, malware, or phishing attempts
 */
export class EntropyCheck implements SafetyCheck {
    // Returns the display name for this check
    getName(): string {
        return "Entropy Analysis";
    }

    // Returns a description of what this check does
    getDescription(): string {
        return "Detects randomly generated or suspicious URLs based on character entropy";
    }

    // Returns the weight of this check (1-100 scale)
    getWeight(): number {
        return 15;
    }

    // Indicates this is a fast check that doesn't require network requests
    isFast(): boolean {
        return true;
    }

    // Performs entropy calculation on the URL and determines if it's suspicious
    async check(url: string): Promise<CheckResult> {
        const entropy = this.calculateEntropy(url);
        const MAX_ENTROPY = 4.5;

        return {
            name: this.getName(),
            message: entropy > MAX_ENTROPY ? 
                `High URL randomness detected (entropy: ${entropy.toFixed(2)})` : 
                "Normal URL entropy pattern",
            type: entropy <= MAX_ENTROPY ? "safe" : "malicious"
        };
    }

    // Calculates Shannon entropy for the input string
    private calculateEntropy(str: string): number {
        const len = str.length;
        const frequencies = new Map<string, number>();
        
        for (const char of str) {
            frequencies.set(char, (frequencies.get(char) || 0) + 1);
        }
        
        return Array.from(frequencies.values()).reduce((entropy, freq) => {
            const p = freq / len;
            return entropy - p * Math.log2(p);
        }, 0);
    }
    
    // Returns user recommendation for suspicious entropy URLs
    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        return "This URL contains unusual random characters, which is often seen in malicious sites.";
    }

    // Provides detailed explanation about entropy issues in URLs
    getDetailedExplanation(result: CheckResult, url: string): string | null {
        if (result.type === "safe") return null;
        
        return `This URL contains an unusually high amount of random-looking characters or "entropy." High entropy in URLs is often associated with malicious sites, particularly those generated by malware or phishing kits.

Legitimate websites typically use readable, meaningful words in their URLs, while malicious sites may use randomly generated strings to avoid detection or to create unique tracking identifiers.

The entropy score for this URL exceeds our safety threshold, suggesting the domain or path contains randomized components that are statistically unusual for legitimate websites.`;
    }
} 