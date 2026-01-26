import { useState } from 'react'
import './SQLDisplay.css'

function SQLDisplay({ sqlQuery, parsedJson, executionTime }) {
  const [showJson, setShowJson] = useState(false)

  return (
    <div className="sql-display">
      <div className="sql-header">
        <h3>Generated SQL Query</h3>
        <div className="sql-meta">
          <span className="execution-time">
            ⚡ {executionTime?.toFixed(3)}s
          </span>
          <button 
            className="toggle-button"
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? 'Hide' : 'Show'} Parsed JSON
          </button>
        </div>
      </div>
      
      <div className="sql-code">
        <code>{sqlQuery}</code>
      </div>

      {showJson && (
        <div className="json-display">
          <h4>Parsed JSON Structure:</h4>
          <pre>{JSON.stringify(parsedJson, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default SQLDisplay
