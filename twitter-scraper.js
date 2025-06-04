const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const axios = require("axios");
const config = require("./config");

const TWITTER_USERNAME = config.monitoring.targetUsername;
const TWITTER_URL = `https://x.com/${TWITTER_USERNAME}`;
const DISCORD_WEBHOOK_URL = config.discord.webhookUrl;

class TwitterScraper {
    constructor() {
        this.driver = null;
        this.lastTweetId = null;
        this.CHECK_INTERVAL = config.monitoring.checkInterval;
        this.RATE_LIMIT_DELAY = config.monitoring.rateLimitDelay;
        this.lastRequestTime = 0;
        this.consecutiveFailures = 0;
        this.lastSuccessfulCheck = Date.now();
        this.browserStartTime = null;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomUserAgent() {
        const userAgents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    async checkRateLimit() {
        const now = Date.now();
        if (now - this.lastRequestTime < this.RATE_LIMIT_DELAY) {
            const waitTime = this.RATE_LIMIT_DELAY - (now - this.lastRequestTime);
            console.log(`Rate limit: Waiting ${waitTime / 1000} seconds before next request`);
            await this.sleep(waitTime);
        }
        this.lastRequestTime = now;
    }

    async init() {
        try {
            if (!this.driver) {
                let options = new chrome.Options();
                options.addArguments(
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--window-size=1920,1080",
                    "--disable-notifications",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--disable-web-security",
                    "--disable-features=VizDisplayCompositor",
                    "--start-maximized",
                    "--disable-popup-blocking",
                    "--disable-blink-features=AutomationControlled",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-extensions-file-access-check",
                    "--disable-extensions",
                    "--disable-plugins-discovery",
                    `--user-agent=${this.getRandomUserAgent()}`
                );

                options.setUserPreferences({
                    "profile.default_content_setting_values.notifications": 2,
                    "profile.managed_default_content_settings.images": 2
                });

                this.driver = await new Builder()
                    .forBrowser("chrome")
                    .setChromeOptions(options)
                    .build();

                await this.driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
                this.browserStartTime = Date.now();
            }
            await this.login();
        } catch (error) {
            console.error("Failed to initialize:", error);
            await this.cleanup();
            throw error;
        }
    }

    async shouldRefreshBrowser() {
        const browserAge = Date.now() - this.browserStartTime;
        const timeSinceLastSuccess = Date.now() - this.lastSuccessfulCheck;

        return (browserAge > 2 * 60 * 60 * 1000) ||
            (this.consecutiveFailures >= 5) ||
            (timeSinceLastSuccess > 30 * 60 * 1000);
    }

    async refreshBrowser() {
        console.log("Refreshing browser session to prevent issues...");
        await this.cleanup();
        await this.sleep(5000);
        await this.init();
        this.consecutiveFailures = 0;
    }

    async login() {
        try {
            await this.driver.get("https://x.com/login");

            console.log("Looking for username field...");
            const usernameInput = await this.driver.wait(
                until.elementLocated(By.css('input[autocomplete="username"]')),
                60000
            );
            await this.driver.wait(until.elementIsVisible(usernameInput), 60000);
            await this.driver.wait(until.elementIsEnabled(usernameInput), 60000);
            await usernameInput.sendKeys(config.twitter.username, Key.RETURN);
            console.log("Username entered");
            await this.sleep(3000);

            console.log("Checking for email verification...");
            try {
                const emailInput = await this.driver.wait(
                    until.elementLocated(
                        By.css('input[type="text"], input[type="email"]')
                    ),
                    10000
                );
                await this.driver.wait(until.elementIsVisible(emailInput), 10000);
                await this.driver.wait(until.elementIsEnabled(emailInput), 10000);

                if (!config.twitter.email) {
                    throw new Error("Email verification required but not configured");
                }
                await emailInput.sendKeys(config.twitter.email, Key.RETURN);
                console.log("Email entered");
                await this.sleep(3000);
            } catch (emailError) {
                if (emailError.name === "TimeoutError") {
                    console.log("Email verification not required.");
                } else {
                    throw emailError;
                }
            }

            console.log("Looking for password field...");
            const passwordInput = await this.driver.wait(
                until.elementLocated(By.css('input[type="password"]')),
                60000
            );
            await this.driver.wait(until.elementIsVisible(passwordInput), 60000);
            await this.driver.wait(until.elementIsEnabled(passwordInput), 60000);
            await passwordInput.sendKeys(config.twitter.password, Key.RETURN);
            console.log("Password entered");
            await this.sleep(5000);

            try {
                await this.driver.wait(async () => {
                    try {
                        const urlMatches = await until
                            .urlMatches(/x\.com\/(home|explore)/)
                            .fn(this.driver);
                        if (urlMatches) return true;

                        const elementLocated = await until
                            .elementLocated(By.css('[data-testid="AppTabBar_Home_Link"]'))
                            .fn(this.driver);
                        if (elementLocated) return true;

                        return false;
                    } catch (e) {
                        if (
                            e.name === "StaleElementReferenceError" ||
                            e.name === "NoSuchElementError"
                        ) {
                            return false;
                        }
                        throw e;
                    }
                }, 60000);
                console.log("Login successful");
            } catch (loginCheckError) {
                console.error("Login verification failed:", loginCheckError);
                await this.driver.takeScreenshot().then((image) => {
                    require("fs").writeFileSync("login-error.png", image, "base64");
                });
                throw new Error("Login failed - could not verify successful login");
            }

            console.log("Rechecking for email verification...");
            try {
                const emailInput = await this.driver.wait(
                    until.elementLocated(
                        By.css('input[type="text"], input[type="email"]')
                    ),
                    10000
                );
                await this.driver.wait(until.elementIsVisible(emailInput), 10000);
                await this.driver.wait(until.elementIsEnabled(emailInput), 10000);

                if (!config.twitter.email) {
                    throw new Error("Email verification required but not configured");
                }
                await emailInput.sendKeys(config.twitter.email, Key.RETURN);
                console.log("Email entered");
                await this.sleep(3000);
            } catch (emailError) {
                if (emailError.name === "TimeoutError") {
                    console.log("Email verification not required.");
                } else {
                    throw emailError;
                }
            }
        } catch (error) {
            console.error("Login failed:", error);
            await this.driver.takeScreenshot().then((image) => {
                require("fs").writeFileSync("login-error.png", image, "base64");
            });
            throw error;
        }
    }

    async getLatestTweet(retryCount = 0) {
        const maxRetries = 3;
        try {
            await this.checkRateLimit();
            console.log(`Navigating to ${TWITTER_URL}...`);

            const randomDelay = Math.floor(Math.random() * 2000) + 1000;
            await this.sleep(randomDelay);

            await this.driver.get(TWITTER_URL);
            await this.sleep(5000);

            try {
                await this.driver.wait(
                    until.elementLocated(By.css('[data-testid="AppTabBar_Home_Link"], [data-testid="SideNav_AccountSwitcher_Button"]')),
                    10000
                );
            } catch (authError) {
                console.log("Authentication may have expired, attempting re-login...");
                await this.login();
                await this.sleep(3000);
                return this.getLatestTweet(retryCount + 1);
            }

            try {
                await this.driver.wait(
                    until.elementLocated(By.css('[data-testid="primaryColumn"], [data-testid="cellInnerDiv"]')),
                    8000
                );
            } catch (pageError) {
                console.log("Page structure not loaded properly - refreshing page...");
                await this.driver.navigate().refresh();
                await this.sleep(3000);
                if (retryCount < maxRetries) {
                    return this.getLatestTweet(retryCount + 1);
                }
                throw new Error("Page structure not available after refresh");
            }

            let tweetElement = null;
            try {
                console.log("Quick check for any tweets...");
                await this.driver.wait(
                    until.elementLocated(By.css('article[data-testid="tweet"], [role="article"]')),
                    10000
                );

                const tweetSelectors = [
                    '[data-testid="cellInnerDiv"] > div > div > article[data-testid="tweet"]',
                    'article[data-testid="tweet"]',
                    '[data-testid="tweet"]',
                    '[data-testid="cellInnerDiv"] article',
                    'div[data-testid="primaryColumn"] article',
                    '[role="article"]'
                ];

                for (const selector of tweetSelectors) {
                    try {
                        console.log(`Trying selector: ${selector}`);
                        tweetElement = await this.driver.findElement(By.css(selector));
                        console.log(`Found tweet with selector: ${selector}`);
                        break;
                    } catch (selectorError) {
                        continue;
                    }
                }
            } catch (quickCheckError) {
                console.log("No tweets detected - restarting browser and re-login...");
                await this.refreshBrowser();
                if (retryCount < maxRetries) {
                    return this.getLatestTweet(retryCount + 1);
                }
                throw new Error("No tweets found after browser restart");
            }

            if (!tweetElement) {
                console.log("No tweet elements found - restarting browser and re-login...");
                await this.refreshBrowser();
                if (retryCount < maxRetries) {
                    return this.getLatestTweet(retryCount + 1);
                }
                throw new Error("No tweet elements found after browser restart");
            }

            const tweetData = await this.extractTweetData(tweetElement);
            return tweetData;
        } catch (error) {
            console.error(`Error getting latest tweet (attempt ${retryCount + 1}):`, error.message);

            if (retryCount < maxRetries) {
                console.log(`Retrying in 30 seconds... (${retryCount + 1}/${maxRetries})`);
                await this.sleep(30000);
                return this.getLatestTweet(retryCount + 1);
            }

            return null;
        }
    }

    async extractTweetData(tweetElement) {
        try {
            let quotedTweetText = "";
            try {
                const quoteTweet = await tweetElement.findElement(
                    By.xpath('.//*[contains(@href, "/status/")]/ancestor::div[4]')
                );
                quotedTweetText = await quoteTweet
                    .findElement(By.css('[data-testid="tweetText"]'))
                    .getText();
            } catch (quoteError) { }

            let tweetText = "";
            try {
                tweetText = await tweetElement
                    .findElement(By.css('[data-testid="tweetText"]'))
                    .getText();
            } catch (textError) { }

            if (quotedTweetText) {
                tweetText = `${tweetText}\n\nQuoted Tweet:\n${quotedTweetText}`;
            }

            let links = [];
            try {
                const linkElements = await tweetElement.findElements(By.tagName("a"));
                for (const linkElement of linkElements) {
                    const href = await linkElement.getAttribute("href");
                    links.push(href);
                }
            } catch (e) { }

            let images = [];
            try {
                const imageElements = await tweetElement.findElements(
                    By.css('[data-testid="tweetPhoto"] img')
                );
                for (const img of imageElements) {
                    images.push(await img.getAttribute("src"));
                }
            } catch (imageError) { }

            let videos = [];
            try {
                const videoElements = await tweetElement.findElements(
                    By.css("video")
                );
                for (const video of videoElements) {
                    videos.push(await video.getAttribute("src"));
                }
            } catch (videoError) { }

            let url = "";
            try {
                url = await tweetElement
                    .findElement(By.xpath('.//a[contains(@href, "/status/")]'))
                    .getAttribute("href");
            } catch (urlError) { }

            let timestamp = "";
            try {
                timestamp = await tweetElement
                    .findElement(By.tagName("time"))
                    .getAttribute("datetime");
            } catch (timeError) { }

            const tweetId = url ? url.split("/status/")[1]?.split("?")[0] : "";

            console.log(`Extracted tweet data:`, {
                id: tweetId,
                text: tweetText.substring(0, 100) + "...",
                url: url,
                mediaCount: images.length + videos.length
            });

            return {
                id: tweetId,
                text: tweetText,
                url: url,
                links: links,
                images: images,
                videos: videos,
                timestamp: timestamp
            };
        } catch (error) {
            console.error("Error extracting tweet data:", error);
            return null;
        }
    }

    shouldSendTweet(tweetText) {
        if (config.monitoring.sendAllTweets) {
            return { send: true, reason: "sendAllTweets enabled" };
        }

        if (!config.monitoring.keywords || config.monitoring.keywords.length === 0) {
            return { send: false, reason: "no keywords configured" };
        }

        const tweetTextLower = tweetText.toLowerCase();
        const matchedKeywords = config.monitoring.keywords.filter(keyword =>
            tweetTextLower.includes(keyword.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
            return {
                send: true,
                reason: `contains keywords: ${matchedKeywords.join(', ')}`
            };
        }

        return {
            send: false,
            reason: `no matching keywords (looking for: ${config.monitoring.keywords.join(', ')})`
        };
    }

    async sendToDiscord(tweet) {
        try {
            const embed = {
                title: `🐦 New tweet from @${TWITTER_USERNAME}`,
                url: tweet.url,
                description: tweet.text || "No text content",
                color: 0x1DA1F2,
                footer: {
                    text: "Twitter Monitor • " + new Date().toLocaleString()
                }
            };

            if (tweet.images && tweet.images.length > 0) {
                embed.image = { url: tweet.images[0] };
                if (tweet.images.length > 1) {
                    embed.footer.text += ` • ${tweet.images.length} images`;
                }
            }

            if (tweet.videos && tweet.videos.length > 0) {
                embed.footer.text += ` • ${tweet.videos.length} videos`;
            }

            if (tweet.timestamp) {
                embed.timestamp = tweet.timestamp;
            }

            const payload = {
                embeds: [embed]
            };

            const response = await axios.post(DISCORD_WEBHOOK_URL, payload, {
                timeout: 10000
            });

            if (response.status === 204) {
                console.log("Discord webhook sent successfully!");
                return true;
            } else {
                console.log(`Failed to send webhook: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error("Error sending to Discord:", error.message);
            return false;
        }
    }

    async startMonitoring() {
        console.log(`Starting Twitter Monitor for @${TWITTER_USERNAME}`);
        console.log(`Check interval: ${this.CHECK_INTERVAL / 1000} seconds`);
        console.log(`Target: ${TWITTER_URL}`);
        console.log(`Discord webhook configured`);

        if (config.monitoring.sendAllTweets) {
            console.log(`Notification mode: ALL TWEETS`);
        } else if (config.monitoring.keywords && config.monitoring.keywords.length > 0) {
            console.log(`Keywords to monitor: ${config.monitoring.keywords.join(', ')}`);
        } else {
            console.log(`⚠️  WARNING: No keywords configured and sendAllTweets is false - no notifications will be sent!`);
        }
        console.log();

        try {
            await this.init();
            await this.sleep(2000);

            console.log("Getting initial tweet for baseline...");
            const initialTweet = await this.getLatestTweet();

            if (initialTweet && initialTweet.id) {
                this.lastTweetId = initialTweet.id;
                console.log(`Baseline set. Latest tweet ID: ${initialTweet.id}`);
                console.log(`Content preview: ${initialTweet.text.substring(0, 80)}...`);
            } else {
                console.log("Could not get initial tweet, starting without baseline");
            }

            console.log(`\nStarting monitoring loop...\n`);

            let checkCount = 0;
            while (true) {
                try {
                    checkCount++;
                    console.log(`\nCheck #${checkCount} - ${new Date().toLocaleTimeString()}`);

                    if (await this.shouldRefreshBrowser()) {
                        await this.refreshBrowser();
                    }

                    const tweet = await this.getLatestTweet();

                    if (!tweet) {
                        console.log("No tweet data retrieved");
                        this.consecutiveFailures++;
                    } else if (!tweet.id) {
                        console.log("Tweet found but no ID extracted");
                        this.consecutiveFailures++;
                    } else if (tweet.id === this.lastTweetId) {
                        console.log(`No new tweets (latest: ${tweet.id})`);
                        this.consecutiveFailures = 0;
                        this.lastSuccessfulCheck = Date.now();
                    } else {
                        console.log(`\nNEW TWEET DETECTED!`);
                        console.log(`Tweet ID: ${tweet.id}`);
                        console.log(`Content: ${tweet.text}`);
                        console.log(`URL: ${tweet.url}`);
                        console.log(`Media: ${tweet.images.length} images, ${tweet.videos.length} videos\n`);

                        const shouldSendTweet = this.shouldSendTweet(tweet.text);

                        if (shouldSendTweet.send) {
                            console.log(`Tweet matches criteria (${shouldSendTweet.reason}) - sending notification!`);
                            const sent = await this.sendToDiscord(tweet);
                            if (sent) {
                                console.log("Notification sent to Discord successfully");
                            } else {
                                console.log("Failed to send notification to Discord");
                            }
                        } else {
                            console.log(`Tweet does not match criteria (${shouldSendTweet.reason}) - skipping notification`);
                        }

                        this.lastTweetId = tweet.id;
                        console.log("Tweet ID updated");
                        this.consecutiveFailures = 0;
                        this.lastSuccessfulCheck = Date.now();
                    }
                } catch (error) {
                    console.error(`Error during check #${checkCount}:`, error.message);
                    this.consecutiveFailures++;
                }

                let waitTime = this.CHECK_INTERVAL;
                if (this.consecutiveFailures > 3) {
                    waitTime = Math.min(this.CHECK_INTERVAL * 2, 60000);
                    console.log(`Increased wait time due to consecutive failures: ${waitTime / 1000} seconds`);
                }

                console.log(`Waiting ${waitTime / 1000} seconds...`);
                await this.sleep(waitTime);
            }
        } catch (error) {
            console.error("Fatal error in monitoring:", error);
            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.driver) {
                await this.driver.quit();
                console.log("Browser cleanup completed");
            }
        } catch (error) {
            console.error("Failed to clean up:", error);
        } finally {
            this.driver = null;
        }
    }
}

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    if (scraper) {
        await scraper.cleanup();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...');
    if (scraper) {
        await scraper.cleanup();
    }
    process.exit(0);
});

const scraper = new TwitterScraper();
scraper.startMonitoring().catch(async (error) => {
    console.error("Fatal error:", error);
    await scraper.cleanup();
    process.exit(1);
}); 
