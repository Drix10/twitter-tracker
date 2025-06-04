# Twitter Scraper

A Node.js application that monitors Twitter accounts for new tweets and sends notifications to Discord via webhooks.

## Features

- 🐦 Monitor specific Twitter accounts for new tweets
- 🤖 Automated scraping using Selenium WebDriver
- 📢 Discord webhook integration for notifications
- ⏱️ Configurable monitoring intervals
- 🛡️ Rate limiting protection

## Prerequisites

- Node.js (v14 or higher)
- Chrome browser (for Selenium WebDriver)
- Discord webhook URL
- Twitter account credentials

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd twitter-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Configure the application:
```bash
cp config.example.js config.js
```

4. Edit `config.js` with your credentials:
   - Twitter account credentials (username, password, email)
   - Target username to monitor
   - Discord webhook URL
   - Monitoring intervals (optional)

## Configuration

The `config.js` file contains the following settings:

```javascript
module.exports = {
    twitter: {
        username: "your_twitter_username",
        password: "your_twitter_password", 
        email: "your_twitter_email@example.com"
    },
    monitoring: {
        targetUsername: "username_to_monitor",
        checkInterval: 10000, // Check every 10 seconds
        rateLimitDelay: 10000 // Delay between requests
    },
    discord: {
        webhookUrl: "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"
    }
};
```

## Usage

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## How it Works

1. The scraper logs into Twitter using Selenium WebDriver
2. Monitors the specified target account for new tweets
3. When new tweets are detected, sends a notification to Discord
4. Implements rate limiting to avoid being blocked by Twitter

## Dependencies

- **selenium-webdriver**: Web automation for scraping Twitter
- **axios**: HTTP client for Discord webhook requests
- **nodemon**: Development tool for auto-restarting (dev dependency)

## Important Notes

⚠️ **Disclaimer**: This tool is for educational purposes only. Please respect Twitter's Terms of Service and rate limits. Use responsibly and ensure you have permission to monitor the accounts you're targeting.

⚠️ **Security**: Never commit your `config.js` file with real credentials to version control. The file is included in `.gitignore` for your protection.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the package.json file for details.

## Troubleshooting

- **Chrome driver issues**: Make sure you have Chrome browser installed
- **Login failures**: Verify your Twitter credentials in config.js
- **Rate limiting**: Increase the `rateLimitDelay` value if you're getting blocked
- **Discord notifications not working**: Check your webhook URL is correct

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 