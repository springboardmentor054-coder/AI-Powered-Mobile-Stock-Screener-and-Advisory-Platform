const http = require("http");

console.log("\n🔍 Stock Screener - Quick Verification\n");
console.log("=" .repeat(50));

// Check 1: Health endpoint
console.log("\n✅ Check 1: Backend Health");
http.get("http://localhost:5000/health", (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("✅ PASS - Backend is healthy");
      console.log("Response:", data);
    } else {
      console.log("❌ FAIL - Status:", res.statusCode);
    }
    
    // Check 2: Screener endpoint
    console.log("\n✅ Check 2: Screener API");
    const postData = JSON.stringify({
      query: "Show IT stocks with PE below 5"
    });

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/screener",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log("✅ PASS - Screener endpoint working");
          console.log(`Found ${result.count} stocks`);
          console.log(`Cached: ${result.cached}`);
          if (result.data && result.data.length > 0) {
            console.log("\nSample stock:");
            console.log(JSON.stringify(result.data[0], null, 2));
          }
        } else {
          console.log("❌ FAIL - Status:", res.statusCode);
          console.log("Response:", data);
        }
        
        console.log("\n" + "=".repeat(50));
        console.log("\n✅ Verification complete!");
        console.log("\nNext steps:");
        console.log("1. Run the same query again to test caching");
        console.log("2. Try different queries");
        console.log("3. Launch Flutter app and test mobile interface");
      });
    });

    req.on("error", (error) => {
      console.error("❌ FAIL - Error:", error.message);
      console.log("\nMake sure:");
      console.log("1. Backend server is running (npm start)");
      console.log("2. PostgreSQL is running");
      console.log("3. OpenAI API key is set in .env");
    });

    req.write(postData);
    req.end();
  });
}).on("error", (error) => {
  console.error("❌ FAIL - Cannot connect to backend");
  console.error("Error:", error.message);
  console.log("\nMake sure backend server is running:");
  console.log("  cd backend");
  console.log("  npm start");
});
