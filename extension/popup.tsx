import { useState } from "react"
import "./popup.css"

interface ScanResult {
    isSafe: boolean;
    message: string;
    details?: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
    };
}

function IndexPopup() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('[PhishOFF] Checking URL:', url);
            const response = await chrome.runtime.sendMessage({ 
                action: "checkWebsite", 
                url 
            });
            
            console.log('[PhishOFF] Check result:', response);
            setResult(response);
        } catch (error) {
            console.error('[PhishOFF] Check error:', error);
            setError("Failed to check URL");
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2>PhishOFF URL Checker</h2>
            
            <div className="input-group">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to check"
                    disabled={loading}
                />
                <button 
                    onClick={handleCheck}
                    disabled={loading || !url}
                    className={loading ? "loading" : ""}
                >
                    {loading ? "Checking..." : "Check URL"}
                </button>
            </div>

            {error && (
                <div className="error">
                    {error}
                </div>
            )}

            {result && (
                <div className={`result ${result.isSafe ? 'safe' : 'unsafe'}`}>
                    <h3>{result.isSafe ? "Safe" : "Warning"}</h3>
                    <p>{result.message}</p>
                    {result.details && (
                        <div className="details">
                            <p>Scan Results:</p>
                            <ul>
                                <li>Safe: {result.details.harmless}</li>
                                <li>Malicious: {result.details.malicious}</li>
                                <li>Suspicious: {result.details.suspicious}</li>
                                <li>Undetected: {result.details.undetected}</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default IndexPopup