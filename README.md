<div class="hero-icon" align="center">
  <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" width="100" />
</div>

<h1 align="center">
Twitter Tracker
</h1>
<h4 align="center">Real-time Twitter monitoring with Discord notifications and configurable keyword filtering</h4>
<h4 align="center">Developed with the software and tools below.</h4>
<div class="badges" align="center">
  <img src="https://img.shields.io/badge/Framework-Node.js-green" alt="Framework">
  <img src="https://img.shields.io/badge/Backend-JavaScript-yellow" alt="Backend">
  <img src="https://img.shields.io/badge/Automation-Selenium-blue" alt="Automation">
  <img src="https://img.shields.io/badge/Platform-Twitter-1DA1F2" alt="Platform">
</div>
<div class="badges" align="center">
  <img src="https://img.shields.io/github/last-commit/Drix10/twitter-tracker?style=flat-square&color=5D6D7E" alt="git-last-commit" />
  <img src="https://img.shields.io/github/commit-activity/m/Drix10/twitter-tracker?style=flat-square&color=5D6D7E" alt="GitHub commit activity" />
  <img src="https://img.shields.io/github/languages/top/Drix10/twitter-tracker?style=flat-square&color=5D6D7E" alt="GitHub top language" />
</div>

## 📑 Table of Contents

- 📍 Overview
- 📦 Features
- 🔧 Prerequisites
- 💻 Installation
- ⚙️ Configuration
- 🏗️ Usage
- 🎯 Keyword Configuration
- 🛠️ Dependencies
- ⚠️ Important Notes
- 📄 License
- 👏 Authors

## 📍 Overview

This repository contains a powerful Twitter monitoring tool that automatically tracks specific Twitter accounts for new tweets and sends real-time notifications to Discord. Built with Selenium WebDriver for reliable web automation and featuring intelligent keyword filtering, this tool is perfect for staying updated on important Twitter activity.

## 📦 Features

|     | Feature                           | Description                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 🐦  | **Real-time Twitter Monitoring** | Continuously monitors specified Twitter accounts for new tweets with configurable check intervals                                          |
| 🤖  | **Selenium Web Automation**      | Uses Selenium WebDriver with Chrome for reliable Twitter scraping and login automation                                                     |
| 📢  | **Discord Integration**           | Sends rich embed notifications to Discord via webhooks with tweet content, links, and media                                               |
| 🎯  | **Smart Keyword Filtering**      | Configurable keyword-based filtering with case-insensitive matching and support for multiple keywords                                     |
| 🛡️  | **Rate Limiting Protection**     | Built-in rate limiting and anti-detection measures to prevent being blocked by Twitter                                                     |
| ⚡  | **Auto-Recovery System**         | Automatic browser refresh, login retry, and error recovery to ensure continuous monitoring                                                 |

## 🔧 Prerequisites

- **Node.js** v14 or higher
- **Chrome Browser** (for Selenium WebDriver)
- **Discord Webhook URL**
- **Twitter Account Credentials**

## 💻 Installation

### 🚀 Setup Instructions

1. **Clone and install:**
```bash
git clone https://github.com/Drix10/twitter-tracker.git
cd twitter-tracker
npm install
```

2. **Configure the application:**
```bash
cp config.example.js config.js
```

3. **Edit `config.js` with your credentials:**
   - Twitter account credentials (username, password, email)
   - Target username to monitor
   - Discord webhook URL
   - Keywords to monitor for notifications

## ⚙️ Configuration

The `config.js` file contains all the settings needed to run the tracker:

```javascript
module.exports = {
    twitter: {
        username: "your_twitter_username",
        password: "your_twitter_password", 
        email: "your_twitter_email@example.com"
    },
    monitoring: {
        targetUsername: "username_to_monitor",
        checkInterval: 10000,
        rateLimitDelay: 10000,
        keywords: ["queue", "live", "stream"],
        sendAllTweets: false
    },
    discord: {
        webhookUrl: "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"
    }
};
```

## 🎯 Keyword Configuration

The scraper offers flexible notification options based on tweet content:

### 🔍 **Keyword Monitoring (Default)**
```javascript
keywords: ["queue", "live", "stream"],
sendAllTweets: false
```

### 📨 **Send All Tweets**
```javascript
sendAllTweets: true
```

### ✨ **Advanced Keyword Examples**

**🎮 Gaming/Streaming:**
```javascript
keywords: ["live", "stream", "playing", "queue", "going live"]
```

**📰 News/Announcements:**
```javascript
keywords: ["announcement", "update", "release", "news", "breaking"]
```

**🎬 Content Creation:**
```javascript
keywords: ["new video", "just posted", "uploaded", "premiere"]
```

### 🎯 **Keyword Matching Features**
- ✅ **Case-insensitive** (`"Queue"` matches `"queue"`)
- ✅ **Partial matching** (`"live"` matches `"going live soon"`)
- ✅ **Multiple keywords** support
- ✅ **Smart filtering** (any keyword match triggers notification)

## 🏗️ Usage

### 🏃‍♂️ **Development Mode (with auto-restart):**
```bash
npm run dev
```

### 🚀 **Production Mode:**
```bash
npm start
```

## 🛠️ Dependencies

| Package | Purpose | Description |
|---------|---------|-------------|
| **selenium-webdriver** | 🤖 Web Automation | Powers the Twitter scraping and login automation |
| **axios** | 🌐 HTTP Client | Handles Discord webhook requests |
| **nodemon** | 🔄 Development | Auto-restarts the application during development |

## ⚠️ Important Notes

> **🚨 Disclaimer**: This tool is for educational purposes only. Please respect Twitter's Terms of Service and rate limits. Use responsibly and ensure you have permission to monitor the accounts you're targeting.

> **🔒 Security**: Never commit your `config.js` file with real credentials to version control. The file is included in `.gitignore` for your protection.

## 🛡️ How It Works

1. **🔐 Authentication**: Logs into Twitter using Selenium WebDriver with your credentials
2. **👀 Monitoring**: Continuously checks the specified account for new tweets
3. **🎯 Filtering**: Applies keyword filters based on your configuration
4. **📢 Notification**: Sends rich Discord notifications for matching tweets
5. **🛡️ Protection**: Implements rate limiting and anti-detection measures

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Chrome driver issues** | Make sure Chrome browser is installed |
| **Login failures** | Verify your Twitter credentials in config.js |
| **Rate limiting** | Increase the `rateLimitDelay` value |
| **Discord notifications not working** | Check your webhook URL is correct |

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👏 Authors

<div class="badges" align="center">
<img src="https://img.shields.io/badge/Developer-Drix10-red" alt="">
<img src="https://img.shields.io/badge/GitHub-Drix10-black" alt="">
<img src="https://img.shields.io/badge/Contact-Available-green" alt="">
</div>

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

**🐛 Found a bug? Open an issue!**

**💡 Have a suggestion? We'd love to hear it!**

</div> 