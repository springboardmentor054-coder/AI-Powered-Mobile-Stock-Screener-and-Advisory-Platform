import { useState } from "react";
import { View } from "react-native";
import Header from "./components/header";
import Hero from "./components/hero";

export default function Index() {
  const [showInputOnly, setShowInputOnly] = useState(false);

  return (
    <View style={{ backgroundColor: "#f8f2e8", flex: 1 }}>
      <Header
        onNewChat={() => setShowInputOnly(true)}
        onHome={() => setShowInputOnly(false)}
      />
      <Hero
        inputOnly={showInputOnly}
        onExitInputOnly={() => setShowInputOnly(false)}
      />
    </View>
  );
}
