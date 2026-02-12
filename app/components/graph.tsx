import { Dimensions, ScrollView, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { StockRow } from "./cards";

interface PortfolioGraphProps {
  portfolio: StockRow[];
}

export default function PortfolioGraph({ portfolio }: PortfolioGraphProps) {
  if (portfolio.length === 0) {
    return (
      <View
        style={{ alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <Text style={{ color: "#6b7280", fontSize: 16 }}>
          No data to display
        </Text>
      </View>
    );
  }

  // Prepare data for the chart
  const data = {
    labels: portfolio.map((item) => item.screener || item.name || "Unknown"),
    datasets: [
      {
        data: portfolio.map((item) => parseFloat(item.ltp || "0") || 0),
      },
    ],
  };

  const screenWidth = Math.max(
    Dimensions.get("window").width - 40,
    portfolio.length * 80,
  ); // Dynamic width based on number of items

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(135, 191, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#87bfff",
    },
    propsForLabels: {
      fontSize: 14,
      fontWeight: "bold",
    },
    propsForVerticalLabels: {
      fontSize: 12,
      rotation: 45,
    },
  };

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#000000",
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        Portfolio Value Distribution
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <BarChart
          data={data}
          width={screenWidth}
          height={280}
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#e8e8e8",
          }}
          showValuesOnTopOfBars={true}
          withInnerLines={false}
          yAxisLabel="₹"
          yAxisSuffix=""
          fromZero={true}
        />
      </ScrollView>
    </View>
  );
}
