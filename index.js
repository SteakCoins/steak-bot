const log = require("./logger");
const {
  getTwitterCreds,
  getHederaCreds,
  getRandomConfig,
} = require("./config");

const { replyToTweet, resetRules, streamConnect } = require("./tweet");

const { addToToken } = require("./hedera");

const rules = [{ value: "from:iRunners -is:retweet" }];

const replyToData = (twitterCreds, hederaCreds) => (data) => {
  const { mintyToken } = getRandomConfig();
  try {
    const json = JSON.parse(data);
    log.info("Replying to: " + json.data.id);

    const reply = {
      tweetId: json.data.id,
      status: "Retweet!",
    };
    addToToken(mintyToken, 100, hederaCreds);
    replyToTweet(reply, twitterCreds);
  } catch (e) {
    // Keep alive signal received. Do nothing.
  }
};

(async () => {
  const twitterCreds = getTwitterCreds();
  const hederaCreds = getHederaCreds();

  resetRules(rules, twitterCreds);

  const filteredStream = streamConnect(twitterCreds);

  filteredStream
    .on("data", replyToData(twitterCreds, hederaCreds))
    .on("error", (error) => {
      if (error.code === "ETIMEDOUT") {
        stream.emit("timeout");
      }
    });

  let timeout = 0;
  filteredStream.on("timeout", () => {
    // Reconnect on error
    log.warn("A connection error occurred. Reconnecting…");
    setTimeout(() => {
      timeout++;
      streamConnect(twitterCreds);
    }, 2 ** timeout);
    streamConnect(twitterCreds);
  });
})();
