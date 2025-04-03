import { type SafetyCheck, type CheckResult } from "./types";

export class EntropyCheck implements SafetyCheck {
    getName(): string {
        return "Entropy Analysis";
    }

    getDescription(): string {
        return "Detects randomly generated or suspicious URLs based on character entropy";
    }

    getWeight(): number {
        return 15;
    }

    isFast(): boolean {
        return true;
    }

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
} 