
import "dotenv/config";

// Hardcoded fallback from actions.ts
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("Checking API Key...");
if (!OPENROUTER_API_KEY) {
    console.error("ERROR: OPENROUTER_API_KEY is missing from environment.");
    process.exit(1);
}
console.log("API Key found.");

async function testAI() {
    console.log("Testing OpenRouter API...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Test-Script"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free", // Using a reliable free model
                messages: [
                    { role: "user", content: "Say 'Hello from AI' if you can hear me." }
                ]
            }),
        });

        const data = await response.json();
        console.log("Response Status:", response.status);

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Success! Response:", data.choices?.[0]?.message?.content);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testAI();
