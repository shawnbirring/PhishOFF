export interface CheckResult {
    message: string;
    type: "malicious" | "safe" | "unknown";
}

export interface SafetyCheck {
    getName(): string;
    getDescription(): string;
    isFast(): boolean;
    check(url: string): Promise<CheckResult>;
}