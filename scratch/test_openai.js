const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env.local") });

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log("⏳ Testing OpenAI API connection...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say 'Hello, MedBridge is ready!'" }],
      max_tokens: 20,
    });

    console.log("✅ Success!");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ API Test Failed:");
    console.error(error.message);
    if (error.status === 401) {
      console.error("Hint: Your API key seems invalid or expired.");
    }
    process.exit(1);
  }
}

testOpenAI();
