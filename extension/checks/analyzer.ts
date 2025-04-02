import { type SafetyCheck, type CheckResult } from "./types";
import { HttpsCheck } from "./HttpsCheck";
import { DatabaseCheck } from "./DatabaseCheck";
import { getApiUrl } from "../utils/config";

export interface AnalysisSummary {
    url: string;
    results: CheckResult[];
    score: number; // Percentage confidence (0-100)
    passed: number;
    total: number;
    message: string;
}

// List of all checks
const allChecks: SafetyCheck[] = [new HttpsCheck(), new DatabaseCheck()];

export async function analyzeUrl(
    url: string,
    fastOnly: boolean = false
): Promise<AnalysisSummary> {
    // Filter checks based on speed if fastOnly is true
    const checksToRun = fastOnly
        ? allChecks.filter((check) => check.isFast())
        : allChecks;

    // Run all checks concurrently
    const results = await Promise.all(
        checksToRun.map((check) => check.check(url))
    );

    // Calculate weighted score
    const totalWeight = checksToRun.reduce(
        (sum, check) => sum + check.getWeight(),
        0
    );
    const passedWeight = results.reduce((sum, result, i) => {
        return result.type === "safe" ? sum + checksToRun[i].getWeight() : sum;
    }, 0);
    const score = Math.round((passedWeight / totalWeight) * 100);

    // Count results
    const total = results.length;
    const passed = results.filter(r => r.type === "safe").length;
    const malicious = results.filter(r => r.type === "malicious").length;
    const unknown = results.filter(r => r.type === "unknown").length;

    reportUrlStatus(url, results); // Fire-and-forget, no await

    let message = `URL passed ${passed} out of ${total} tests. `;
    if (malicious > 0) {
        message += `We are ${100 - score}% confident this URL is unsafe due to ${malicious} malicious indicators.`;
    } else if (unknown > 0) {
        message += `We are ${score}% confident this URL is safe, but ${unknown} checks were inconclusive.`;
    } else {
        message += `We are ${score}% confident this URL is safe.`;
    }

    return { url, results, score, passed, total, message };
}


async function reportUrlStatus(url: string, results: CheckResult[]): Promise<void> {
    try {
        const API_URL = getApiUrl();
        // Determine overall status based on results
        const maliciousCount = results.filter(r => r.type === "malicious").length;
        const safeCount = results.filter(r => r.type === "safe").length;
        const status = maliciousCount > 0 ? "malicious" : safeCount > 0 ? "safe" : "unknown";

        const response = await fetch(`${API_URL}/add-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url,
                status, // Overall status: "malicious", "safe", or "unknown"
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