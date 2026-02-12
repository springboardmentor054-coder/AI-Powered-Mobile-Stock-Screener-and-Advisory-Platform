import { useRouter } from "expo-router";
import { View } from "react-native";
import Header from "./components/header";
import PortfolioAndWatchlist from "./components/Portfolio_and_watchlist";
import { usePortfolio } from "./contexts/PortfolioContext";

export default function PortfolioWatchlistPage() {
  const router = useRouter();
  const { portfolio, watchlist } = usePortfolio();

  return (
    <View style={{ backgroundColor: "#f8f2e8", flex: 1 }}>
      <Header
        onHome={() => router.replace("/")}
        onNewChat={() => router.replace("/")}
        onNewsAlerts={() => router.push("/news")}
      />
      <PortfolioAndWatchlist portfolio={portfolio} watchlist={watchlist} />
    </View>
  );
}
