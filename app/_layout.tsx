import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";
import { PortfolioProvider } from "./contexts/PortfolioContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PortfolioProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </PortfolioProvider>
    </AuthProvider>
  );
}
