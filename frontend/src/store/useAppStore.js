import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  // ======================
  // AUTH (LOGIN / LOGOUT)
  // ======================

  isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
  user: JSON.parse(localStorage.getItem("user")) || null,

  login: (user) => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(user));

    set(() =>({
      isLoggedIn: true,
      user,
    }));
  },

  logout: () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    set({
      isLoggedIn: false,
      user: null,
    });
  },

  // ======================
  // QUERY STATE
  // ======================

  query: "",
  results: null,
  loading: false,
  error: null,
  executionTime: null,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setExecutionTime: (time) => set({ executionTime: time }),

  // ======================
  // QUERY HISTORY
  // ======================

  queryHistory: JSON.parse(localStorage.getItem("queryHistory")) || [],

  addQueryToHistory: (query) =>
    set((state) => {
      const updated = [
        { text: query, time: new Date().toLocaleTimeString() },
        ...state.queryHistory.filter((q) => q.text !== query),
      ].slice(0, 10);

      localStorage.setItem("queryHistory", JSON.stringify(updated));
      return { queryHistory: updated };
    }),

  // ======================
  // VIEW MODE
  // ======================

  viewMode: "table",
  setViewMode: (mode) => set({ viewMode: mode }),

  // ======================
  // SELECTED STOCK (DRAWER)
  // ======================

  selectedStock: null,
  setSelectedStock: (stock) => set({ selectedStock: stock }),
  clearSelectedStock: () => set({ selectedStock: null }),

  // ======================
  // WATCHLIST
  // ======================

  watchlist: JSON.parse(localStorage.getItem("watchlist")) || [],

  addToWatchlist: (stock) =>
    set((state) => {
      if (state.watchlist.some((s) => s.id === stock.id)) return state;

      const updated = [...state.watchlist, stock];
      localStorage.setItem("watchlist", JSON.stringify(updated));
      return { watchlist: updated };
    }),

  removeFromWatchlist: (id) =>
    set((state) => {
      const updated = state.watchlist.filter((s) => s.id !== id);
      localStorage.setItem("watchlist", JSON.stringify(updated));
      return { watchlist: updated };
    }),

  // ======================
  // PORTFOLIO
  // ======================

  portfolio: JSON.parse(localStorage.getItem("portfolio")) || [],

  addToPortfolio: (stock) =>
    set((state) => {
      if (state.portfolio.some((s) => s.id === stock.id)) return state;

      const updated = [...state.portfolio, stock];
      localStorage.setItem("portfolio", JSON.stringify(updated));
      return { portfolio: updated };
    }),

  removeFromPortfolio: (id) =>
    set((state) => {
      const updated = state.portfolio.filter((s) => s.id !== id);
      localStorage.setItem("portfolio", JSON.stringify(updated));
      return { portfolio: updated };
    }),

  // ======================
  // ALERTS
  // ======================

  alerts: JSON.parse(localStorage.getItem("alerts")) || [],

  addAlert: (alert) =>
    set((state) => {
      const updated = [...state.alerts, alert];
      localStorage.setItem("alerts", JSON.stringify(updated));
      return { alerts: updated };
    }),

  removeAlert: (id) =>
    set((state) => {
      const updated = state.alerts.filter((a) => a.id !== id);
      localStorage.setItem("alerts", JSON.stringify(updated));
      return { alerts: updated };
    }),

  // ======================
  // TRIGGERED ALERTS
  // ======================

  triggeredAlerts:
    JSON.parse(localStorage.getItem("triggeredAlerts")) || [],

  triggerAlert: (alert) =>
    set((state) => {
      const remaining = state.alerts.filter(
        (a) => a.id !== alert.id
      );

      const triggered = [...state.triggeredAlerts, alert];

      localStorage.setItem("alerts", JSON.stringify(remaining));
      localStorage.setItem(
        "triggeredAlerts",
        JSON.stringify(triggered)
      );

      return {
        alerts: remaining,
        triggeredAlerts: triggered,
      };
    }),
}));
