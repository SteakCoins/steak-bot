const needle = require("needle");
const OAuth = require("oauth");

var log = require("./logger")(module);

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const sendTweetURL = "https://api.twitter.com/1.1/statuses/update.json";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";

const directMessageURL =
  "https://api.twitter.com/1.1/direct_messages/events/new.json";

const sendDirectMessage = ({ twitterId, message }, { token, consumer }) => {
  log.info(`Sending direct messge to twiiter id ${twitterId}`);
  return new Promise((resolve, reject) => {
    const oauth = new OAuth.OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumer.key,
      consumer.secret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

    const params = {
      type: "message_create",
      message_create: {
        target: {
          recipient_id: twitterId,
        },
        message_data: {
          text: message,
        },
      },
    };

    oauth.post(
      directMessageURL,
      token.key, //test user token
      token.secret, //test user secret
      params,
      function (err, data, res) {
        if (err) {
          console.log("yeah... no prems");
          log.error(err);
          return reject(err);
        }
        log.info(data);
        resolve(data);
      }
    );
  });
};

const replyToTweet = ({ tweetId, status }, { token, consumer }) => {
  log.info(`Replaying ${status} to tweet with id: ${tweetId}!`);
  return new Promise((resolve, reject) => {
    const oauth = new OAuth.OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumer.key,
      consumer.secret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

    const params = {
      status,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true,
    };

    oauth.post(
      sendTweetURL,
      token.key, //test user token
      token.secret, //test user secret
      params,
      function (err, data, res) {
        if (err) {
          log.error(err);
          return reject(err);
        }
        log.info(data);
        resolve(data);
      }
    );
  });
};

const retweetAndTweet = async ({ tweetId, status }, { token, consumer }) => {
  log.info(`Retweeting tweet with id: ${tweetId}!`);
  await new Promise((resolve, reject) => {
    const oauth = new OAuth.OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumer.key,
      consumer.secret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

    const params = {
      id: tweetId,
    };

    oauth.post(
      `https://api.twitter.com/1.1/statuses/retweet/${tweetId}.json`,
      token.key, //test user token
      token.secret, //test user secret
      params,
      function (err, data, res) {
        if (err) {
          log.error(err);
          return reject(err);
        }
        log.info(data);
        resolve(data);
      }
    );
  });

  log.info(`Tweeting status: ${status}`);
  return await new Promise((resolve, reject) => {
    const oauth = new OAuth.OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      consumer.key,
      consumer.secret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

    const params = {
      status,
      auto_populate_reply_metadata: true,
    };

    oauth.post(
      sendTweetURL,
      token.key, //test user token
      token.secret, //test user secret
      params,
      function (err, data, res) {
        if (err) {
          log.error(err);
          return reject(err);
        }
        log.info(data);
        resolve(data);
      }
    );
  });
};

async function getAllRules({ bearerToken }) {
  const response = await needle("get", rulesURL, {
    headers: {
      authorization: `Bearer ${bearerToken}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
    return null;
  }

  return response.body;
}

async function deleteAllRules(rules, { bearerToken }) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bearerToken}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
    return null;
  }

  return response.body;
}

async function setRules(rules, { bearerToken }) {
  const data = {
    add: rules,
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${bearerToken}`,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(response.body);
    return null;
  }

  return response.body;
}

function streamConnect({ bearerToken }) {
  log.info("Connecting to stream...");

  const params = {
    expansions: "author_id",
    "tweet.fields": "id,text",
    "user.fields": "id,name,username",
  };

  const stream = needle.request("get", streamURL, params, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
    timeout: 20000,
  });

  return stream;
}

async function resetRules(rules, twitterCreds) {
  log.info("Reseting filtered Stream rules...");
  let currentRules;

  try {
    // Gets the complete list of rules currently applied to the stream
    currentRules = await getAllRules(twitterCreds);

    // Delete all rules. Comment the line below if you want to keep your existing rules.
    await deleteAllRules(currentRules, twitterCreds);

    // Add rules to the stream. Comment the line below if you don't want to add new rules.
    await setRules(rules, twitterCreds);
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
}

module.exports = {
  replyToTweet,
  getAllRules,
  deleteAllRules,
  setRules,
  resetRules,
  streamConnect,
  retweetAndTweet,
  sendDirectMessage,
};
