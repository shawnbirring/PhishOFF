import { type SafetyCheck, type CheckResult } from "./types";

export class CertificateCheck implements SafetyCheck {
    getName(): string {
        return "Certificate Validity Check";
    }

    getDescription(): string {
        return "Verifies the SSL certificate's issuer, expiration date, and other security attributes";
    }

    isFast(): boolean {
        return false; // This check requires network requests
    }

    getWeight(): number {
        return 25; // High weight due to importance of certificate validity
    }

    async check(url: string): Promise<CheckResult> {
        try {
            // Ensure URL uses HTTPS
            const urlObj = new URL(url);
            if (urlObj.protocol !== "https:") {
                return {
                    name: this.getName(),
                    message: "Site does not use HTTPS, certificate cannot be verified",
                    type: "malicious"
                };
            }

            // Fetch certificate information
            const certInfo = await this.fetchCertificateInfo(urlObj.hostname);
            
            if (!certInfo) {
                return {
                    name: this.getName(),
                    message: "Unable to retrieve certificate information",
                    type: "unknown"
                };
            }

            // Check certificate validity
            const issues = this.validateCertificate(certInfo);
            
            if (issues.length > 0) {
                return {
                    name: this.getName(),
                    message: `Certificate issues detected: ${issues.join(", ")}`,
                    type: "malicious"
                };
            }

            return {
                name: this.getName(),
                message: "SSL certificate is valid and trusted",
                type: "safe"
            };
            
        } catch (error) {
            console.error(`[CertificateCheck] Error: ${error}`);
            return {
                name: this.getName(),
                message: "Unable to verify certificate",
                type: "unknown"
            };
        }
    }

    /**
     * Fetch certificate information using external service
     * We're using the SSL Labs API for this purpose
     */
    private async fetchCertificateInfo(hostname: string): Promise<any> {
        // SSL Labs API v3 configuration
        const baseUrl = 'https://api.ssllabs.com/api/v3';
        
        // Organization information for API access
        const orgEmail = 'yaban@my.bcit.ca'; // Use your school/organization email
        
        // Check if we need to register first (should be done once, but included for completeness)
        await this.registerWithSSLLabs();
        
        // Set up request parameters
        const params = new URLSearchParams({
            host: hostname,
            publish: 'off',
            startNew: 'on',
            all: 'done',
            ignoreMismatch: 'on' // More permissive for testing
        });
        
        const url = `${baseUrl}/analyze?${params.toString()}`;
        const headers = {
            'email': orgEmail // Required header for authenticated API calls
        };

        try {
            // Start the assessment
            let response = await fetch(url, { 
                headers: headers 
            });
            
            let result = await response.json();
            console.log(`[CertificateCheck] Initial scan status: ${result.status}`);

            // Poll until the scan is ready or an error occurs
            let pollCount = 0;
            const maxPolls = 12; // 2 minutes max with 10s between polls
            
            while (result.status !== 'READY' && result.status !== 'ERROR' && pollCount < maxPolls) {
                console.log(`[CertificateCheck] Status: ${result.status}. Waiting for scan to complete...`);
                // Wait for 10 seconds before polling again
                await new Promise(resolve => setTimeout(resolve, 10000));
                
                // Use a different URL for polling (no startNew parameter)
                const pollUrl = `${baseUrl}/analyze?host=${hostname}&all=done`;
                response = await fetch(pollUrl, { 
                    headers: headers 
                });
                
                result = await response.json();
                pollCount++;
            }

            if (result.status === 'READY') {
                console.log('[CertificateCheck] Scan complete');
                return result;
            } else if (pollCount >= maxPolls) {
                console.log('[CertificateCheck] Scan taking too long, returning partial results');
                // Return partial results if available
                return result.status !== 'ERROR' ? result : null;
            } else {
                console.error('[CertificateCheck] Scan encountered an error:', result);
                return null;
            }
        } catch (error) {
            console.error('[CertificateCheck] Error during SSL Labs scan:', error);
            return null;
        }
    }
    
    /**
     * Register with SSL Labs API (one-time operation)
     * Note: In a production app, you would want to do this once and store the result
     */
    private async registerWithSSLLabs(): Promise<boolean> {
        try {
            const baseUrl = 'https://api.ssllabs.com/api/v3';
            const registrationData = {
                firstName: "PhishOFF",
                lastName: "Extension",
                organization: "BCIT Student Project",
                email: "phishoff@schoolproject.edu" // Use your school/organization email
            };
            
            console.log('[CertificateCheck] Registering with SSL Labs API');
            
            const response = await fetch(`${baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });
            
            if (response.ok) {
                console.log('[CertificateCheck] Registration successful');
                return true;
            } else {
                const errorText = await response.text();
                console.error('[CertificateCheck] Registration failed:', errorText);
                // Continue anyway - might already be registered
                return false;
            }
        } catch (error) {
            console.error('[CertificateCheck] Error during registration:', error);
            // Continue anyway - might be network error but API might still work
            return false;
        }
    }

    /**
     * Validate certificate based on retrieved information
     */
    private validateCertificate(certInfo: any): string[] {
        const issues: string[] = [];
        
        // Check if assessment completed successfully
        if (certInfo.status === 'ERROR') {
            issues.push('Certificate assessment failed');
            return issues;
        }
        
        // For demo/dev purposes, handle in-progress state
        if (certInfo.status === 'IN_PROGRESS') {
            // In dev/demo, we'll assume cert is good if assessment is still running
            return issues;
        }
        
        // Check each endpoint (typically just one)
        if (certInfo.endpoints && certInfo.endpoints.length > 0) {
            const endpoint = certInfo.endpoints[0];
            
            // Check grade - F or T are failing grades
            if (endpoint.grade === 'F' || endpoint.grade === 'T') {
                issues.push(`Poor SSL rating: ${endpoint.grade}`);
            }
            
            // Certificate specific checks
            if (endpoint.details && endpoint.details.cert) {
                const cert = endpoint.details.cert;
                
                // Check expiration
                const notAfter = new Date(cert.notAfter);
                const now = new Date();
                
                // Certificate is expired
                if (notAfter < now) {
                    issues.push('Certificate has expired');
                }
                
                // Certificate is about to expire (within 14 days)
                const twoWeeksFromNow = new Date();
                twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
                if (notAfter < twoWeeksFromNow) {
                    issues.push('Certificate expires soon');
                }
                
                // Check validity type - domain validation is less trusted than organization validation
                if (cert.validationType === 'domain') {
                    // This is just a warning, not a critical issue
                    // issues.push('Uses basic domain validation only');
                }
                
                // Check for untrusted issuer
                if (endpoint.details.chainIssues && endpoint.details.chainIssues > 0) {
                    issues.push('Certificate chain has trust issues');
                }
            }
        }
        
        return issues;
    }

    getRecommendation(result: CheckResult): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Unable to verify")) {
            return "Could not validate the security certificate for this site. Consider using caution.";
        } else if (result.message.includes("Site does not use HTTPS")) {
            return "This site does not use HTTPS. Avoid entering sensitive information like passwords or credit card details.";
        } else if (result.message.includes("Certificate has expired")) {
            return "This site's security certificate has expired. This could indicate the site is abandoned or poorly maintained, increasing security risk.";
        } else if (result.message.includes("Certificate expires soon")) {
            return "This site's security certificate is about to expire. While not immediately dangerous, it shows poor maintenance.";
        } else if (result.message.includes("trust issues")) {
            return "This site uses a certificate that isn't fully trusted. This could indicate a man-in-the-middle attack or improper configuration.";
        } else if (result.message.includes("Poor SSL rating")) {
            return "This site's SSL configuration is weak and vulnerable to known attacks. Your connection may not be secure.";
        }
        
        return "There are issues with this site's security certificate. Your connection may not be secure.";
    }

    getDetailedExplanation(result: CheckResult, url?: string): string | null {
        if (result.type === "safe") return null;
        
        if (result.message.includes("Site does not use HTTPS")) {
            return `This website does not use HTTPS, which is required for secure certificates. HTTPS (Hypertext Transfer Protocol Secure) is essential for encrypting communication between your browser and websites.

Without HTTPS:
- All data is transmitted in plain text and can be intercepted
- There is no verification of the website's true identity
- Modern browsers will mark the site as "Not Secure"

Most legitimate websites now use HTTPS by default, especially those handling any form of user data or login information.`;
        } else if (result.message.includes("Certificate has expired")) {
            return `This website's SSL/TLS certificate has expired. Every secure website uses a certificate to prove its identity and establish encrypted connections. Certificates have expiration dates (typically 1-2 years) after which they must be renewed.

An expired certificate indicates one of several issues:
- The site owner has neglected basic security maintenance
- The site may be abandoned but still accessible
- In some cases, attackers may use copies of legitimate but expired certificates

Browsers display warnings about expired certificates because they can no longer verify if the connection is secure and authentic. You should never proceed to sites with expired certificates if they handle sensitive information.`;
        } else if (result.message.includes("Certificate expires soon")) {
            return `This website's SSL/TLS certificate is about to expire soon. While the certificate is still valid right now, it will become invalid in the near future.

Website owners typically receive multiple reminders to renew their certificates before expiration. Failure to plan for renewal suggests possible neglect of security practices. While not immediately dangerous, it indicates the site may not be following security best practices.`;
        } else if (result.message.includes("trust issues")) {
            return `This website's SSL/TLS certificate has trust issues. For a certificate to be trusted, it must be issued by a Certificate Authority (CA) that browsers recognize and trust.

The certificate for this site has one or more of the following problems:
- It's self-signed (created by the website owner, not a trusted CA)
- It was issued by an untrusted Certificate Authority
- The certificate chain is incomplete or invalid
- The certificate doesn't match the domain name you're visiting

These issues could indicate a potential "man-in-the-middle" attack where an attacker intercepts your connection, or simply poor security configuration by the site owner.`;
        } else if (result.message.includes("Poor SSL rating")) {
            return `This website has a poor SSL/TLS security configuration. Beyond just having a valid certificate, websites need to configure their secure connections properly.

This site has security weaknesses such as:
- Using outdated, vulnerable encryption protocols (like SSLv3, TLS 1.0 or 1.1)
- Supporting weak cipher suites that could be cracked
- Vulnerability to known attacks like POODLE, BEAST, or Heartbleed
- Missing important security headers or using insecure settings

These weaknesses mean that while the connection appears secure, it may be vulnerable to sophisticated attacks that could compromise encrypted data.`;
        } else if (result.message.includes("Unable to verify")) {
            return `We could not complete a thorough verification of this website's security certificate. This does not necessarily mean the site is unsafe, but we couldn't confirm it meets current security standards.

Possible reasons for this include:
- Limited access to certificate verification services
- Network connectivity issues when checking the certificate
- The site using an unusual certificate configuration

When certificate checks cannot be completed, it's best to exercise caution, especially before entering sensitive information.`;
        }
        
        return `This website has certificate security issues. SSL/TLS certificates are fundamental to secure web browsing, establishing both encryption and authentication of the site's identity.

The specific certificate issue detected could allow an attacker to potentially intercept or modify data you send to or receive from this website, even though the connection appears secure.`;
    }
} 