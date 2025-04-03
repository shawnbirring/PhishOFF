import { type SafetyCheck, type CheckResult } from "./types";
import { getApiUrl } from "../utils/config";

export class DatabaseCheck implements SafetyCheck {
    getName(): string {
        return "Database Check";
    }

    getDescription(): string {
        return "Checks if the URL is already known in our database as safe, malicious, or unknown.";
    }

    isFast(): boolean {
        return true; // Fast due to Redis caching and simple DB lookup
    }

    getWeight(): number {
        return 40; // High weight since it's based on prior verified results
    }

    async check(url: string): Promise<CheckResult> {
        try {
            const API_URL = "http://localhost:3000";
            console.log(`[DatabaseCheck] Checking URL in database: ${url}`);
            const response = await fetch(`${API_URL}/check-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                console.error(`[DatabaseCheck] Server returned status ${response.status}`);
                return {
                    name: this.getName(),
                    message: `Failed to check database (status: ${response.status})`,
                    type: "unknown",
                };
            }

            const data = await response.json();
            console.log(`[DatabaseCheck] Database response:`, data);
            const status = data.status; // "safe", "malicious", or "unknown"

            switch (status) {
                case "safe":
                    return {
                        name: this.getName(),
                        message: "URL is marked as safe in our database",
                        type: "safe",
                    };
                case "malicious":
                    return {
                        name: this.getName(),
                        message: "URL is marked as malicious in our database",
                        type: "malicious",
                    };
                case "unknown":
                default:
                    return {
                        name: this.getName(),
                        message: "URL not found in database",
                        type: "unknown",
                    };
            }
        } catch (error) {
            console.error(`[DatabaseCheck] Error checking URL: ${error}`);
            return {
                name: this.getName(),
                message: "Error contacting database",
                type: "unknown",
            };
        }
    }
}