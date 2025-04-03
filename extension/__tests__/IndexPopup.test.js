import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IndexPopup from "./popup";

describe("IndexPopup Component", () => {
    test("renders the component correctly", () => {
        render(<IndexPopup />);
        expect(screen.getByText("PhishingOff")).toBeInTheDocument();
    });

    test("displays the consent modal initially", () => {
        render(<IndexPopup />);
        expect(screen.getByText("Consent")) // Assuming ConsentModal has a title with "Consent"
            .toBeInTheDocument();
    });

    test("fetch email button exists and functions", async () => {
        render(<IndexPopup />);
        const fetchButton = screen.getByText("Latest Email");
        expect(fetchButton).toBeInTheDocument();
        fireEvent.click(fetchButton);
        // This test won't verify API calls but ensures the button is clickable
    });

    test("Check phishing button exists", () => {
        render(<IndexPopup />);
        const phishingButton = screen.getByText("Check for Phishing");
        expect(phishingButton).toBeInTheDocument();
    });

    test("URL input and check button exist", () => {
        render(<IndexPopup />);
        const inputField = screen.getByPlaceholderText("Enter a URL");
        const checkButton = screen.getByText("Check URL");
        expect(inputField).toBeInTheDocument();
        expect(checkButton).toBeInTheDocument();
    });

    test("Typing a URL updates state", () => {
        render(<IndexPopup />);
        const inputField = screen.getByPlaceholderText("Enter a URL");
        fireEvent.change(inputField, { target: { value: "https://test.com" } });
        expect(inputField.value).toBe("https://test.com");
    });
});
