
import "dotenv/config";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

console.log("Checking YouTube API Key...");
if (!YOUTUBE_API_KEY) {
    console.error("WARNING: YOUTUBE_API_KEY is missing from environment.");
    // We can't test it if it's missing, but that answers the user's question (it's missing).
    process.exit(0);
}
console.log("API Key found.");

async function testYouTube() {
    console.log("Testing YouTube API...");
    try {
        const query = "pasta";
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`
        );

        const data = await response.json();

        if (data.error) {
            console.error("YouTube API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Success! Found video:", data.items?.[0]?.snippet?.title);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testYouTube();
