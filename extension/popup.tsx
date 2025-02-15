import { useState } from "react";

function IndexPopup() {
  const [emailContent, setEmailContent] = useState("Click the button to load email");

  const fetchEmails = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.identity?.getAuthToken) {
        const token = await new Promise<string>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
              console.error("Auth error:", chrome.runtime.lastError.message);
              reject(new Error("Authentication failed"));
            } else if (token) {
              console.log("Auth token:", token);
              resolve(token);
            } else {
              reject(new Error("No token returned"));
            }
          });
        });

        const response = await fetch(
          "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=1",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        if (data.messages?.length > 0) {
          const messageId = data.messages[0].id;
          const messageResponse = await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const messageData = await messageResponse.json();
          console.log("Full Email Data:", messageData);

          // Extract email content dynamically
          const emailBody = extractEmailBody(messageData.payload);

          if (emailBody) {
            const decodedEmail = atob(emailBody.replace(/-/g, "+").replace(/_/g, "/"));
            console.log("Decoded Email Content:", decodedEmail);
            setEmailContent(decodedEmail);
          } else {
            console.log("No email body found.");
            setEmailContent("No email body found.");
          }
        } else {
          console.log("No emails found.");
          setEmailContent("No emails found.");
        }
      } else {
        console.error("chrome.identity API is not available.");
        setEmailContent("Chrome identity API not available.");
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      setEmailContent("Failed to fetch email.");
    }
  };

  // Extract email body from various structures
  const extractEmailBody = (payload: any): string | null => {
    console.log("Checking payload:", payload);

    if (payload.body?.data) return payload.body.data;

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) return part.body.data;
        if (part.mimeType === "text/html" && part.body?.data) return part.body.data;

        if (part.parts) {
          for (const subPart of part.parts) {
            if (subPart.body?.data) return subPart.body.data;
          }
        }
      }
    }

    console.warn("No email body found in payload");
    return null;
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Email Content:</h2>
      <button onClick={fetchEmails}>Fetch Latest Email</button>
      <pre>{emailContent}</pre>
    </div>
  );
}

export default IndexPopup;
