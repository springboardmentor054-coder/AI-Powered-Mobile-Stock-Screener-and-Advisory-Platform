import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface NewsArticle {
  position: number;
  title: string;
  source: {
    name: string;
    icon?: string;
  };
  link: string;
  thumbnail?: string;
  thumbnail_small?: string;
  date: string;
  iso_date: string;
}

interface NewsCardsProps {
  query?: string;
}

export default function NewsCards({
  query = "latest finance news India",
}: NewsCardsProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.EXPO_PUBLIC_NEWS_API;

  useEffect(() => {
    fetchNews();
  }, [query]);

  const fetchNews = async () => {
    console.log("API Key:", apiKey);
    if (!apiKey) {
      setError("API key not found");
      setLoading(false);
      return;
    }

    try {
      // Call local backend API instead of external API
      const url = `http://localhost:3001/api/news?q=${encodeURIComponent(query)}`;
      console.log("Fetching from local API:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response data keys:", Object.keys(data));

      if (data.success && data.data) {
        setNews(data.data);
        setError(null);
      } else if (data.error) {
        setError(`API Error: ${data.error}`);
      } else {
        setError("No news data received from API");
      }
    } catch (error) {
      const errorMessage = (error as Error).message || "Failed to fetch news";
      setError(`Network error: ${errorMessage}`);
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading latest news...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Latest Finance News - India</Text>
      </View>
      {news.map((article) => (
        <TouchableOpacity
          key={article.position}
          style={styles.articleCard}
          onPress={() => Linking.openURL(article.link)}
        >
          {article.thumbnail && (
            <Image
              source={{ uri: article.thumbnail }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}
          <View style={styles.articleContent}>
            <Text style={styles.articleTitle} numberOfLines={2}>
              {article.title}
            </Text>
            <Text style={styles.articleSource}>{article.source.name}</Text>
            <Text style={styles.articleDate}>
              {new Date(article.iso_date).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  articleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    lineHeight: 20,
  },
  articleSource: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  articleDate: {
    fontSize: 12,
    color: "#999999",
  },
});
