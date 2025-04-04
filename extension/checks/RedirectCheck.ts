import { type SafetyCheck, type CheckResult } from "./types";

export class RedirectCheck implements SafetyCheck {
    getName(): string {
        return "Redirect Chain Analysis";
    }

    getDescription(): string {
        return "Analyzes URL redirect chains for suspicious patterns";
    }

    getWeight(): number {
        return 20;
    }

    isFast(): boolean {
        return false; // This check requires network requests
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const redirects = await this.followRedirects(url);
            const isSuspicious = redirects.length > 2;

            return {
                name: this.getName(),
                message: isSuspicious ?
                    `Suspicious redirect chain detected (${redirects.length} redirects)` :
                    `Normal redirect pattern (${redirects.length} redirects)`,
                type: isSuspicious ? "malicious" : "safe"
            };
        } catch (error) {
            return {
                name: this.getName(),
                message: "Unable to analyze redirect chain",
                type: "unknown"
            };
        }
    }

    private async followRedirects(url: string, maxRedirects = 5): Promise<string[]> {
        const redirects: string[] = [];
        let currentUrl = url;

        for (let i = 0; i < maxRedirects; i++) {
            try {
                const response = await fetch(currentUrl, {
                    method: 'HEAD',
                    redirect: 'manual'
                });

                if (response.status >= 300 && response.status < 400) {
                    const location = response.headers.get('location');
                    if (!location) break;

                    redirects.push(location);
                    currentUrl = new URL(location, currentUrl).href;
                } else {
                    break;
                }
            } catch {
                break;
            }
        }

        return redirects;
    }

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Unable to analyze")) {
            return "Could not analyze the redirect chain for this URL. Consider using caution if you're unfamiliar with the site.";
        }
        
        return "This URL involves multiple redirects, which can be a sign of a phishing attempt.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        const hasMultipleRedirects = result.message.includes("Suspicious redirect chain");
        
        return `This URL involves a suspicious chain of redirects before reaching its final destination. While redirects are common on the web, excessive or suspicious redirect patterns are often used in phishing attacks to mask the true destination.

The redirect chain for this URL showed one or more concerning characteristics:
- ${hasMultipleRedirects ? 'Unusually long chain of redirects (more than 2 redirects)' : 'At least one redirect that could not be properly analyzed'}
- Redirects through domains with poor reputation
- Redirects through URL shortening services that mask the final destination
- Redirects that attempt to circumvent security measures

These redirect techniques can be used to evade detection by security tools and to mislead users about where a link will take them.`;
    }
} 