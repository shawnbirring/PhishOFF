import { useState, useEffect } from "react"
import type { ScanResult } from "../background/website_check"

const CheckingPage = () => {
  const [url, setUrl] = useState<string>("")
  const [status, setStatus] = useState<"checking" | "safe" | "unsafe">("checking")
  const [result, setResult] = useState<ScanResult | null>(null)
  
  useEffect(() => {
    // Get URL from query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const targetUrl = urlParams.get("url")
    
    if (targetUrl) {
      setUrl(targetUrl)
    }
    
    // Listen for check results from background
    const messageListener = (message: any) => {
      if (message.action === "checkResult") {
        setResult(message.result)
        setStatus(message.result.isSafe ? "safe" : "unsafe")
        
        // Auto-redirect if site is safe
        if (message.result.isSafe) {
          setTimeout(() => {
            window.location.href = message.originalUrl
          }, 1500) // Brief delay so user sees it's safe
        }
      }
    }
    
    chrome.runtime.onMessage.addListener(messageListener)
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])
  
  // Handle user choosing to proceed to unsafe site
  const handleProceedAnyway = () => {
    chrome.runtime.sendMessage({
      action: "proceedToSite",
      url
    })
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <div className="flex items-center mb-6">
          <img src="../assets/icon.png" alt="PhishOFF Logo" className="h-10 w-10 mr-3" />
          <h1 className="text-2xl font-bold text-blue-600">PhishOFF</h1>
        </div>
        
        {status === "checking" && (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">Checking Website Safety...</h2>
            <p className="text-gray-600 text-center">
              We're checking if <span className="font-medium text-gray-800">{url}</span> is safe to visit.
            </p>
          </>
        )}
        
        {status === "safe" && (
          <>
            <div className="flex items-center justify-center mb-6 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-green-600 mb-4">Website Appears Safe</h2>
            <p className="text-gray-600 text-center mb-4">
              {result?.message}
            </p>
            <p className="text-gray-500 text-center text-sm">
              Redirecting you to the website...
            </p>
          </>
        )}
        
        {status === "unsafe" && (
          <>
            <div className="flex items-center justify-center mb-6 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-red-600 mb-4">Warning: Potentially Unsafe Website</h2>
            <p className="text-gray-700 text-center mb-6">
              {result?.message}
            </p>
            {result?.details && (
              <div className="bg-gray-50 p-3 rounded-lg mb-6 text-sm">
                <p className="font-medium mb-2">Detection Details:</p>
                <ul className="space-y-1">
                  <li className="text-red-600">Malicious: {result.details.malicious}</li>
                  <li className="text-yellow-600">Suspicious: {result.details.suspicious}</li>
                  <li className="text-green-600">Harmless: {result.details.harmless}</li>
                  <li className="text-gray-500">Undetected: {result.details.undetected}</li>
                </ul>
              </div>
            )}
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleProceedAnyway}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Proceed Anyway (Not Recommended)
              </button>
              <button 
                onClick={() => window.close()}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Go Back to Safety
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CheckingPage