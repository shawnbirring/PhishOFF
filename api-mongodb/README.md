# PhishOFF URL API

A simple Express API for checking and managing URL safety statuses, built for a phishing Chrome extension. Uses Redis for caching and MongoDB for storage.

## Endpoints

### GET `/status`

- **Usage**: Check if the server is running.
- **Response**: `{"status": "ok"}`

### POST `/check-url`

- **Usage**: Check a URL’s safety status.
- **Request**: `{"url": "https://example.com"}`
- **Response**: `{"status": "malicious"}` or `{"status": "unknown"}` or `{"status": "safe"}`

### POST `/add-url`

- **Usage**: Add or update a URL’s status.
- **Request**: `{"url": "https://example.com", "status": "malicious"}`
- **Response**: `{"status": "malicious"}`
- **Note**: `status` must be `safe`, `malicious`, or `unknown`.

### GET `/urls`

- **Usage**: List all stored URLs.
- **Response**: `[{"url": "https://example.com", "status": "malicious", "lastChecked": "..."}]`

## Running Locally

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Set Up Environment File**:
   Create a `.env` file with the following variables:

   ```
   REDIS_URL=
   MONGODB_URI=
   ```

3. **Run the API**:
   ```bash
   bun run start
   ```
   - Server runs at `http://localhost:3000`.
