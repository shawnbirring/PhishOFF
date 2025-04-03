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
} 