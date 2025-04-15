/**
 * types.ts - Core type definitions for the PhishOFF security check system
 * Contains interfaces that define the structure for check results and 
 * the common interface implemented by all safety check classes.
 */

/**
 * Represents the result of a security check operation
 * @interface CheckResult
 */
export interface CheckResult {
    name: string;
    message: string;
    type: "malicious" | "safe" | "unknown";
    detailedExplanation?: string;
}

/**
 * Common interface implemented by all safety check classes
 * Defines the required methods for every check implementation
 * @interface SafetyCheck
 */
export interface SafetyCheck {
    getName(): string;
    getDescription(): string;
    isFast(): boolean;
    // 1-100 scale
    getWeight(): number;
    check(url: string): Promise<CheckResult>;
    getRecommendation?(result: CheckResult): string | null;
    getDetailedExplanation?(result: CheckResult, url?: string): string | null;
}