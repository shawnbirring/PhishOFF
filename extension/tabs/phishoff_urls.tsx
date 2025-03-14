import { useState, useEffect } from "react"
import "../styles/phishoff.css"

interface UrlEntry {
  _id: string;
  url: string;
  status: "safe" | "malicious" | "unknown";
  lastChecked: string;
  __v?: number;
}

function PhishoffUrls() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "safe" | "malicious" | "unknown">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // API endpoint for our MongoDB service
  const BACKEND_URL = "http://localhost:3000/urls";
  
  // Fetch all URLs on mount
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setLoading(true);
        const res = await fetch(BACKEND_URL);
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const data = await res.json();
        setUrls(data);
        console.log("Loaded URLs:", data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch URLs:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUrls();
  }, []);
  
  // Filter logic
  const filteredUrls = filter === "all" ? 
    urls : 
    urls.filter(urlObj => urlObj.status === filter);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="content-centered" style={{minHeight: '100vh', alignItems: 'flex-start', paddingTop: '2rem'}}>
      <div className="card" style={{maxWidth: '800px'}}>
        <div className="header">
          <h1 className="title">PhishOFF URL Database</h1>
        </div>
        
        {/* Filter controls */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Filter by status:</label>
          <div className="filter-group">
            <button 
              onClick={() => setFilter("all")}
              className={`filter-btn ${filter === "all" ? 'active' : ''}`}
            >
              All ({urls.length})
            </button>
            <button 
              onClick={() => setFilter("safe")}
              className={`filter-btn ${filter === "safe" ? 'active-safe' : ''}`}
            >
              Safe ({urls.filter(u => u.status === "safe").length})
            </button>
            <button 
              onClick={() => setFilter("malicious")}
              className={`filter-btn ${filter === "malicious" ? 'active-malicious' : ''}`}
            >
              Malicious ({urls.filter(u => u.status === "malicious").length})
            </button>
            <button 
              onClick={() => setFilter("unknown")}
              className={`filter-btn ${filter === "unknown" ? 'active-unknown' : ''}`}
            >
              Unknown ({urls.filter(u => u.status === "unknown").length})
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="details" style={{backgroundColor: '#feebe6', marginBottom: '1rem'}}>
            <p style={{color: '#e54d42'}}>Error: {error}</p>
          </div>
        )}
        
        {/* URL list */}
        <div className="table-container">
          {loading ? (
            <div className="loading">
              <div className="spinner mr-2"></div>
              <span>Loading URLs...</span>
            </div>
          ) : filteredUrls.length > 0 ? (
            <table className="url-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {filteredUrls.map((urlObj) => (
                  <tr key={urlObj._id}>
                    <td>
                      <a href={urlObj.url} target="_blank" rel="noopener noreferrer"
                         style={{color: '#3c6cf0', textDecoration: 'none', fontWeight: 500}}>
                        {urlObj.url}
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${
                        urlObj.status === 'safe' ? 'badge-safe' :
                        urlObj.status === 'malicious' ? 'badge-malicious' : 'badge-unknown'
                      }`}>
                        {urlObj.status}
                      </span>
                    </td>
                    <td style={{color: '#6c7589'}}>
                      {formatDate(urlObj.lastChecked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="loading" style={{backgroundColor: '#f9fafc', borderRadius: '8px'}}>
              No URLs found matching the filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhishoffUrls