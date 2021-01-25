require("dotenv").config();
const { Client, PrivateKey, PublicKey } = require("@hashgraph/sdk");

const getTwitterCreds = () => ({
  token: {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  },
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY,
    secret: process.env.TWITTER_CONSUMER_SECRET,
  },
  bearerToken: process.env.TWITTER_BEARER_TOKEN,
});

const getHederaCreds = () => {
  const creds = {
    myAccountId: process.env.MY_ACCOUNT_ID,
    myPrivateKey: PrivateKey.fromString(process.env.MY_PRIVATE_KEY || ""),
    myPublicKey: PublicKey.fromString(process.env.MY_PUBLIC_KEY),
  };

  // If we weren't able to grab it, we should throw a new error
  if (creds.myAccountId == null || creds.myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }
  const client = Client.forTestnet();

  client.setOperator(creds.myAccountId, creds.myPrivateKey);

  return {
    client,
    ...creds,
  };
};

const getRandomConfig = () => ({
  mintyToken: process.env.MINTED_TOKEN,
});

module.exports = {
  getTwitterCreds,
  getHederaCreds,
  getRandomConfig,
};
