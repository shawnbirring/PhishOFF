
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

/**
 * analyzer.ts - Core analysis engine for PhishOFF security checks
 * 
 * This file orchestrates all safety checks, collects results, and 
 * calculates overall safety scores for analyzed URLs. It manages both
 * fast checks (non-network) and deep checks (requiring network calls).
 */
export interface AnalysisSummary {
    url: string;
    results: CheckResult[];
    score: number; // 0-100 scale
    passed: number;
    total: number;
    message: string;
    details: {
        fastChecks: (CheckResult & { 
            description: string; 
            recommendation: string | null; 
            detailedExplanation?: string;
        })[];
        deepChecks: (CheckResult & { 
            description: string; 
            recommendation: string | null;
            detailedExplanation?: string;
        })[];
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
 * Analyzes a URL using security checks and produces a comprehensive analysis summary
 * 
 * @param url - The URL to analyze
 * @param fastOnly - If true, only run fast checks (non-network dependent)
 * @returns Analysis summary with detailed results, safety score, and recommendations
 */
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

    // Enhance fast check results with descriptions, recommendations, and detailed explanations
    const enhancedFastResults = fastResults.map((result, index) => {
        const check = fastChecks[index];
        
        return {
            ...result,
            description: check.getDescription(),
            recommendation: check.getRecommendation ? check.getRecommendation(result) : null,
            detailedExplanation: result.type !== "safe" && check.getDetailedExplanation ? 
                check.getDetailedExplanation(result, url) : null
        };
    });

    // Enhance deep check results with descriptions, recommendations, and detailed explanations
    const enhancedDeepResults = deepResults.map((result, index) => {
        const check = deepChecks[index];
        
        return {
            ...result,
            description: check.getDescription(),
            recommendation: check.getRecommendation ? check.getRecommendation(result) : null,
            detailedExplanation: result.type !== "safe" && check.getDetailedExplanation ? 
                check.getDetailedExplanation(result, url) : null
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

/**
 * Reports URL analysis results to the database for future reference
 * 
 * @param url - The URL that was analyzed 
 * @param results - The check results to report
 */
async function reportUrlStatus(url: string, results: CheckResult[]): Promise<void> {
    try {
        // Use a direct reference to the API endpoint to ensure connectivity
        const API_URL = "http://localhost:3000";
        
        const maliciousCount = results.filter(r => r.type === "malicious").length;
        const safeCount = results.filter(r => r.type === "safe").length;
        const status = maliciousCount > 0 ? "malicious" : 
                      safeCount > 0 ? "safe" : "unknown";

        const response = await fetch(`${API_URL}/report-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, status })
        });
        
        if (!response.ok) {
            console.error('[PhishOFF] Failed to report URL status:', response.status);
        }
    } catch (error) {
        console.error('[PhishOFF] Report URL status error:', error);
    }
}