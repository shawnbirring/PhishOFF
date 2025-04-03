import { type SafetyCheck, type CheckResult } from "./types";

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
} 