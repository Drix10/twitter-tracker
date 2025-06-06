module.exports = {
    twitter: {
        username: "your_twitter_username",
        password: "your_twitter_password",
        email: "your_twitter_email@example.com"
    },
    monitoring: {
        targetUsername: "username_to_monitor",
        checkInterval: 10000, // Check every 10 seconds
        rateLimitDelay: 10000, // Delay between requests to avoid rate limiting
        keywords: ["queue", "live", "stream"], // Keywords to monitor for notifications
        sendAllTweets: false // Set to true to send all tweets, false to only send tweets with keywords
    },
    discord: {
        webhookUrl: "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"
    }
}; 