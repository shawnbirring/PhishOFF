import { type SafetyCheck, type CheckResult } from "./types";
import { HttpsCheck } from "./HttpsCheck";
import { DatabaseCheck } from "./DatabaseCheck";
import { EntropyCheck } from "./EntropyCheck";
import { EncodingCheck } from "./EncodingCheck";
import { BrandImpersonationCheck } from "./BrandImpersonationCheck";
import { RedirectCheck } from "./RedirectCheck";
import { DnsCheck } from "./DnsCheck";
import { CertificateCheck } from "./CertificateCheck";
import { VirusTotalCheck } from "./VirusTotalCheck";
import { getApiUrl } from "../utils/config";

export interface AnalysisSummary {
    url: string;
    results: CheckResult[];
    score: number; // 0-100 scale
    passed: number;
    total: number;
    message: string;
    details: {
        fastChecks: (CheckResult & { description: string; recommendation: string | null })[];
        deepChecks: (CheckResult & { description: string; recommendation: string | null })[];
        totalWeight: number;
        weightedScore: number;
    };
}

// List of all checks
const fastChecks: SafetyCheck[] = [
    new HttpsCheck(),
    new DatabaseCheck(),
    new EntropyCheck(),
    new EncodingCheck(),
    new BrandImpersonationCheck()
];

const deepChecks: SafetyCheck[] = [
    new RedirectCheck(),
    new DnsCheck(),
    new CertificateCheck(),
    new VirusTotalCheck()
];

/**
 * Generate a recommendation based on check result
 */
function getRecommendation(type: string, checkName: string, message: string): string | null {
    if (type === "safe") return null;
    
    // Return specific recommendations based on the check
    switch (checkName) {
        case "HTTPS Check":
            return "This site does not use secure HTTPS. Avoid entering sensitive information like passwords or credit card details.";
        case "Brand Impersonation Check":
            return "This site may be impersonating a legitimate brand. Double-check the URL carefully and consider visiting the official site directly.";
        case "Entropy Analysis":
            return "This URL contains unusual random characters, which is often seen in malicious sites.";
        case "URL Encoding Analysis":
            return "Unusual encoding in this URL could be hiding malicious content. Exercise caution.";
        case "Redirect Chain Analysis":
            return "This URL involves multiple redirects, which can be a sign of a phishing attempt.";
        case "DNS Resolution Check":
            return "This site resolves to suspicious IP addresses, suggesting it may be part of a phishing campaign.";
        case "Certificate Validity Check":
            if (message.includes("expired")) {
                return "This site's security certificate has expired. This could indicate the site is abandoned or poorly maintained, increasing security risk.";
            } else if (message.includes("expires soon")) {
                return "This site's security certificate is about to expire. While not immediately dangerous, it shows poor maintenance.";
            } else if (message.includes("trust issues")) {
                return "This site uses a certificate that isn't fully trusted. This could indicate a man-in-the-middle attack or improper configuration.";
            } else if (message.includes("Poor SSL rating")) {
                return "This site's SSL configuration is weak and vulnerable to known attacks. Your connection may not be secure.";
            }
            return "There are issues with this site's security certificate. Your connection may not be secure.";
        case "VirusTotal Check":
            if (message.includes("Unable to verify safety")) {
                return "VirusTotal could not complete the scan in time. This doesn't necessarily mean the site is unsafe, but you should proceed with caution.";
            } else if (message.includes("Failed to submit")) {
                return "Unable to check this URL with VirusTotal. Consider using alternative security tools to verify this site.";
            } else if (message.includes("malicious")) {
                return "This URL has been flagged by multiple security services as potentially harmful. Visiting it may put your device or personal information at risk.";
            }
            return "This URL has been flagged by VirusTotal. Avoid entering sensitive information on this site.";
        case "Database Check":
            if (message.includes("Error contacting database")) {
                return "Unable to connect to our security database. This is likely a temporary issue with our service, not a problem with the website.";
            } else if (message.includes("Failed to check database")) {
                return "Our security database service is experiencing issues. This does not necessarily mean the site is unsafe.";
            }
            return "This check was inconclusive. Consider using other security indicators to evaluate this site.";
        default:
            return type === "malicious" 
                ? "This check failed, indicating a potential security risk."
                : "This check was inconclusive. Proceed with caution.";
    }
}

export async function analyzeUrl(
    url: string,
    fastOnly: boolean = false
): Promise<AnalysisSummary> {
    // Run fast checks first
    const fastResults = await Promise.all(
        fastChecks.map(check => check.check(url))
    );

    // Run deep checks if not fastOnly
    const deepResults = fastOnly ? [] : await Promise.all(
        deepChecks.map(check => check.check(url))
    );

    // Combine all results
    const allResults = [...fastResults, ...deepResults];
    
    // Calculate weighted score
    const totalWeight = [...fastChecks, ...deepChecks].reduce(
        (sum, check) => sum + check.getWeight(),
        0
    );

    const weightedScore = allResults.reduce((score, result, i) => {
        const check = i < fastChecks.length ? 
            fastChecks[i] : 
            deepChecks[i - fastChecks.length];
            
        switch(result.type) {
            case "safe": return score + check.getWeight();
            case "unknown": return score + (check.getWeight() / 2);
            default: return score;
        }
    }, 0);

    const normalizedScore = Math.round((weightedScore / totalWeight) * 100);
    
    // Count results
    const passed = allResults.filter(r => r.type === "safe").length;
    const malicious = allResults.filter(r => r.type === "malicious").length;
    const unknown = allResults.filter(r => r.type === "unknown").length;

    // Generate summary message
    let message = `URL analysis complete - ${normalizedScore}% safety score. `;
    if (malicious > 0) {
        message += `Found ${malicious} security concerns. `;
    }
    if (unknown > 0) {
        message += `${unknown} checks were inconclusive. `;
    }
    if (malicious === 0 && unknown === 0) {
        message += "No security issues detected.";
    }

    // Enhance fast check results with descriptions and recommendations
    const enhancedFastResults = fastResults.map((result, index) => {
        const check = fastChecks[index];
        return {
            ...result,
            description: check.getDescription(),
            recommendation: getRecommendation(result.type, result.name, result.message)
        };
    });

    // Enhance deep check results with descriptions and recommendations
    const enhancedDeepResults = deepResults.map((result, index) => {
        const check = deepChecks[index];
        return {
            ...result,
            description: check.getDescription(),
            recommendation: getRecommendation(result.type, result.name, result.message)
        };
    });

    // Report to database
    reportUrlStatus(url, allResults);

    return {
        url,
        results: allResults,
        score: normalizedScore,
        passed,
        total: allResults.length,
        message,
        details: {
            fastChecks: enhancedFastResults,
            deepChecks: enhancedDeepResults,
            totalWeight,
            weightedScore
        }
    };
}

async function reportUrlStatus(url: string, results: CheckResult[]): Promise<void> {
    try {
        // Use a direct reference to the API endpoint to ensure connectivity
        const API_URL = "http://localhost:3000";
        
        const maliciousCount = results.filter(r => r.type === "malicious").length;
        const safeCount = results.filter(r => r.type === "safe").length;
        const status = maliciousCount > 0 ? "malicious" : 
                      safeCount > 0 ? "safe" : "unknown";

        console.log(`[Analyzer] Reporting URL status to database: ${url} as ${status}`);
        
        const response = await fetch(`${API_URL}/add-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url,
                status,
                checkResults: results
            }),
        });

        if (!response.ok) {
            console.error(`[Analyzer] Failed to report URL status: ${response.status}`);
        } else {
            console.log(`[Analyzer] Reported URL status: ${url} as ${status}`);
        }
    } catch (error) {
        console.error(`[Analyzer] Error reporting URL status: ${error}`);
    }
}