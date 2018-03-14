/**
 * Redditogram Lite (2018)
 * 
 * A Reddit (posts) ➡️ Telegram bridge
 * 
 * Mohammed Sohail <sohailsameja@gmail.com>
 * Released under the AGPL-3.0 License
 */


// npm-installed modules
const _ = require("lodash");
const Emitter = require("tiny-emitter");
const RedditStream = require("reddit-stream");
const request = require("request-promise");
const TelegramBot = require("node-telegram-bot-api");


// env variables
const telegramChannel = process.env.TELEGRAM_TOKEN;
const telegramToken = process.env.TELEGRAM_TOKEN;
const subReddit = process.env.SUBREDDIT;


// module variables
const bot = new TelegramBot(telegramToken);

const reddit = new Emitter();

const subRedditStream = new RedditStream("posts", subReddit);


// core
subRedditStream.start();

subRedditStream.on("new", (posts) => {
    return _.forEach(posts, (post) => {
        const latestPost = post.data;

        if (latestPost.post_hint === "image") {
            return reddit.emit("image", latestPost.title, latestPost.author, `redd.it/${latestPost.id}`, latestPost.preview.images[0].source.url);
        } else if (latestPost.domain === `self.${latestPost.subreddit}`) {
            return reddit.emit("self", latestPost.title, latestPost.author, `redd.it/${latestPost.id}`, latestPost.selftext);
        } else {
            return reddit.emit("link", latestPost.title, latestPost.author, `redd.it/${latestPost.id}`, latestPost.url);
        }
    });
});

subRedditStream.on("error", (error) => {
    return console.error(error);
});

reddit.on("image", (title, author, link, source) => {
    const reEncodedUrl = source.replace(/&amp;/g, "&");

    return bot.sendPhoto(telegramChannel, request(reEncodedUrl), {
        caption: `ℹ️ ${title}\n🌐 ${link}\n👤 ${author}\n🏡 r/${subReddit}`,
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [[{ text: '✏️ Comment', url: link }]]
        }
    })
    .then(() => { return console.log("sendPhoto:image"); })
    .catch((e) => { return console.error(`${e.response.body.error_code}:${e.response.body.description}`); });   
});

reddit.on("self", (title, author, link, source) => {
    return bot.sendMessage(telegramChannel, `ℹ️ ${title}\n🌐 <a href="https://${link}">discussion</a>\n👤 ${author}\n🏡 r/${subReddit}\n\n<code>${source}</code>`, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [[{ text: '✏️ Comment',url: link }]]
        }
    })
    .then(() => { return console.log("sendMessage:self"); })
    .catch((e) => { return console.error(`${e.response.body.error_code}:${e.response.body.description}`); });    
});

reddit.on("link", (title, author, link, source) => {
    return bot.sendMessage(telegramChannel, `ℹ️ ${title}\n🌐 [source](${source}) / [discussion](${link})\n👤 ${author}\n🏡 r/${subReddit}`, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [[{ text: '✏️ Comment', url: link}, {text: '📡 Link', url: source }]]
        }
    })
    .then(() => { return console.log("sendMessage:link"); })
    .catch((e) => { return console.error(`${e.response.body.error_code}:${e.response.body.description}`); });
});