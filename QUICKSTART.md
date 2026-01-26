# Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API Key

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./stocks.db
HOST=0.0.0.0
PORT=8000
EOF

# Initialize database with sample data
python init_db.py

# Start the server
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing the Application

1. Open `http://localhost:5173` in your browser
2. Try these example queries:
   - "Show me stocks with price above $100"
   - "Find tech stocks with market cap greater than 1 billion"
   - "Get stocks where volume is above 1 million and price is between $50 and $200"
   - "Show me all technology sector stocks ordered by price descending"

## Troubleshooting

### Backend Issues

- **OpenAI API Error**: Make sure your API key is set correctly in `.env`
- **Database Error**: Run `python init_db.py` again to reinitialize
- **Port Already in Use**: Change the port in `.env` or stop the process using port 8000

### Frontend Issues

- **Cannot connect to backend**: Make sure backend is running on port 8000
- **CORS errors**: Check that backend CORS settings include `http://localhost:5173`

## Next Steps

- Customize the database schema in `backend/app/models.py`
- Add more sample data in `backend/app/database.py`
- Enhance the LLM prompts in `backend/app/services/llm_parser.py`
- Customize the UI in `frontend/src/`
