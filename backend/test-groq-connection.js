require("dotenv").config();
const Groq = require("groq-sdk");

console.log("\n🧪 Testing Groq API Connection...\n");
console.log("API Key:", process.env.GROQ_API_KEY ? "✅ Found" : "❌ Missing");

if (!process.env.GROQ_API_KEY) {
  console.error("\n❌ GROQ_API_KEY not found in .env file\n");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
  try {
    console.log("Sending test request to Groq...\n");
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "user", 
          content: "Say 'Hello, I am working!' in JSON format: {\"message\": \"...\"}"
        }
      ],
      temperature: 0,
      max_tokens: 50
    });
    
    console.log("✅ SUCCESS! Groq API is working!\n");
    console.log("Response:", completion.choices[0].message.content);
    console.log("\n✅ Your Groq API key is valid and working correctly!\n");
    
  } catch (error) {
    console.error("\n❌ ERROR connecting to Groq API:\n");
    console.error("Error Type:", error.constructor.name);
    console.error("Error Message:", error.message);
    
    if (error.message.includes("401") || error.message.includes("authentication")) {
      console.error("\n⚠️  Your API key appears to be invalid or expired.");
      console.error("   Get a new key from: https://console.groq.com/keys\n");
    } else if (error.message.includes("network") || error.message.includes("ENOTFOUND")) {
      console.error("\n⚠️  Network connection issue. Check your internet connection.\n");
    } else {
      console.error("\n⚠️  Groq service might be temporarily down.\n");
    }
    
    process.exit(1);
  }
}

testGroq();
