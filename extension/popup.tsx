import React from "react";
import { useState, useEffect } from "react";
import ConsentModal from 'ConsentModal';
function IndexPopup() {
    const [emailContent, setEmailContent] = useState("Click the button to load email");
    const [emailSender, setEmailSender] = useState("Unknown");
    const [emailReceiver, setEmailReceiver] = useState("Unknown");
    const [emailReceivedTime, setEmailReceivedTime] = useState("Unknown");
    const [urlToCheck, setUrlToCheck] = useState("");
    const [urlStatus, setUrlStatus] = useState("");
    const [emailPhishingStatus, setEmailPhishingStatus] = useState("");
    const [currentWebsiteStatus, setCurrentWebsiteStatus] = useState("");
    const [currentUrl, setCurrentUrl] = useState("");
    const [showEmailContent, setShowEmailContent] = useState(false);
    const [showUrl, setShowUrl] = useState(false);
    const [emailSubject, setEmailSubject] = useState("No subject found");
    const [emailPhishingUrls, setEmailPhishingUrls] = useState([]);
    const maliciousDomains = ["phishing.com", "malicious.com", "fakewebsite.com"];
    const [userConsented, setUserConsented] = useState(false);

    const handleUserConsent = () => {
        localStorage.setItem('userConsent', 'true');
        setUserConsented(true);
        checkCurrentWebsite();
    };

    const handleUserConsentRevocation = () => {
        localStorage.removeItem('userConsent');
        setUserConsented(false);
    };
    
   
    const fetchEmails = async () => {
        try {
            if (typeof chrome !== "undefined" && chrome.identity?.getAuthToken) {
                const token = await new Promise((resolve, reject) => {
                    chrome.identity.getAuthToken({ interactive: true, scopes: ['https://www.googleapis.com/auth/gmail.readonly'] }, (token) => {
                        if (chrome.runtime.lastError) reject(new Error("Authentication failed"));
                        else if (token) resolve(token);
                        else reject(new Error("No token returned"));
                    });
                });

                const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();

                if (data.messages?.length > 0) {
                    const messageId = data.messages[0].id;
                    const messageResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const messageData = await messageResponse.json();
                    const headers = messageData.payload.headers;
                    const emailSubject = headers.find((h) => h.name === "Subject")?.value || "No subject found";
                    setEmailSubject(emailSubject);
                    setEmailSender(headers.find((h) => h.name === "From")?.value || "Unknown");
                    setEmailReceiver(headers.find((h) => h.name === "To")?.value || "Unknown");
                    setEmailReceivedTime(headers.find((h) => h.name === "Date")?.value || "Unknown");

                    const emailBody = extractEmailBody(messageData.payload);
                    if (emailBody) {
                        setEmailContent(emailBody); // Show decoded email body
                    } else {
                        setEmailContent("No email body found.");
                    }
                } else {
                    setEmailContent("No emails found.");
                }
            } else {
                setEmailContent("Chrome identity API not available.");
            }
        } catch (error) {
            setEmailContent("Failed to fetch email.");
            console.error("Error fetching emails:", error);
        }
    };

    const extractEmailBody = (payload) => {
        // Check if the email body is directly available in the body.data (plain-text)
        if (payload.body?.data) {
            return decodeBase64Url(payload.body.data);
        }

        // Check if the email body is available within parts (for multipart emails)
        if (payload.parts) {
            for (const part of payload.parts) {
                // Look for body data within each part
                if (part.body?.data) {
                    return decodeBase64Url(part.body.data);
                }
            }
        }

        return null; // If no body is found
    };

    // Function to decode base64url to a normal string
    const decodeBase64Url = (base64Url) => {
        // Fix base64url (replace `-` with `+` and `_` with `/`)
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

        // Add padding if necessary
        while (base64.length % 4) {
            base64 += "=";
        }

        // Decode and return the result
        return atob(base64);
    };

    useEffect(() => {
        // Directly show the consent modal for testing (can be removed in production)
        setUserConsented(false);  // Forcing it to show the consent modal
    }, []);

   

    // Check email content for phishing (URL using safebrowsing API)
    const checkForPhishing = async (urls) => {
        const apiKey = await getApiKey();  // Fetch the API Key securely
        let phishingFound = false;


        // Check against malicious domains list
        phishingFound = urls.some(url => maliciousDomains.some(domain => url.includes(domain)));

        // Check URLs with Google Safe Browsing API if not found locally
        if (!phishingFound && urls.length > 0 && apiKey) {
            const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
            const requestBody = {
                client: {
                    clientId: "your-client-id",
                    clientVersion: "1.0"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: urls.map(url => ({ url }))
                }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                });
                const data = await response.json();
                if (data.matches && data.matches.length > 0) {
                    phishingFound = true;
                }
            } catch (error) {
                console.error("Safe Browsing API error:", error);
            }
        }

        return phishingFound;
    };

    const getApiKey = () => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(["GOOGLE_SAFE_BROWSING_API_KEY"], (result) => {
                if (result.GOOGLE_SAFE_BROWSING_API_KEY) {
                    resolve(result.GOOGLE_SAFE_BROWSING_API_KEY);
                } else {
                    reject("API Key not found!");
                }
            });
        });
    };

   

    // Check email content for phishing (new API for overall content)
    const checkEmailForPhishingContent = async (email) => {
        // Assuming you have an API to check the email content
        const apiUrl = "https://maximillianyong.duckdns.org/api/v1/checkcontents?api-key=480be386-87f4-4e1b-bec7-f6d91034c387"; // Replace with your API URL

        const requestBody = {
            email_contents: email
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            console.log("Response data:", data);

            if (data.response === "Phishing") {
               
                return true;
            }
        } catch (error) {
            console.error("Error checking email content for phishing:", error);
        }

        return false;
    };

    // Check email content for phishing
    const checkForPhishingInEmail = async (email) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = email.match(urlRegex) || [];
        const phishingUrlsFound = await checkForPhishing(urls);
        const phishingContentFound = await checkEmailForPhishingContent(email);

        if (phishingUrlsFound || phishingContentFound) {
            setEmailPhishingStatus("Phishing detected in the email!");
            setEmailPhishingUrls(urls); // Store the phishing URLs found
        } else {
            setEmailPhishingStatus("No phishing detected in the email.");
            setEmailPhishingUrls([]); // Clear the phishing URLs list if not detected
        }
    };

    //checking the input URL 
    const checkUrlPhishing = () => {
        const phishingFound = maliciousDomains.some(domain => urlToCheck.includes(domain));
        const statusMessage = phishingFound ? "Warning: This URL is potentially malicious!" : "This URL seems safe.";
        setUrlStatus(statusMessage);
    };

    const handleUrlChange = (e) => {
        const newUrl = e.target.value.trim(); // Remove leading/trailing spaces
        setUrlToCheck(newUrl);

        if (!newUrl) {
            setUrlStatus("URL cannot be empty.");
        } else if (!isValidUrl(newUrl)) {
            setUrlStatus("Invalid URL format. Please enter a full valid URL.");
        } else {
            setUrlStatus(""); // Clear error if valid
        }
    };


    // Function to validate URL format
    const isValidUrl = (url) => {
        const urlPattern = /^(https?:\/\/)([\w-]+(\.[\w-]+)+)(\/[\w-./?%&=]*)?$/;
        return urlPattern.test(url);
    };

    // Function to check curernt website if phishing
    const checkCurrentWebsite = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = tabs[0]?.url || "";
            setCurrentUrl(currentUrl);

            const phishingFound = maliciousDomains.some(domain => currentUrl.includes(domain));
            setCurrentWebsiteStatus(phishingFound
                ? "Warning: You are on a potentially malicious website!"
                : "This website seems safe.");
        });
    };

    //Automatically execute the checkCurrentWebsite function
    useEffect(() => {
        checkCurrentWebsite();
    }, []);

    // Ensure consistent hook call order by keeping hooks at the top level
    if (!userConsented) {
        return (
            <ConsentModal
                onConsent={handleUserConsent}
                onDecline={handleUserConsentRevocation}
            />
        );
    }

    return (
        <div style={{
            padding: 16, backgroundColor: "#c3dbe7",
        }}>
            <div style={{ color: "#224d84", textAlign: "left", fontSize: "20px", fontWeight: "bold", }}>
                PhishingOff
            </div>
            <div style={{ display: "flex", gap: 16 }}>
                <div style={{ color: "#224d84", borderRight: "2px solid #ccc", paddingRight: 16, width: "300px", overflow: "auto" }}>
                    <h2>Email Content:</h2>
                    <button onClick={fetchEmails}>Latest Email</button>
                    <button onClick={() => checkForPhishingInEmail(emailContent)}>Check for Phishing</button>
                    <div style={{ fontSize: "25px", color: emailPhishingStatus.includes("Phishing detected") ? "red" : "green", fontWeight: "bold" }}>
                        {emailPhishingStatus}
                    </div>
                    {emailPhishingUrls.length > 0 && (
                        <div>
                            <strong>Phishing URLs found:</strong>
                            <ul>
                                {emailPhishingUrls.map((url, index) => (
                                    <li key={index} style={{ color: "red" }}>{url}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                        <p><strong>Subject:</strong> {emailSubject}</p>
                        <p><strong>From:</strong> {emailSender}</p>
                        <p><strong>To:</strong> {emailReceiver}</p>
                        <p><strong>Received:</strong> {emailReceivedTime}</p>
                    </div>
                    <div style={{
                        maxHeight: "50px", // Folded height and unfold height
                        transition: "max-height 0.3s ease", // Smooth transition when unfolding
                        whiteSpace: "pre-wrap" // To preserve line breaks in the content
                    }}>
                        <button onClick={() => setShowEmailContent(prev => !prev)}>
                            {showEmailContent ? "Hide Content" : "Show Content"}
                        </button>
                        {showEmailContent && <pre>{emailContent}</pre>}
                    </div>

                </div>
                <div style={{ color: "#224d84", paddingLeft: 16, paddingRight: 22, width: "200px", overflow: "auto" }}>
                    <h2>Current Website:</h2>
                    <p><strong>URL:</strong> {currentUrl}</p>
                    <h3 style={{ color: currentWebsiteStatus.includes("malicious") ? "red" : "green", fontWeight: "bold" }}>
                        {currentWebsiteStatus}
                    </h3>
                    <h3>Check a URL for Phishing:</h3>
                    <input type="text" placeholder="Enter a URL" value={urlToCheck} onChange={handleUrlChange} />
                    <button onClick={checkUrlPhishing}>Check URL</button>
                  
                    <h3 style={{ color: urlStatus.includes("Invalid") ? "red" : urlStatus.includes("malicious") ? "red" : "green", fontWeight: "bold" }}>
                        {urlStatus}
                    </h3>
                </div>
            </div>
        </div>
    );
}

export default IndexPopup;
