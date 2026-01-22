require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function test() {
  console.log("Testing Groq API...");
  console.log("API Key:", process.env.GROQ_API_KEY ? "Found" : "Missing");

  // Test with system + user messages
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that only outputs JSON"
        },
        { 
          role: "user", 
          content: "Convert this to JSON: Show IT stocks"
        }
      ],
      temperature: 0,
      max_tokens: 100
    });

    console.log("Response:", completion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.error) {
      console.error("API Error Details:", JSON.stringify(error.error, null, 2));
    }
  }
}

test();
