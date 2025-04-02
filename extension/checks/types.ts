export interface CheckResult {
    name: string;
    message: string;
    type: "malicious" | "safe" | "unknown";
}

export interface SafetyCheck {
    getName(): string;
    getDescription(): string;
    isFast(): boolean;
    // 1-100 scale
    getWeight(): number;
    check(url: string): Promise<CheckResult>;
}