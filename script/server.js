require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const NewsService = require("./middleware/news");
const emailService = require("./middleware/email");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize news service
const apiKey = process.env.EXPO_PUBLIC_NEWS_API || process.env.NEWS_API;
const newsService = new NewsService(apiKey);

// Routes
app.get("/api/news", async (req, res) => {
  try {
    const query = req.query.q;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let articles;
    if (query) {
      // Custom query provided - apply date filtering from Oct 25, 2025
      console.log(
        `Fetching news for custom query with date filtering: ${query}`,
      );
      const startDate = new Date("2025-10-25T00:00:00Z");
      const endDate = new Date(); // Today
      articles = await newsService.getIndianFinanceNews(
        query,
        startDate,
        endDate,
      );
    } else {
      // Default: Get latest news without strict date filtering to show more articles
      console.log("Fetching latest finance news");
      articles = await newsService.getLatestFinanceNews();
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      articles = articles.slice(0, limit);
    }

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      query: query || "latest finance news India (Oct 25, 2025 - today)",
      dateRange: "2025-10-25 to today",
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/news/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`Fetching news for category: ${category} (2026 only)`);

    // Apply 2026 date filtering to category searches
    const startDate = new Date("2026-01-01T00:00:00Z");
    const endDate = new Date(); // Today
    const articles = await newsService.getNewsByCategory(
      category,
      startDate,
      endDate,
    );

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      category: category,
      dateRange: "2026-01-01 to today",
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/news/top/:limit", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    console.log(`Fetching top ${limit} headlines`);

    const articles = await newsService.getTopHeadlines(limit);

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      limit: limit,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/news/top", async (req, res) => {
  try {
    const limit = 10; // Default limit
    console.log(`Fetching top ${limit} headlines`);

    const articles = await newsService.getTopHeadlines(limit);

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      limit: limit,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/news/search", async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Keyword parameter is required",
      });
    }

    console.log(`Searching news for keyword: ${keyword}`);

    const articles = await newsService.searchNews(keyword);

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      keyword: keyword,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// General news endpoint
app.get("/api/news/general", async (req, res) => {
  try {
    const query = req.query.q || "latest news";
    console.log(`Fetching general news for query: ${query}`);

    const articles = await newsService.getGeneralNews(query);

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      query: query,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// News by topic endpoint
app.get("/api/news/topic/:topicToken", async (req, res) => {
  try {
    const { topicToken } = req.params;
    console.log(`Fetching news for topic token: ${topicToken}`);

    const articles = await newsService.getNewsByTopic(topicToken);

    res.json({
      success: true,
      data: articles,
      count: articles.length,
      topicToken: topicToken,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Predefined topic endpoints
const topicTokens = {
  us: "CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTjNjd0VnSmxiaWdBUAE",
  world: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
  business: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB",
  technology: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
  entertainment: "CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB",
  sports: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB",
  science: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB",
  health: "CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ",
};

Object.keys(topicTokens).forEach((topic) => {
  app.get(`/api/news/${topic}`, async (req, res) => {
    try {
      console.log(`Fetching ${topic} news`);

      const articles = await newsService.getNewsByTopic(topicTokens[topic]);

      res.json({
        success: true,
        data: articles,
        count: articles.length,
        topic: topic,
      });
    } catch (error) {
      console.error("API Error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
});

// Alert preferences endpoints
app.post("/api/alerts/preferences", async (req, res) => {
  try {
    const {
      userId,
      emailAlertsEnabled,
      dailyAlerts,
      weeklyDigest,
      alertFrequency,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Update alert preferences in database
    const { data, error } = await supabase.rpc(
      "update_user_alert_preferences",
      {
        user_uuid: userId,
        p_email_alerts_enabled: emailAlertsEnabled,
        p_daily_alerts: dailyAlerts,
        p_weekly_digest: weeklyDigest,
        p_alert_frequency: alertFrequency,
      },
    );

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update alert preferences",
      });
    }

    // If alerts are being enabled, send activation email
    if (emailAlertsEnabled) {
      // Get user profile for email
      const { data: profile, error: profileError } = await supabase.rpc(
        "get_user_profile",
        {
          user_uuid: userId,
        },
      );

      if (!profileError && profile && profile.email) {
        const userName = profile.first_name || profile.display_name || "User";
        await emailService.sendAlertActivationEmail(profile.email, userName);
      }
    }

    res.json({
      success: true,
      message: "Alert preferences updated successfully",
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/alerts/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase.rpc("get_user_alert_preferences", {
      user_uuid: userId,
    });

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get alert preferences",
      });
    }

    res.json({
      success: true,
      data: data[0] || {
        email_alerts_enabled: false,
        daily_alerts: false,
        weekly_digest: false,
        alert_frequency: "none",
        last_alert_sent: null,
      },
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send daily alerts endpoint (for cron job)
app.post("/api/alerts/send-daily", async (req, res) => {
  try {
    // Get all users with daily alerts enabled
    const { data: users, error } = await supabase
      .from("user_alert_preferences")
      .select(
        `
        user_id,
        user_profiles!inner(email, first_name, display_name)
      `,
      )
      .eq("email_alerts_enabled", true)
      .eq("daily_alerts", true);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get users for daily alerts",
      });
    }

    // Get latest news
    const articles = await newsService.getLatestFinanceNews();
    const topArticles = articles.slice(0, 5); // Top 5 articles

    // Send emails to each user
    const emailPromises = users.map(async (user) => {
      const userName =
        user.user_profiles.first_name ||
        user.user_profiles.display_name ||
        "User";
      await emailService.sendDailyNewsAlert(
        user.user_profiles.email,
        userName,
        topArticles,
      );

      // Update last alert sent timestamp
      await supabase.rpc("update_last_alert_sent", {
        user_uuid: user.user_id,
      });
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Daily alerts sent to ${users.length} users`,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send weekly digest endpoint (for cron job)
app.post("/api/alerts/send-weekly", async (req, res) => {
  try {
    // Get all users with weekly digest enabled
    const { data: users, error } = await supabase
      .from("user_alert_preferences")
      .select(
        `
        user_id,
        user_profiles!inner(email, first_name, display_name)
      `,
      )
      .eq("email_alerts_enabled", true)
      .eq("weekly_digest", true);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get users for weekly digest",
      });
    }

    // Get news from the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const articles = await newsService.getIndianFinanceNews(
      "latest finance news India",
      weekAgo,
      new Date(),
    );

    // Send emails to each user
    const emailPromises = users.map(async (user) => {
      const userName =
        user.user_profiles.first_name ||
        user.user_profiles.display_name ||
        "User";
      await emailService.sendWeeklyNewsDigest(
        user.user_profiles.email,
        userName,
        articles,
      );

      // Update last alert sent timestamp
      await supabase.rpc("update_last_alert_sent", {
        user_uuid: user.user_id,
      });
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Weekly digest sent to ${users.length} users`,
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "News API server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 News API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📰 News endpoint: http://localhost:${PORT}/api/news`);
  console.log(
    `🌍 General news endpoint: http://localhost:${PORT}/api/news/general`,
  );
  console.log(
    `📂 Topic news endpoints: /api/news/us, /api/news/world, /api/news/business, /api/news/technology, /api/news/entertainment, /api/news/sports, /api/news/science, /api/news/health`,
  );
  console.log(`� Alert preferences: POST /api/alerts/preferences`);
  console.log(`📧 Get alert preferences: GET /api/alerts/preferences/:userId`);
  console.log(`📧 Send daily alerts: POST /api/alerts/send-daily`);
  console.log(`📧 Send weekly digest: POST /api/alerts/send-weekly`);
  console.log(`�📈 Press Ctrl+C to stop the server`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down News API server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down News API server...");
  process.exit(0);
});
