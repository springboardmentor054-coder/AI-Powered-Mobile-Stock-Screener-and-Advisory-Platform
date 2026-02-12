import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type PortfolioItem = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  change: number;
  changePercent: number;
};

type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
};

import { StockRow } from "./cards";
import PortfolioGraph from "./graph";

type PortfolioAndWatchlistProps = {
  portfolio: StockRow[];
  watchlist: StockRow[];
};

export default function PortfolioAndWatchlist({
  portfolio,
  watchlist,
}: PortfolioAndWatchlistProps) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "watchlist">(
    "portfolio",
  );

  // Calculate portfolio value and change (using ltp and change_pct from StockRow)
  const totalPortfolioValue = portfolio.reduce(
    (total, item) => total + (parseFloat(item.ltp ?? "0") || 0),
    0,
  );
  const totalPortfolioChange = portfolio.reduce(
    (total, item) => total + (parseFloat(item.change_pct ?? "0") || 0),
    0,
  );
  const totalPortfolioChangePercent =
    portfolio.length > 0 ? totalPortfolioChange / portfolio.length : 0;

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "portfolio" && styles.activeTab]}
          onPress={() => setActiveTab("portfolio")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "portfolio" && styles.activeTabText,
            ]}
          >
            Portfolio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "watchlist" && styles.activeTab]}
          onPress={() => setActiveTab("watchlist")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "watchlist" && styles.activeTabText,
            ]}
          >
            Watchlist
          </Text>
        </TouchableOpacity>
      </View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio & Watchlist</Text>
        <Text style={styles.subtitle}>Track your investments</Text>
      </View>

      {/* Portfolio Summary */}
      {activeTab === "portfolio" && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
          <Text style={styles.summaryValue}>
            ₹
            {totalPortfolioValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text
            style={[
              styles.summaryChange,
              { color: totalPortfolioChange >= 0 ? "#10a37f" : "#ff6b6b" },
            ]}
          >
            {totalPortfolioChange >= 0 ? "+" : ""}₹
            {totalPortfolioChange.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
            ({totalPortfolioChangePercent.toFixed(2)}%)
          </Text>
        </View>
      )}

      {/* Portfolio Graph */}
      {activeTab === "portfolio" && portfolio.length > 0 && (
        <PortfolioGraph portfolio={portfolio} />
      )}

      {/* Portfolio List */}
      
      {/* Watchlist List */}
      {activeTab === "watchlist" && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Your Watchlist</Text>
          {watchlist.length === 0 ? (
            <Text style={styles.emptyText}>No stocks in watchlist.</Text>
          ) : (
            watchlist.map((item: StockRow) => (
              <View key={item.id} style={styles.watchlistItem}>
                <View style={styles.itemLeft}>
                  <Text style={styles.symbol}>
                    {item.screener || item.name || "Unknown"}
                  </Text>
                  <Text style={styles.name}>{item.name || "Unknown"}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.currentPrice}>₹{item.ltp || "-"}</Text>
                  <Text
                    style={[
                      styles.change,
                      {
                        color:
                          parseFloat(item.change_pct ?? "0") >= 0
                            ? "#10a37f"
                            : "#ff6b6b",
                      },
                    ]}
                  >
                    {" "}
                    {item.change_pct ? `${item.change_pct}%` : "-"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#87bfff",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  portfolioItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  watchlistItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  itemLeft: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  shares: {
    fontSize: 12,
    color: "#8e92a9",
  },
  itemRight: {
    alignItems: "flex-end",
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
  },
});
