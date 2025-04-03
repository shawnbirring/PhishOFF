// __tests__/IndexPopup.test.tsx
import { render, screen } from "@testing-library/react";
import IndexPopup from "../popup";
import React from "react";

describe("IndexPopup Component", () => {
  test("renders without crashing", () => {
    render(<IndexPopup />);
    expect(screen.getByText(/some text in your component/i)).toBeInTheDocument();
  });

  test("checks for phishing detection", async () => {
    const fakeEmail = {
      headers: [
        { name: "Subject", value: "Test Email" },
        { name: "From", value: "test@example.com" },
        { name: "To", value: "user@example.com" },
        { name: "Date", value: "Sun, 31 Mar 2024 12:00:00 GMT" },
      ],
      body: { data: "fakeBase64Data" },
    };

    // Call your function (replace with actual function name)
    const result = await checkForPhishingInEmail(fakeEmail as any); // Ensure correct type

    expect(result).toBe(false); // Adjust expected result based on your logic
  });

  test("validates URLs correctly", () => {
    const validUrl = "https://example.com";
    const invalidUrl = "invalid-url";

    expect(isValidUrl(validUrl)).toBe(true);
    expect(isValidUrl(invalidUrl)).toBe(false);
  });
});
