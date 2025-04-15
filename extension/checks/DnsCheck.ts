import { type SafetyCheck, type CheckResult } from "./types";

/**
 * DnsCheck analyzes DNS resolution for suspicious patterns
 * Detects when domains resolve to private IP ranges or have
 * DNS issues that could indicate phishing or malicious activity
 */
export class DnsCheck implements SafetyCheck {
    private readonly privateIpRanges = [
        /^192\.168\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^127\./,
        /^0\./
    ];

    getName(): string {
        return "DNS Resolution Check";
    }

    getDescription(): string {
        return "Analyzes DNS resolution for suspicious patterns and private IP ranges";
    }

    getWeight(): number {
        return 25;
    }

    isFast(): boolean {
        return false; // This check requires network requests
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const hostname = new URL(url).hostname;
            const dnsResult = await this.resolveDns(hostname);

            if (dnsResult.error) {
                return {
                    name: this.getName(),
                    message: `DNS resolution failed: ${dnsResult.error}`,
                    type: "unknown"
                };
            }

            const suspiciousIps = dnsResult.ips.filter(ip => 
                this.privateIpRanges.some(range => range.test(ip))
            );

            if (suspiciousIps.length > 0) {
                return {
                    name: this.getName(),
                    message: `Resolves to suspicious IP range(s): ${suspiciousIps.join(", ")}`,
                    type: "malicious"
                };
            }

            return {
                name: this.getName(),
                message: `Resolves to public IP(s): ${dnsResult.ips.join(", ")}`,
                type: "safe"
            };
        } catch (error) {
            return {
                name: this.getName(),
                message: "Unable to perform DNS resolution check",
                type: "unknown"
            };
        }
    }

    private async resolveDns(hostname: string): Promise<{ ips: string[], error?: string }> {
        try {
            const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
            const data = await response.json();

            if (!data.Answer) {
                return { ips: [], error: "No DNS records found" };
            }

            const ips = data.Answer
                .filter((record: any) => record.type === 1) // Type 1 = A record
                .map((record: any) => record.data);

            return { ips };
        } catch (error) {
            return { ips: [], error: error.message };
        }
    }

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Unable to perform")) {
            return "Could not analyze the DNS resolution for this site. Consider using caution.";
        } else if (result.message.includes("DNS resolution failed")) {
            return "DNS resolution issues detected. The domain may be misconfigured or recently registered.";
        }
        
        return "This site resolves to suspicious IP addresses, suggesting it may be part of a phishing campaign.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("suspicious IP range")) {
            return `The Domain Name System (DNS) records for this website showed suspicious characteristics. DNS translates human-readable domain names into IP addresses that computers use to identify each other.

This site resolves to IP addresses in private or reserved ranges, which is highly unusual for legitimate public websites. Private IP ranges (like 192.168.x.x, 10.x.x.x, or 172.16-31.x.x) are meant for internal networks, not public websites.

This could indicate:
- An attempt to redirect users to internal network resources (potential security attack)
- DNS poisoning or other manipulation of DNS records
- A misconfiguration, though this is rare for production websites

These characteristics are strongly associated with malicious activity and potential security risks.`;
        } else {
            return `The Domain Name System (DNS) records for this website showed suspicious characteristics. DNS translates human-readable domain names into IP addresses that computers use to identify each other.

Our check found one or more of these issues:
- The domain may have unusual DNS configuration
- The domain might be newly registered, which is common for phishing sites
- There may be mismatches between the domain's registration information and its DNS configuration
- The DNS resolution process encountered errors or inconsistencies

These characteristics can sometimes indicate higher risk of malicious activity, though they can also appear with legitimate but poorly configured websites.`;
        }
    }
} 