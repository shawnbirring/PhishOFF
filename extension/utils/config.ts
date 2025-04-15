/**
 * Gets the VirusTotal API key from environment
 * @returns API key string
 */
export function getApiKey(): string {
    const apiKey = process.env.PLASMO_PUBLIC_VIRUSTOTAL_API_KEY;

    if (!apiKey) {
        throw new Error("VirusTotal API key not found in environment");
    }

    return apiKey;
}

/**
 * Gets the API URL of the express server from environment
 * @returns API URL string
 */
export function getApiUrl(): string {
    const apiUrl = process.env.PLASMO_PUBLIC_API_URL;

    if (!apiUrl) {
        throw new Error("API URL not found in environment");
    }

    return apiUrl;
}
