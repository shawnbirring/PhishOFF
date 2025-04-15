/**
 * checking.tsx - Checking page UI for PhishOFF extension
 * 
 * This component displays the URL safety checking process to the user,
 * shows real-time updates during scanning, and provides appropriate
 * actions based on the safety verdict (safe, unsafe, or unknown).
 */

import { useState, useEffect, useRef } from "react"
import type { ScanResult } from "../background/website_check"
import "../styles/phishoff.css"
import loadingGif from "url:../assets/LoadingRod.gif"

/**
 * CheckingPage component
 * Handles the display of the URL checking process, results, and user actions
 */
const CheckingPage = () => {
  const [url, setUrl] = useState<string>("")
  const [status, setStatus] = useState<"checking" | "safe" | "unsafe">("checking")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [checkPhase, setCheckPhase] = useState<string>("Initializing...")
  const listenerInitialized = useRef(false)
  const originalUrlRef = useRef<string>("")
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const targetUrl = urlParams.get("url")
    
    if (targetUrl) {
      setUrl(targetUrl)
      originalUrlRef.current = targetUrl
      
      chrome.runtime.sendMessage({
        action: "checkingPageReady",
        url: targetUrl,
        tabId: window.sessionStorage.getItem("tabId") || undefined
      });
    }
    
    if (!listenerInitialized.current) {
      listenerInitialized.current = true;
      
      chrome.runtime.onMessage.addListener((message) => {
        console.log("[PhishOFF] Checking page received message:", message);
        
        // Handle check phase updates
        if (message.action === "checkPhaseUpdate") {
          setCheckPhase(message.phase);
          return;
        }
        
        if (message.action === "checkResult") {
          setResult(message.result)
          setStatus(message.result.isSafe ? "safe" : "unsafe")
          
          if (message.originalUrl) {
            originalUrlRef.current = message.originalUrl;
          }
          
          // Auto-redirect if site is safe
          if (message.result.isSafe) {
            console.log("[PhishOFF] Site is safe, redirecting in 1.5s to:", message.originalUrl);
            setTimeout(() => {
              const redirectUrl = message.originalUrl || originalUrlRef.current;
              console.log("[PhishOFF] Redirecting now to:", redirectUrl);
              window.location.href = redirectUrl;
            }, 1500)
          }
        }
      });
    }
    
    chrome.runtime.sendMessage({action: "getTabId"}, (tabId) => {
      if (tabId) {
        window.sessionStorage.setItem("tabId", tabId.toString());
      }
    });
    
    return () => {
    }
  }, [])
  
  const handleViewDetailedAnalysis = (url: string) => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/analysis.html") + "?url=" + encodeURIComponent(url)
    });
  };
  
  // Handle user choosing to proceed to unsafe site
  const handleProceedAnyway = () => {
    chrome.runtime.sendMessage({
      action: "proceedToSite",
      url: originalUrlRef.current || url
    })
  }
  
  return (
    <div className="content-centered">
      <div className="card">
        <div className="header">
          <h1 className="title">PhishOFF</h1>
        </div>
        
        {status === "checking" && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="status-icon checking">
                <img 
                  src={loadingGif}
                  alt="Loading" 
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            </div>
            
            <h2 className="heading mb-3">Checking Website Safety...</h2>
            
            <div className="url-display mb-4">
              <span>{url}</span>
            </div>
            
            <div className="check-phase">
              <span>{checkPhase}</span>
              <div className="phase-dots mt-2">
                <span className="phase-dot"></span>
                <span className="phase-dot"></span>
                <span className="phase-dot"></span>
              </div>
            </div>
          </div>
        )}
        
        {status === "safe" && (
          <div>
            <div className="status-icon safe">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0d8a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className="heading">Website Appears Safe</h2>
            <div className="url-display mb-4">
              <span>{originalUrlRef.current || url}</span>
            </div>
            <p className="message">
              {result?.message || "Our scan found no security threats with this website."}
            </p>
            <div className="mt-6 animate-pulse">
              <p className="message">
                Redirecting you to the website...
              </p>
            </div>
          </div>
        )}
        
        {status === "unsafe" && (
          <div>
            <div className="status-icon unsafe">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e54d42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 className="heading">Warning: Potentially Unsafe Website</h2>
            <div className="url-display mb-4">
              <span>{originalUrlRef.current || url}</span>
            </div>
            <p className="message">
              {result?.message || "This website may pose a security risk to your device or personal information."}
            </p>
            
            {result?.details && (
              <div className="details">
                <p className="details-title">Detection Details:</p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-dot dot-red"></span>
                    <span>Malicious: <strong>{result.details.malicious}</strong></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-dot dot-yellow"></span>
                    <span>Suspicious: <strong>{result.details.suspicious}</strong></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-dot dot-green"></span>
                    <span>Harmless: <strong>{result.details.harmless}</strong></span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-dot dot-gray"></span>
                    <span>Undetected: <strong>{result.details.undetected}</strong></span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button 
                onClick={() => window.close()}
                className="btn btn-primary mb-2"
              >
                Go Back to Safety
              </button>
              <div className="mt-2">
                <button 
                  onClick={handleProceedAnyway}
                  className="btn btn-danger"
                >
                  Proceed anyway (not recommended)
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleViewDetailedAnalysis(originalUrlRef.current || url)}
                  style={{ backgroundColor: '#3c6cf0', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '0.5rem' }}
                >
                  View Detailed Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckingPage