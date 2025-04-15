# PhishOFF

PhishOFF is a multi-component project designed to detect and prevent phishing attacks. It consists of the following components:

1. **FastAPI Backend**: A Python-based backend for handling phishing detection logic.
2. **Express API**: A Express API for managing URL safety statuses, backed by MongoDB and Redis.
3. **Plasmo Extension**: A browser extension for detecting phishing attempts in real-time.

## Project Structure

The project is organized into three main directories, each corresponding to one of the components:

- `backend`: Contains the FastAPI backend code.
- `api-mongodb`: Contains the Express API code.
- `extension`: Contains the Plasmo extension code.

The extra directories are:

- `.github/workflows`: Contains GitHub Actions workflows for CI/CD.
- `machinelearning`: Contains files for training, fine-tuning, and running machine learning models for phishing detection.

## Setup Instructions

Each project folder contains its own `README.md` with detailed setup and run instructions. Follow the steps in each folder to set up and run the respective components.

### General Notes

- Ensure all `.env` files are properly configured before running any component.
- **Environment Variable Configuration**:
  - The Plasmo extension's `API_URL` should point to the Express API running from the `api-mongodb` folder (e.g., `http://localhost:3000`).
  - The Express API's `MONGODB_URI` and `REDIS_URL` should be set to valid MongoDB and Redis instances.
  - The FastAPI backend should have its `.env` file configured as per its requirements.

### Component-Specific Instructions

1. **FastAPI Backend**:

   - Located in the `backend/` folder.
   - Follow the instructions in `backend/README.md` to set up and run the backend.

2. **Express API**:

   - Located in the `api-mongodb/` folder.
   - Follow the instructions in `api-mongodb/README.md` to set up and run the API.

3. **Plasmo Extension**:
   - Located in the `extension/` folder.
   - Follow the instructions in `extension/README.md` to set up and run the browser extension.

## Running the Full System

1. Start the **Express API** from the `api-mongodb/` folder.
2. Start the **FastAPI Backend** from the `backend/` folder.
3. Start the **Plasmo Extension** from the `extension/` folder.
4. Open your browser and load the Plasmo extension.

With all components running, you can test the system end-to-end.
