const API_KEY =
  "c64a22373c186959cf136c159d9c9e38253b0c045cd7d93cbaf60efa1f4c9a05";
const query = "latest finance news India"; // Updated query for finance data of India

const url = `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(query)}&api_key=${API_KEY}`;

fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log("API Response:");
    console.log(JSON.stringify(data, null, 2));
    if (data.error) {
      console.log("Error in response:", data.error);
    } else {
      console.log("Success! News results found.");
      if (data.news_results && data.news_results.length > 0) {
        console.log(`Found ${data.news_results.length} news articles.`);
        // Log the first few titles to verify relevance
        data.news_results.slice(0, 5).forEach((article, index) => {
          console.log(
            `${index + 1}. ${article.title} - ${article.source.name}`,
          );
        });
      }
    }
  })
  .catch((error) => {
    console.error("Error testing API:", error.message);
  });
