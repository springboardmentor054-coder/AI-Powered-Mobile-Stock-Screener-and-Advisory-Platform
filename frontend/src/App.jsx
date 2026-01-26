import { useState } from 'react'
import QueryInput from './components/QueryInput'
import ResultsTable from './components/ResultsTable'
import SQLDisplay from './components/SQLDisplay'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (queryText) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to process query')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🤖 AI Stock Retrieval</h1>
          <p>Ask questions about stocks in natural language</p>
        </header>

        <QueryInput 
          onSubmit={handleSubmit}
          loading={loading}
        />

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <>
            <SQLDisplay 
              sqlQuery={results.sql_query}
              parsedJson={results.parsed_json}
              executionTime={results.execution_time}
            />
            <ResultsTable 
              results={results.results}
              executionTime={results.execution_time}
            />
          </>
        )}

        <div className="examples">
          <h3>Example Queries:</h3>
          <ul>
            <li onClick={() => handleSubmit("Show me stocks with price above $100")}>
              "Show me stocks with price above $100"
            </li>
            <li onClick={() => handleSubmit("Find tech stocks with market cap greater than 1 billion")}>
              "Find tech stocks with market cap greater than 1 billion"
            </li>
            <li onClick={() => handleSubmit("Get stocks where volume is above 1 million and price is between $50 and $200")}>
              "Get stocks where volume is above 1 million and price is between $50 and $200"
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
