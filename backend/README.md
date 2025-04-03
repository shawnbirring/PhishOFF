# PhishOFF FastAPI Backend

## Requirements
- Python 3.10+
- FastAPI
- Uvicorn

## Setup and Run Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd backend
```

### 2. Set Up a Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\activate  # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
pip3 install -r requirements.txt # macOS/Linux
```

### 4. Run the API
```bash
uvicorn main:app --reload
```
