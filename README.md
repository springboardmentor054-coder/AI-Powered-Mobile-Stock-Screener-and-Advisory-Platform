# AI Stock Retrieval Application

A full-stack AI application that converts natural language queries about stocks into SQL queries and retrieves data from a database.

## Architecture

1. **LLM Parser**: Parses natural language queries and returns structured JSON
2. **Screener**: Converts JSON output to functional SQL queries
3. **Runner**: Executes SQL queries against the database and returns results

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm_parser.py    # Natural Language to JSON
│   │   │   ├── screener.py      # JSON to SQL converter
│   │   │   └── runner.py        # SQL executor
│   │   └── database.py          # Database connection
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── QueryInput.jsx
│   │   │   ├── ResultsTable.jsx
│   │   │   └── SQLDisplay.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── vite.config.js
└── README.md

```

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

5. Initialize database:
```bash
python init_db.py
```

6. Run the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Usage

1. Start the backend server (runs on http://localhost:8000)
2. Start the frontend server (runs on http://localhost:5173)
3. Enter a natural language query like:
   - "Show me stocks with price above $100"
   - "Find tech stocks with market cap greater than 1 billion"
   - "Get stocks where volume is above 1 million and price is between $50 and $200"

## API Endpoints

- `POST /api/query` - Process natural language query
- `GET /api/health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## How It Works

1. **User Input**: User enters a natural language query in the frontend
2. **LLM Parser**: The query is sent to OpenAI GPT model which parses it into structured JSON with filters, operators, and values
3. **Screener**: The JSON is converted to a SQL query matching the database schema
4. **Runner**: The SQL query is executed against the SQLite database
5. **Results**: The results are returned to the frontend and displayed in a table

## Database Schema

The `stocks` table contains the following fields:
- `id`: Primary key
- `symbol`: Stock ticker symbol (e.g., "AAPL")
- `company_name`: Company name
- `sector`: Business sector (e.g., "Technology")
- `industry`: Industry type
- `price`: Stock price
- `market_cap`: Market capitalization
- `volume`: Trading volume
- `pe_ratio`: Price-to-earnings ratio
- `dividend_yield`: Dividend yield percentage
- `created_at`: Timestamp

## Supported Query Operators

- `eq`: equals
- `gt`: greater than
- `gte`: greater than or equal
- `lt`: less than
- `lte`: less than or equal
- `between`: value is between two numbers
- `like`: contains text (for strings)
- `in`: value is in a list

## Environment Variables

Create a `.env` file in the `backend` directory:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./stocks.db
HOST=0.0.0.0
PORT=8000
```

## Technologies Used

- **Backend**: FastAPI, SQLAlchemy, OpenAI API, SQLite
- **Frontend**: React, Vite, Axios
- **LLM**: OpenAI GPT-4o-mini
