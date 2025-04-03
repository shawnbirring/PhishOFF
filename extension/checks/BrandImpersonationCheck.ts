import { type SafetyCheck, type CheckResult } from "./types";

export class BrandImpersonationCheck implements SafetyCheck {
    private readonly commonBrands = [
        { real: "google", fake: /g[o0]{2,}gle|go{2,}gle|goog[l1]e/i },
        { real: "facebook", fake: /faceb[o0]{2,}k|facebo{2,}k/i },
        { real: "microsoft", fake: /micr[o0]s[o0]ft|micro{2,}s[o0]ft/i },
        { real: "paypal", fake: /payp[a@]l|p[a@]ypal/i },
        { real: "amazon", fake: /am[a@]z[o0]n/i },
        { real: "apple", fake: /[a@]ppl[e3]/i },
        { real: "netflix", fake: /n[e3]tfl[i1]x/i },
        { real: "twitter", fake: /tw[i1]tt[e3]r/i }
    ];

    getName(): string {
        return "Brand Impersonation Check";
    }

    getDescription(): string {
        return "Detects attempts to impersonate well-known brands through URL manipulation";
    }

    getWeight(): number {
        return 25;
    }

    isFast(): boolean {
        return true;
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const hostname = new URL(url).hostname;
            const detectedBrands = this.commonBrands.filter(brand => 
                !hostname.includes(brand.real) && brand.fake.test(hostname)
            );

            if (detectedBrands.length > 0) {
                const impersonatedBrands = detectedBrands.map(b => b.real).join(", ");
                return {
                    name: this.getName(),
                    message: `Possible impersonation of: ${impersonatedBrands}`,
                    type: "malicious"
                };
            }

            return {
                name: this.getName(),
                message: "No brand impersonation detected",
                type: "safe"
            };
        } catch (error) {
            return {
                name: this.getName(),
                message: "Unable to analyze URL for brand impersonation",
                type: "unknown"
            };
        }
    }
} 