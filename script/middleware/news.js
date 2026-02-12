require("dotenv").config({ path: "../.env" });
const fetch = require("node-fetch");

class NewsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://serpapi.com/search.json";
  }

  /**
   * Fetch latest finance news for India with optional date filtering
   * @param {string} query - Search query (default: "latest finance news India")
   * @param {Date} startDate - Start date for filtering (optional)
   * @param {Date} endDate - End date for filtering (optional)
   * @returns {Promise<Array>} Array of news articles
   */
  async getIndianFinanceNews(
    query = "latest finance news India",
    startDate = null,
    endDate = null,
  ) {
    try {
      if (!this.apiKey) {
        throw new Error(
          "API key not found. Please set EXPO_PUBLIC_NEWS_API environment variable.",
        );
      }

      const url = `${this.baseUrl}?engine=google_news&q=${encodeURIComponent(query)}&api_key=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      let articles = data.news_results || [];

      // Filter by date range if provided
      if (startDate || endDate) {
        articles = this.filterArticlesByDate(articles, startDate, endDate);
      }

      return articles;
    } catch (error) {
      console.error("Error fetching Indian finance news:", error.message);
      throw error;
    }
  }

  /**
   * Fetch general news articles from Google News
   * @param {string} query - Search query (default: "latest news")
   * @returns {Promise<Array>} Array of news articles
   */
  async getGeneralNews(query = "latest news") {
    try {
      if (!this.apiKey) {
        throw new Error(
          "API key not found. Please set EXPO_PUBLIC_NEWS_API environment variable.",
        );
      }

      const url = `${this.baseUrl}?engine=google_news&q=${encodeURIComponent(query)}&api_key=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      let articles = data.news_results || [];

      return articles;
    } catch (error) {
      console.error("Error fetching general news:", error.message);
      throw error;
    }
  }

  /**
   * Filter articles by date range
   * @param {Array} articles - Array of news articles
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Array} Filtered articles
   */
  filterArticlesByDate(articles, startDate, endDate) {
    return articles.filter((article) => {
      if (!article.iso_date) return false;

      const articleDate = new Date(article.iso_date);

      if (startDate && articleDate < startDate) return false;
      if (endDate && articleDate > endDate) return false;

      return true;
    });
  }

  /**
   * Get latest finance news from January 1, 2026 to today
   * If no articles found in this range, fall back to most recent articles from last 30 days
   * @returns {Promise<Array>} Array of recent news articles
   */
  async getLatestFinanceNews() {
    // Get latest finance news without date restrictions to show more articles
    console.log("Fetching latest finance news without date filter");
    const articles = await this.getIndianFinanceNews(
      "latest finance news India",
    );
    // Sort by date (most recent first) and take top 50
    articles.sort((a, b) => new Date(b.iso_date) - new Date(a.iso_date));
    return articles.slice(0, 50);
  }

  /**
   * Get news by specific category
   * @param {string} category - News category (e.g., "stocks", "economy", "banking")
   * @param {Date} startDate - Start date for filtering (optional)
   * @param {Date} endDate - End date for filtering (optional)
   * @returns {Promise<Array>} Array of news articles
   */
  async getNewsByCategory(category, startDate = null, endDate = null) {
    const query = `latest ${category} news India`;
    return this.getIndianFinanceNews(query, startDate, endDate);
  }

  /**
   * Fetch news by Google News topic token
   * @param {string} topicToken - Google News topic token
   * @returns {Promise<Array>} Array of news articles
   */
  async getNewsByTopic(topicToken) {
    try {
      if (!this.apiKey) {
        throw new Error(
          "API key not found. Please set EXPO_PUBLIC_NEWS_API environment variable.",
        );
      }

      const url = `${this.baseUrl}?engine=google_news&topic_token=${encodeURIComponent(topicToken)}&api_key=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }

      let articles = data.news_results || [];

      return articles;
    } catch (error) {
      console.error("Error fetching news by topic:", error.message);
      throw error;
    }
  }

  /**
   * Get top headlines
   * @param {number} limit - Number of articles to return (default: 10)
   * @returns {Promise<Array>} Array of top news articles
   */
  async getTopHeadlines(limit = 10) {
    const articles = await this.getIndianFinanceNews();
    return articles.slice(0, limit);
  }

  /**
   * Search news by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Array of matching news articles
   */
  async searchNews(keyword) {
    const query = `${keyword} finance news India`;
    return this.getIndianFinanceNews(query);
  }
}

// Export for use in other modules
module.exports = NewsService;

// Main function for testing/scripting
async function main() {
  const apiKey = process.env.EXPO_PUBLIC_NEWS_API || process.env.NEWS_API;

  if (!apiKey) {
    console.error(
      "Please set EXPO_PUBLIC_NEWS_API or NEWS_API environment variable",
    );
    process.exit(1);
  }

  const newsService = new NewsService(apiKey);

  try {
    console.log(
      "Fetching latest Indian finance news from Jan 1, 2026 to today...",
    );
    const articles = await newsService.getLatestFinanceNews();

    console.log(`Found ${articles.length} articles in date range:`);
    articles.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source.name}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   ISO Date: ${article.iso_date}`);
      console.log(`   Link: ${article.link}`);
      console.log("---");
    });

    // Also test without date filtering to see what dates are available
    console.log("\nFetching ALL finance news (no date filter)...");
    const allArticles = await newsService.getIndianFinanceNews();
    console.log(`Found ${allArticles.length} total articles`);
    allArticles.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. Date: ${article.iso_date} - ${article.title}`);
    });

    // Example: Get news by category with date filtering
    console.log("\nFetching stock market news from Jan 1, 2026 to today...");
    const startDate = new Date("2026-01-01T00:00:00Z");
    const endDate = new Date();
    const stockNews = await newsService.getNewsByCategory(
      "stock market",
      startDate,
      endDate,
    );
    console.log(
      `Found ${stockNews.length} stock market articles in date range`,
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run main if this file is executed directly
if (require.main === module) {
  main();
}
