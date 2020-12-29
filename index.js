const log = require("./logger")(module);
const {
  getTwitterCreds,
  getHederaCreds,
  getRandomConfig,
} = require("./config");

const {
  replyToTweet,
  retweetAndTweet,
  resetRules,
  streamConnect,
} = require("./tweet");

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
    log.info(tweetObj);

    if (tweetObj.errors) {
      log.info(
        "Twitter Stream has been set into error. Restart service needed."
      );
      process.exit(1);
    }

    const userObj = tweetObj?.includes?.users?.filter(
      (user) => user.id === tweetObj.data.author_id
    )[0];

    // log.info(`Replying to:  ${userObj.username}`);
    if (userObj.username === randomConfig.treasureHandle) {
      log.info(`The treasurer has spoken! Minting new steaks and retweeting!`);

      const reply = {
        tweetId: tweetObj.data.id,
        status: `MEAT abound 100 new steaks have been added to the supply! #makingsteaks #steakbackedtokens https://explorer.kabuto.sh/mainnet/id/${randomConfig.mintyToken}`,
      };
      addToToken(randomConfig.mintyToken, 100, hederaCreds);
      retweetAndTweet(reply, twitterCreds);

      return;
    }

    if (
      tweetObj?.data?.text
        ?.toLowerCase()
        .includes(`@${randomConfig.ourTwitterHandle.toLowerCase()}`)
    ) {
      log.info(
        `Someone has tweeted at us! Transfering the token and replying.`
      );
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
      log.info(`${userObj.username} has ${token}`);

      const reply = {
        tweetId: tweetObj.data.id,
        status: `Thanks for your order @${userObj.username}! You now have ${token} Steaks! (Out of ${tokenTotal}) ~ https://explorer.kabuto.sh/mainnet/id/${user.hederaId}`,
      };

      log.info(`Replying with message: ${reply.status}`);
      replyToTweet(reply, twitterCreds);
      return;
    }

    log.info(
      `Someone tweeting or retweeted at ${randomConfig.treasureHandle} -- they get tokens!`
    );
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
    log.info(`${userObj.username} has ${token}`);

    const reply = {
      tweetId: tweetObj.data.id,
      status: `Thanks for your order @${userObj.username}! You now have ${token} Steaks! (Out of ${tokenTotal}) ~ https://explorer.kabuto.sh/mainnet/id/${user.hederaId}`,
    };
    if (token % 5 === 0) {
      log.info(`Replying with message: ${reply.status}`);
      replyToTweet(reply, twitterCreds);
    }
  } catch (err) {
    log.debug(err);
    // Keep alive signal received. Do nothing.
    if (err.name !== `SyntaxError`) {
      log.error(err);
      process.exit(1);
    } else {
      log.info("Keep alive...");
    }
  }
};

(async () => {
  const randomConfig = getRandomConfig();

  const rules = [
    { value: `from:${randomConfig.treasureHandle} -is:retweet` },
    { value: `to:${randomConfig.treasureHandle}` },
    { value: `@${randomConfig.ourTwitterHandle} -is:retweet` },
  ];

  log.info(rules);

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
