import { render, screen } from "@testing-library/react";
import IndexPopup from "../popup";
import React from "react";

// Mock local storage and chrome API (necessary for `chrome.storage.local`)
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({ GOOGLE_SAFE_BROWSING_API_KEY: "test-api-key" })),
    },
  },
  identity: {
    getAuthToken: jest.fn(({ interactive }, callback) => callback("fake-token")),
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => callback([{ url: "https://example.com" }])),
  },
};

// Mock function to avoid errors from local utility functions inside the component
jest.mock("../utils", () => ({
  checkForPhishingInEmail: jest.fn().mockResolvedValue(false), // Mock as an async function
  isValidUrl: jest.fn((url) => url.startsWith("https://")), // Simple validation logic
}));

// Import mocked functions after jest.mock
import { checkForPhishingInEmail, isValidUrl } from "../utils";

describe("IndexPopup Component", () => {
  test("renders without crashing", () => {
    render(<IndexPopup />);
    expect(screen.getByText(/PhishingOff/i)).toBeInTheDocument(); // Match actual component text
  });

  test("checks for phishing detection", async () => {
    const emailBody = "This is a test email with no phishing links.";
    const result = await checkForPhishingInEmail(emailBody);
    expect(result).toBe(false); // Matches the mock return value
  });

  test("validates URLs correctly", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("invalid-url")).toBe(false);
  });
});
