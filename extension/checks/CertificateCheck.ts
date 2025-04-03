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
} 