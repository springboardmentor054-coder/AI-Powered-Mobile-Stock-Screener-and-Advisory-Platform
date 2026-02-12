import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type StockRow = {
  id: number;
  name: string | null;
  screener: string | null;
  ltp: string | null;
  change_pct: string | null;
  open: string | null;
  volume: string | null;
  market_cap_cr: string | null;
  pe_ratio: string | null;
  industry_pe: string | null;
  high_52w: string | null;
  low_52w: string | null;
  return_1m: string | null;
  return_3m: string | null;
  return_1y: string | null;
  return_3y: string | null;
  return_5y: string | null;
  pb_ratio: string | null;
  dividend: string | null;
  roe: string | null;
  roce: string | null;
  eps: string | null;
  dma_50: string | null;
  dma_200: string | null;
  rsi: string | null;
  margin_funding: string | null;
  margin_pledge: string | null;
  uploaded_at: string | null;
};

const columns: Array<{ key: keyof StockRow; label: string }> = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "screener", label: "Screener" },
  { key: "ltp", label: "LTP" },
  { key: "change_pct", label: "Change %" },
  { key: "open", label: "Open" },
  { key: "volume", label: "Volume" },
  { key: "market_cap_cr", label: "Market Cap (Cr)" },
  { key: "pe_ratio", label: "PE Ratio" },
  { key: "industry_pe", label: "Industry PE" },
  { key: "high_52w", label: "52W High" },
  { key: "low_52w", label: "52W Low" },
  { key: "return_1m", label: "Return 1M" },
  { key: "return_3m", label: "Return 3M" },
  { key: "return_1y", label: "Return 1Y" },
  { key: "return_3y", label: "Return 3Y" },
  { key: "return_5y", label: "Return 5Y" },
  { key: "pb_ratio", label: "PB Ratio" },
  { key: "dividend", label: "Dividend" },
  { key: "roe", label: "ROE" },
  { key: "roce", label: "ROCE" },
  { key: "eps", label: "EPS" },
  { key: "dma_50", label: "DMA 50" },
  { key: "dma_200", label: "DMA 200" },
  { key: "rsi", label: "RSI" },
  { key: "margin_funding", label: "Margin Funding" },
  { key: "margin_pledge", label: "Margin Pledge" },
  { key: "uploaded_at", label: "Uploaded At" },
];

type CardsProps = {
  rows: StockRow[];
  loading: boolean;
  error: string | null;
  onAddToPortfolio?: (stock: StockRow) => void;
  onAddToWatchlist?: (stock: StockRow) => void;
};

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const cleaned = value.replace(/[%$,]/g, "").trim();
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function Cards({
  rows,
  loading,
  error,
  onAddToPortfolio,
  onAddToWatchlist,
}: CardsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  const primaryKeys = useMemo<Set<keyof StockRow>>(
    () =>
      new Set<keyof StockRow>([
        "id",
        "name",
        "screener",
        "ltp",
        "change_pct",
        "open",
        "volume",
        "market_cap_cr",
      ]),
    [],
  );

  const primaryColumns = useMemo(
    () => columns.filter((column) => primaryKeys.has(column.key)),
    [primaryKeys],
  );

  const detailColumns = useMemo(
    () => columns.filter((column) => !primaryKeys.has(column.key)),
    [primaryKeys],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading stocks...</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.emptyText}>{error}</Text>;
  }

  if (!rows.length) {
    return <Text style={styles.emptyText}>No stock data found.</Text>;
  }

  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <View key={row.id} style={styles.card}>
          <Text style={styles.cardTitle}>{row.name || "Unknown"}</Text>
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Return Timeline</Text>
            <View style={styles.chartRow}>
              {[
                { label: "1M", value: parseNumber(row.return_1m) },
                { label: "3M", value: parseNumber(row.return_3m) },
                { label: "1Y", value: parseNumber(row.return_1y) },
                { label: "3Y", value: parseNumber(row.return_3y) },
                { label: "5Y", value: parseNumber(row.return_5y) },
              ].map((point, index, arr) => {
                const maxAbs = Math.max(
                  1,
                  ...arr
                    .map((item) => Math.abs(item.value ?? 0))
                    .filter((val) => Number.isFinite(val)),
                );
                const height = Math.round(
                  (Math.abs(point.value ?? 0) / maxAbs) * 28 + 4,
                );
                const isPositive = (point.value ?? 0) >= 0;
                return (
                  <View
                    key={`${row.id}-chart-${index}`}
                    style={styles.chartItem}
                  >
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height,
                          backgroundColor: isPositive ? "#10a37f" : "#ef4444",
                        },
                      ]}
                    />
                    <Text style={styles.chartLabel}>{point.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          {primaryColumns.map((column) => {
            const value = row[column.key];
            return (
              <View key={`${row.id}-${column.key}`} style={styles.row}>
                <Text style={styles.label}>{column.label}</Text>
                <Text style={styles.value}>{value ?? "-"}</Text>
              </View>
            );
          })}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.portfolioButton}
              onPress={() => {
                onAddToPortfolio?.(row);
                onAddToWatchlist?.(row);
                // TODO: Show success feedback to user
                console.log(`Added ${row.name} to portfolio and watchlist`);
              }}
            >
              <Text style={styles.portfolioButtonText}>
                + Portfolio/Watchlist
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailToggle}
              onPress={() => {
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(row.id)) {
                    next.delete(row.id);
                  } else {
                    next.add(row.id);
                  }
                  return next;
                });
              }}
            >
              <Text style={styles.detailToggleText}>
                {expandedIds.has(row.id) ? "Hide details" : "More details"}
              </Text>
            </TouchableOpacity>
          </View>
          {expandedIds.has(row.id) && (
            <View style={styles.detailSection}>
              {detailColumns.map((column) => {
                const value = row[column.key];
                return (
                  <View key={`${row.id}-${column.key}`} style={styles.row}>
                    <Text style={styles.label}>{column.label}</Text>
                    <Text style={styles.value}>{value ?? "-"}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 28,
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    width: "48%",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  chartSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
  },
  chartTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartItem: {
    alignItems: "center",
    width: "18%",
  },
  chartBar: {
    width: "100%",
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  portfolioButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#10a37f",
    borderRadius: 6,
  },
  portfolioButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  detailToggle: {
    paddingVertical: 6,
  },
  detailToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  detailSection: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.08)",
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    maxWidth: "45%",
  },
  value: {
    fontSize: 12,
    color: "#111827",
    textAlign: "right",
    maxWidth: "55%",
  },
});
