import { useState } from "react"
import "./styles/phishoff.css"

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
    
    const openUrlsList = () => {
        chrome.runtime.sendMessage({ action: "openUrlsList" });
    };

    return (
        <div className="card" style={{maxWidth: '350px', margin: '0', borderRadius: '8px'}}>
            <div className="header">
                <h1 className="title">PhishOFF URL Checker</h1>
            </div>
            
            <div style={{display: 'flex', marginBottom: '1rem', gap: '8px'}}>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to check"
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '0.625rem',
                        borderRadius: '4px',
                        border: '1px solid #eaedf3',
                        fontSize: '0.875rem'
                    }}
                />
                <button 
                    onClick={handleCheck}
                    disabled={loading || !url}
                    className="btn btn-primary"
                    style={{whiteSpace: 'nowrap'}}
                >
                    {loading ? (
                        <span style={{display: 'flex', alignItems: 'center'}}>
                            <div className="spinner" style={{width: '16px', height: '16px', marginRight: '6px'}}></div>
                            Checking
                        </span>
                    ) : "Check URL"}
                </button>
            </div>

            {error && (
                <div className="details" style={{backgroundColor: '#feebe6', marginBottom: '1rem'}}>
                    <p style={{color: '#e54d42', margin: 0}}>{error}</p>
                </div>
            )}

            {result && (
                <div className={`details ${result.isSafe ? 'safe' : 'unsafe'}`} 
                     style={{
                         backgroundColor: result.isSafe ? '#e7f9ee' : '#feebe6',
                         marginTop: '1rem',
                         padding: '1rem',
                         borderRadius: '8px',
                         textAlign: 'center'
                     }}>
                    <h3 style={{
                        margin: '0 0 0.5rem 0',
                        color: result.isSafe ? '#0d8a45' : '#e54d42',
                    }}>
                        {result.isSafe ? "Safe" : "Warning"}
                    </h3>
                    <p style={{
                        margin: '0',
                        color: result.isSafe ? '#1a7750' : '#cd3d34'
                    }}>
                        {result.message}
                    </p>
                    
                    {result.details && (
                        <div className="details" style={{marginTop: '1rem', backgroundColor: 'rgba(255,255,255,0.5)'}}>
                            <p className="details-title">Scan Results:</p>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-dot dot-green"></span>
                                    <span>Safe: <strong>{result.details.harmless}</strong></span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-dot dot-red"></span>
                                    <span>Malicious: <strong>{result.details.malicious}</strong></span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-dot dot-yellow"></span>
                                    <span>Suspicious: <strong>{result.details.suspicious}</strong></span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-dot dot-gray"></span>
                                    <span>Undetected: <strong>{result.details.undetected}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="footer">
                <button onClick={openUrlsList} className="link-button">
                    View URL Database
                </button>
            </div>
        </div>
    )
}

export default IndexPopup