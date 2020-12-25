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
  getTokenSupply,
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
    log.info(`Replying to:  ${userObj.username}`);
    if (userObj.username === randomConfig.treasureHandle) {
      const reply = {
        tweetId: tweetObj.data.id,
        status: "ORDER UP! Minting another 100 Tokens.",
      };
      addToToken(randomConfig.mintyToken, 100, hederaCreds);
      replyToTweet(reply, twitterCreds);
    } else {
      log.info(`Transfering the moneys`);
      const user = await upsertTransferWithTwitterId(
        userObj.id,
        1,
        randomConfig.mintyToken,
        hederaCreds
      );

      const tokens = await getTokenTotalForTwitterId(userObj.id, hederaCreds);
      const tokenTotal = await getTokenSupply(
        randomConfig.mintyToken,
        hederaCreds
      );
      const token = tokens[randomConfig.mintyToken];
      console.info(`${userObj.username} has ${token}`);

      const reply = {
        tweetId: tweetObj.data.id,
        status: `Thanks for your order @${userObj.username}! You now have ${token} Steaks! (Out of ${tokenTotal}) ~ ${user.hederaId}`,
      };

      log.info(`Replying with message: ${reply.status}`);
      replyToTweet(reply, twitterCreds);
    }
  } catch (err) {
    // console.log(err);
    // Keep alive signal received. Do nothing.
    if (err.name !== `SyntaxError`) {
      console.error(err);
    } else {
      console.log("Keep alive...");
    }
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

  filteredStream.on(
    "data",
    replyToData(twitterCreds, hederaCreds, randomConfig)
  );
  filteredStream.on("error", (error) => {
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

const express = require("express");
const app = express();
const port = process.env.PORT || 80;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
