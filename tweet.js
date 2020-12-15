const needle = require("needle");
var log = require("./logger");

const util = require("util");

require("dotenv").config();

const OAuth = require("oauth");

const token = {
  key: process.env.TWITTER_ACCESS_TOKEN,
  secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};

const consumer = {
  key: process.env.TWITTER_CONSUMER_KEY,
  secret: process.env.TWITTER_CONSUMER_SECRET,
};

const bearerToken = process.env.TWITTER_BEARER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";

const verifyCredsURL =
  "https://api.twitter.com/1.1/account/verify_credentials.json";

// Edit rules as desired here below
const rules = [{ value: "from:iRunners -is:retweet" }];

const checkOAuth1Creds = async () => {
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
    console.log(oauth);
    oauth.get(
      verifyCredsURL,
      token.key, //test user token
      token.secret, //test user secret
      function (err, data, res) {
        if (err) return reject(err);
        resolve(data);
      }
    );
  });
};

const sendTweetURL = "https://api.twitter.com/1.1/statuses/update.json";

const replyToTweet = (in_reply_to_status_id) => {
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
      status: `Retweeting: Meow`,
      in_reply_to_status_id,
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

async function getAllRules() {
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

async function deleteAllRules(rules) {
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

async function setRules() {
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

const streamURL = "https://api.twitter.com/2/tweets/search/stream";

function streamConnect() {
  //Listen to the stream
  const options = {
    timeout: 20000,
  };

  const params = {
    expansions: "author_id",
    "tweet.fields": "id,text",
    "user.fields": "id,name,username",
  };

  const stream = needle.request(
    "get",
    streamURL,
    params,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
    options
  );

  return stream;
}

(async () => {
  let currentRules;

  try {
    // Gets the complete list of rules currently applied to the stream
    currentRules = await getAllRules();

    log.info(currentRules);

    // Delete all rules. Comment the line below if you want to keep your existing rules.
    await deleteAllRules(currentRules);

    // Add rules to the stream. Comment the line below if you don't want to add new rules.
    await setRules();
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }

  // Listen to the stream.
  // This reconnection logic will attempt to reconnect when a disconnection is detected.
  // To avoid rate limites, this logic implements exponential backoff, so the wait time
  // will increase if the client cannot reconnect to the stream.

  const filteredStream = streamConnect();

  filteredStream
    .on("data", (data) => {
      try {
        const json = JSON.parse(data);
        console.log(json);
        log.info("Replying to: " + json.data.id);
        replyToTweet(json);
      } catch (e) {
        console.log(e);
        // Keep alive signal received. Do nothing.
      }
    })
    .on("error", (error) => {
      if (error.code === "ETIMEDOUT") {
        stream.emit("timeout");
      }
    });

  let timeout = 0;
  filteredStream.on("timeout", () => {
    // Reconnect on error
    console.warn("A connection error occurred. Reconnecting…");
    setTimeout(() => {
      timeout++;
      streamConnect(bearerToken);
    }, 2 ** timeout);
    streamConnect(bearerToken);
  });
})();
