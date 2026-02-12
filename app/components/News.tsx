import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import Header from "./header";
import NewsCards from "./newscards";

export default function News() {
  const router = useRouter();

  const handleNewsAlerts = () => {
    // Already on news screen, maybe refresh or something
    // The NewsCards component handles its own refresh
  };

  const handleHome = () => {
    router.push("/");
  };

  const handleNewChat = () => {
    router.push("/");
  };

  return (
    <View style={styles.container}>
      <Header
        onNewsAlerts={handleNewsAlerts}
        onHome={handleHome}
        onNewChat={handleNewChat}
      />
      <NewsCards />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f2e8",
  },
});
