export interface CheckResult {
    name: string;
    message: string;
    type: "malicious" | "safe" | "unknown";
    detailedExplanation?: string;
}

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