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