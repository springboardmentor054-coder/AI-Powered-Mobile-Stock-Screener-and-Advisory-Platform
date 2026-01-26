import './ResultsTable.css'

function ResultsTable({ results, executionTime }) {
  if (!results || results.length === 0) {
    return (
      <div className="results-table">
        <h3>Results</h3>
        <p className="no-results">No results found.</p>
      </div>
    )
  }

  // Get all unique keys from results for column headers
  const columns = Object.keys(results[0])

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'number') {
      // Format large numbers
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(2)}B`
      } else if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`
      }
      return value.toFixed(2)
    }
    return String(value)
  }

  return (
    <div className="results-table">
      <div className="results-header">
        <h3>Results ({results.length} found)</h3>
        {executionTime && (
          <span className="results-time">
            Executed in {executionTime.toFixed(3)}s
          </span>
        )}
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{formatValue(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResultsTable
