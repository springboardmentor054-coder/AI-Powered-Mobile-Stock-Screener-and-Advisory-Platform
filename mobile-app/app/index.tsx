import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

/* ---------- TYPE DEFINITIONS ---------- */
type Stock = {
  company_name: string;
  ticker_symbol: string;
  sector: string;
  pe_ratio: number;
  pb_ratio: number;
  debt_to_equity: number;
  revenue_yoy_growth: number;
  eps_yoy_growth: number;
};

/* ---------- MAIN COMPONENT ---------- */
export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  const runScreener = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("http://localhost:5001/screener/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      alert("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  // Determine which columns to show based on query
  const getRelevantColumns = () => {
    const lowerQuery = query.toLowerCase();
    const columns = [];

    // Always show company, symbol, sector
    columns.push('company', 'symbol', 'sector');

    // Add relevant metrics based on query
    if (lowerQuery.includes('pe') || lowerQuery.includes('p/e') || lowerQuery.includes('price to earnings')) {
      columns.push('pe_ratio');
    }
    if (lowerQuery.includes('pb') || lowerQuery.includes('p/b') || lowerQuery.includes('price to book')) {
      columns.push('pb_ratio');
    }
    if (lowerQuery.includes('debt') || lowerQuery.includes('leverage')) {
      columns.push('debt_to_equity');
    }
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      columns.push('revenue_yoy_growth');
    }
    if (lowerQuery.includes('eps') || lowerQuery.includes('earnings')) {
      columns.push('eps_yoy_growth');
    }

    // If no specific metrics mentioned, show PE ratio as default
    if (columns.length === 3) {
      columns.push('pe_ratio');
    }

    return columns;
  };

  const visibleColumns = results.length > 0 ? getRelevantColumns() : [];

  const renderCell = (item: Stock, column: string) => {
    switch (column) {
      case 'company':
        return item.company_name;
      case 'symbol':
        return item.ticker_symbol;
      case 'sector':
        return item.sector;
      case 'pe_ratio':
        return item.pe_ratio?.toFixed(2) || '-';
      case 'pb_ratio':
        return item.pb_ratio?.toFixed(2) || '-';
      case 'debt_to_equity':
        return item.debt_to_equity?.toFixed(2) || '-';
      case 'revenue_yoy_growth':
        return item.revenue_yoy_growth ? `${item.revenue_yoy_growth}%` : '-';
      case 'eps_yoy_growth':
        return item.eps_yoy_growth ? `${item.eps_yoy_growth}%` : '-';
      default:
        return '-';
    }
  };

  const getColumnHeader = (column: string) => {
    switch (column) {
      case 'company': return 'Company';
      case 'symbol': return 'Symbol';
      case 'sector': return 'Sector';
      case 'pe_ratio': return 'P/E Ratio';
      case 'pb_ratio': return 'P/B Ratio';
      case 'debt_to_equity': return 'Debt/Eq';
      case 'revenue_yoy_growth': return 'Rev YoY %';
      case 'eps_yoy_growth': return 'EPS YoY %';
      default: return column;
    }
  };

  const getCellStyle = (column: string) => {
    if (column === 'company') return [styles.cell, styles.companyCell, styles.companyName];
    if (column === 'symbol') return [styles.cell, styles.tickerCell];
    if (column === 'pe_ratio') return [styles.cell, styles.metricCell];
    return styles.cell;
  };

  const getHeaderCellStyle = (column: string) => {
    if (column === 'company') return [styles.cell, styles.headerCell, styles.companyCell];
    return [styles.cell, styles.headerCell];
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Stock Screener</Text>
          <Text style={styles.subtitle}>Discover stocks with natural language</Text>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Your Query</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>🔍</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., IT stocks with PE < 10"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={runScreener}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Run Screener</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Analyzing stocks...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && query === "" && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyTitle}>Ready to discover stocks?</Text>
            <Text style={styles.emptyText}>
              Enter a query above and let AI find the perfect matches
            </Text>
          </View>
        )}

        {/* No Results State */}
        {!loading && results.length === 0 && query !== "" && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No stocks found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search criteria
            </Text>
          </View>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {results.length} stock{results.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.tableWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    {visibleColumns.map((column) => (
                      <Text key={column} style={getHeaderCellStyle(column)}>
                        {getColumnHeader(column)}
                      </Text>
                    ))}
                  </View>

                  {/* Table Rows */}
                  {results.map((item, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.tableRow,
                        index % 2 === 0 && styles.tableRowEven
                      ]}
                    >
                      {visibleColumns.map((column) => (
                        <Text key={column} style={getCellStyle(column)}>
                          {renderCell(item, column)}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
  },
  searchCard: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#334155",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  buttonIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    color: "#94a3b8",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
  },
  resultsContainer: {
    width: "100%",
    maxWidth: 900,
    alignItems: "center",
  },
  resultsHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tableWrapper: {
    width: "100%",
    alignItems: "center",
  },
  tableScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  tableContainer: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
    paddingVertical: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#334155",
    paddingVertical: 16,
  },
  tableRowEven: {
    backgroundColor: "#1a2332",
  },
  cell: {
    width: 160,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#cbd5e1",
  },
  companyCell: {
    width: 220,
  },
  headerCell: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  companyName: {
    fontWeight: "600",
    color: "#ffffff",
  },
  tickerCell: {
    fontWeight: "700",
    color: "#60a5fa",
  },
  metricCell: {
    fontWeight: "600",
    color: "#34d399",
  },
});