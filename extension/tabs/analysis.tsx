import { useState, useEffect } from "react";
import "../styles/phishoff.css";
import { analyzeUrl, type AnalysisSummary } from "../checks/analyzer";
import loadingGif from "url:../assets/LoadingRod.gif";

function AnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [checkPhase, setCheckPhase] = useState<string>("Initializing analysis...");
  const [expandedExplanations, setExpandedExplanations] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get("url");

    if (!targetUrl) {
      setError("No URL provided for analysis");
      setLoading(false);
      return;
    }

    // Display specific check phases with minimum display times to ensure visibility
    const runPhases = async () => {
      try {
        // Phase 1: Database check - minimum display time 1.2 seconds
        setCheckPhase("Checking database for known threats...");
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Phase 2: Local security checks - minimum display time 1.5 seconds
        setCheckPhase("Running non-network security checks...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Phase 3: API checks - minimum display time 1 second
        setCheckPhase("Performing API security checks...");
        // Actually perform the analysis during the last phase
        const results = await analyzeUrl(targetUrl, false);

        // Ensure API check message is shown for at least 1 second even if API is fast
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set results but stay in loading state for a moment
        setAnalysis(results);
        setCheckPhase("Analysis complete! Preparing report...");
        await new Promise(resolve => setTimeout(resolve, 800));

        // Set animation complete after a delay to allow animation to play
        setTimeout(() => setAnimationComplete(true), 1000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runPhases();
  }, []);

  const toggleExplanation = (checkName: string) => {
    setExpandedExplanations(prev => ({
      ...prev, 
      [checkName]: !prev[checkName]
    }));
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "safe": return "text-green-600";
      case "malicious": return "text-red-600";
      default: return "text-yellow-600";
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "safe":
        return (
          <svg
            style={{ width: "1.25rem", height: "1.25rem" }}
            className="text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case "malicious":
        return (
          <svg
            style={{ width: "1.25rem", height: "1.25rem" }}
            className="text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg
            style={{ width: "1.25rem", height: "1.25rem" }}
            className="text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#0d8a45";
    if (score >= 40) return "#e5a50a";
    return "#e54d42";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Very Safe";
    if (score >= 70) return "Safe";
    if (score >= 50) return "Caution";
    if (score >= 30) return "Suspicious";
    return "Unsafe";
  };

  const renderCircularProgress = (score: number) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const fillPercent = score / 100;
    const dashOffset = circumference * (1 - fillPercent);
    const scoreColor = getScoreColor(score);
    
    return (
      <div className="relative flex items-center justify-center my-8">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="12"
          />
          {/* Progress circle with animation */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.5s ease-in-out",
              strokeDashoffset: animationComplete ? dashOffset : circumference
            }}
          />
        </svg>
        {/* Centered content with improved styling */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Semi-transparent white background circle for better readability */}
          <div className="absolute rounded-full bg-white bg-opacity-60" style={{ width: "130px", height: "130px" }}></div>
          {/* Score percentage with enhanced styling */}
          <div className="flex flex-col items-center justify-center relative z-10">
            <span 
              className="text-7xl font-bold" 
              style={{ 
                color: scoreColor,
                textShadow: "0px 0px 3px rgba(255, 255, 255, 0.7)"
              }}
            >
              {animationComplete ? score : 0}%
            </span>
            <span 
              className="text-gray-800 text-lg font-semibold" 
              style={{ marginTop: "2px" }}
            >
              {getScoreLabel(score)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Group check results by status (safe, malicious, unknown)
  const groupCheckResults = (checks) => {
    const grouped = {
      malicious: checks.filter(check => check.type === "malicious"),
      unknown: checks.filter(check => check.type === "unknown"),
      safe: checks.filter(check => check.type === "safe")
    };

    return grouped;
  };

  // Render a category of check results
  const renderCheckCategory = (checks, title, icon, color, background) => {
    if (checks.length === 0) return null;

    return (
      <div className="mb-4">
        <div
          className="flex items-center px-3 py-2 rounded-t-lg"
          style={{ backgroundColor: background }}
        >
          <span className="mr-2">{icon}</span>
          <h3 className="font-semibold" style={{ color }}>{title} ({checks.length})</h3>
        </div>
        <div className="border border-t-0 rounded-b-lg border-gray-200">
          {checks.map((check, index) => (
            <div
              key={index}
              className="p-3 border-b last:border-b-0 border-gray-200"
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getStatusIcon(check.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{check.name}</h3>
                  <p className={`text-sm ${getStatusColor(check.type)}`}>
                    {check.message}
                  </p>


                  {check.recommendation && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">Recommendation: </span>
                      {check.recommendation}
                    </div>
                  )}

                  {check.detailedExplanation && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleExplanation(check.name)}
                        className="learn-more-btn"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {expandedExplanations[check.name] ? 'Hide Details' : 'Learn More'}
                      </button>
                      
                      {expandedExplanations[check.name] && (
                        <div className="mt-3 bg-blue-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-line text-sm">
                            {check.detailedExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="content-centered" style={{ minHeight: "100vh", alignItems: "flex-start", paddingTop: "2rem" }}>
      <div className="card" style={{ maxWidth: "800px" }}>
        <div className="header">
          <h1 className="title">URL Analysis</h1>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 w-full">
            <div className="text-center">
              <img
                src={loadingGif}
                alt="Loading"
                style={{ width: "120px", height: "120px", objectFit: "contain", margin: "0 auto" }}
              />

              <h2 className="heading mt-6 mb-2">Analyzing URL Safety</h2>

              <div className="check-phase">
                <span>{checkPhase}</span>
                <div className="phase-dots mt-2">
                  <span className="phase-dot"></span>
                  <span className="phase-dot"></span>
                  <span className="phase-dot"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="details" style={{ backgroundColor: "#feebe6", marginBottom: "1rem" }}>
            <p style={{ color: "#e54d42" }}>Error: {error}</p>
          </div>
        )}

        {analysis && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">URL</h2>
              <p className="text-gray-700 break-all">{analysis.url}</p>
            </div>

            {/* Circular Progress */}
            <div className="mb-6 text-center">
              <h1 className="text-gray-700">{renderCircularProgress(analysis.score)}</h1>
            </div>

            {/* Summary */}
            <div className="mb-6 text-center">
              <p className="text-gray-700">{analysis.message}</p>
              <p className="mt-2">
                <span className="font-semibold">{analysis.passed}</span> out of
                <span className="font-semibold"> {analysis.total}</span> checks passed
              </p>
              {analysis.score < 70 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
                  <p className="font-medium text-yellow-800">Security Concerns Detected</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This URL has some security issues that may put your information at risk.
                    Review the detailed analysis below for specific concerns.
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Details Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-secondary"
                style={{ backgroundColor: "#3c6cf0", color: "#fff" }}
              >
                {showDetails ? "Hide Test Results" : "View Test Results"}
              </button>
            </div>

            {/* Details Section - Collapsible */}
            <div
              className="test-results-container"
              style={{
                // Use a bigger maxHeight so content doesn't get cut off
                maxHeight: showDetails ? "9999px" : "0",
                opacity: showDetails ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
                marginBottom: showDetails ? "1.5rem" : 0
              }}
            >
              {/* Group all checks and display by status */}
              {(() => {
                // Combine all checks for grouping
                const allResults = [
                  ...analysis.details.fastChecks,
                  ...analysis.details.deepChecks
                ];

                const grouped = groupCheckResults(allResults);

                return (
                  <>
                    {renderCheckCategory(
                      grouped.malicious,
                      "Security Issues",
                      <svg style={{ width: "1.5rem", height: "1.5rem" }} className="text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>,
                      "#e54d42",
                      "#feebe6"
                    )}

                    {renderCheckCategory(
                      grouped.unknown,
                      "Inconclusive Results",
                      <svg style={{ width: "1.5rem", height: "1.5rem" }} className="text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>,
                      "#e5a50a",
                      "#fef9e6"
                    )}

                    {renderCheckCategory(
                      grouped.safe,
                      "Passed Checks",
                      <svg style={{ width: "1.5rem", height: "1.5rem" }} className="text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>,
                      "#0d8a45",
                      "#e6f4eb"
                    )}
                  </>
                );
              })()}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
