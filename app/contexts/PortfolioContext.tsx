import React, { createContext, ReactNode, useContext, useState } from "react";
import { StockRow } from "../components/cards";

interface PortfolioContextType {
  portfolio: StockRow[];
  watchlist: StockRow[];
  addToPortfolio: (stock: StockRow) => void;
  addToWatchlist: (stock: StockRow) => void;
  removeFromPortfolio: (id: number) => void;
  removeFromWatchlist: (id: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined,
);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({
  children,
}) => {
  const [portfolio, setPortfolio] = useState<StockRow[]>([]);
  const [watchlist, setWatchlist] = useState<StockRow[]>([]);

  const addToPortfolio = (stock: StockRow) => {
    setPortfolio((prev) => {
      if (prev.some((item) => item.id === stock.id)) {
        return prev; // Already in portfolio
      }
      return [...prev, stock];
    });
  };

  const addToWatchlist = (stock: StockRow) => {
    setWatchlist((prev) => {
      if (prev.some((item) => item.id === stock.id)) {
        return prev; // Already in watchlist
      }
      return [...prev, stock];
    });
  };

  const removeFromPortfolio = (id: number) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  };

  const removeFromWatchlist = (id: number) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        watchlist,
        addToPortfolio,
        addToWatchlist,
        removeFromPortfolio,
        removeFromWatchlist,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};
