import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IndexPopup from "../popup"; // Adjust path as needed
import "@testing-library/jest-dom";

// Mocking fetch API for testing
global.fetch = jest.fn();

// Mocking chrome API
global.chrome = {
    identity: {
        getAuthToken: jest.fn((options, callback) => callback("mock-token")),
    },
    runtime: {
        lastError: null,
    },
    tabs: {
        query: jest.fn(),
    },
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
};

describe("IndexPopup Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
    });

    it("checks if email content is extracted correctly", async () => {
        // Mock API calls
        global.fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                messages: [{ id: "12345" }],
            }),
        });

        global.fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                payload: {
                    headers: [
                        { name: "Subject", value: "Urgent: Reset Your Password" },
                        { name: "From", value: "scammer@phishing.com" },
                        { name: "To", value: "victim@example.com" },
                        { name: "Date", value: "Wed, 03 Apr 2024 12:30:00 GMT" },
                    ],
                    body: { data: btoa("This is a sample email body with a phishing link: http://malicious.com") },
                },
            }),
        });

        render(<IndexPopup />);

        fireEvent.click(screen.getByText("Latest Email"));
        fireEvent.click(screen.getByText("Show Content"));

        await waitFor(() => {
            expect(screen.getByText("This is a sample email body with a phishing link: http://malicious.com")).toBeInTheDocument();
        });
    });

    it("renders the main popup content", async () => {
        render(<IndexPopup />);

        await waitFor(() => {
            expect(screen.getByText("PhishingOff")).toBeInTheDocument();
            expect(screen.getByText("Email Content:")).toBeInTheDocument();
            expect(screen.getByText("Current Website:")).toBeInTheDocument();
        });
    });

    it("handles phishing detection for valid URLs", async () => {
        render(<IndexPopup />);

        fireEvent.change(screen.getByPlaceholderText("Enter a URL"), { target: { value: "http://malicious.com" } });
        fireEvent.click(screen.getByText("Check URL"));

        await waitFor(() => {
            expect(screen.getByText("Warning: This URL is potentially malicious!")).toBeInTheDocument();
        });
    });
});

