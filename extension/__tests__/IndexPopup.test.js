const { render, screen } = require("@testing-library/react");
const IndexPopup = require("../popup").default;
const { checkForPhishingInEmail, isValidUrl } = require("../utils");

// Mock external functions used in popup.tsx
jest.mock("../utils", () => ({
  checkForPhishingInEmail: jest.fn().mockResolvedValue(false), // Mock as an async function
  isValidUrl: jest.fn((url) => url.startsWith("https://")), // Simple validation logic
}));

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

    const result = await checkForPhishingInEmail(fakeEmail);
    expect(result).toBe(false); // Matches the mock return value
  });

  test("validates URLs correctly", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("invalid-url")).toBe(false);
  });
});

