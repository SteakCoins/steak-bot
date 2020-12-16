const log = require("./logger");
const {
  getTwitterCreds,
  getHederaCreds,
  getRandomConfig,
} = require("./config");

const { replyToTweet, resetRules, streamConnect } = require("./tweet");

const {
  addToToken,
  upsertTransferWithTwitterId,
  getTokenTotalForTwitterId,
} = require("./hedera");

const { mintyToken } = getRandomConfig();

const replyToData = (twitterCreds, hederaCreds, randomConfig) => async (
  data
) => {
  try {
    const tweetObj = JSON.parse(data);
    const userObj = tweetObj.includes.users.filter(
      (user) => user.id === tweetObj.data.author_id
    )[0];
    log.info(`Replying to:  ${userObj}`);
    if (userObj.username === randomConfig.treasureHandle) {
      const reply = {
        tweetId: tweetObj.data.id,
        status: "ORDER UP! Minting another 100 Tokens.",
      };
      addToToken(randomConfig.mintyToken, 100, hederaCreds);
      replyToTweet(reply, twitterCreds);
    } else {
      await upsertTransferWithTwitterId(
        userObj.id,
        1,
        randomConfig.mintyToken,
        hederaCreds
      );
      const tokenAmount =
        (await getTokenTotalForTwitterId(userObj.id, hederaCreds).get(
          randomConfig.mintyToken
        ).low) || 0;

      const reply = {
        tweetId: tweetObj.data.id,
        status: `Thanks for your order! You now have ${tokenAmount} Steaks!`,
      };
    }
    log.info(json);
    log.info(json.includes.users);

    // addToToken(randomConfig.mintyToken, 100, hederaCreds);
    // replyToTweet(reply, twitterCreds);
  } catch (e) {
    // Keep alive signal received. Do nothing.
  }
};

(async () => {
  const randomConfig = getRandomConfig();

  const rules = [
    { value: `from:${randomConfig.treasureHandle} -is:retweet` },
    { value: `@${randomConfig.ourTwitterHandle} -is:retweet` },
  ];

  console.log(rules);

  const twitterCreds = getTwitterCreds();
  const hederaCreds = getHederaCreds();

  resetRules(rules, twitterCreds);

  const filteredStream = streamConnect(twitterCreds);

  filteredStream
    .on("data", replyToData(twitterCreds, hederaCreds, randomConfig))
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
