require("dotenv").config();
const { Client, PrivateKey, PublicKey, Hbar } = require("@hashgraph/sdk");

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
    myPublicKey: PrivateKey.fromString(process.env.MY_PRIVATE_KEY || "")
      .publicKey,
    filePrivateKey: PrivateKey.fromString(process.env.FILE_PRIVATE_KEY),
    filePublicKey: PublicKey.fromString(process.env.FILE_PUBLIC_KEY),
    fileId: process.env.FILE_ID,
  };

  // If we weren't able to grab it, we should throw a new error
  if (creds.myAccountId == null || creds.myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }
  const client = Client.forMainnet();

  client.setOperator(creds.myAccountId, creds.myPrivateKey);
  client.setMaxTransactionFee(new Hbar(20));

  return {
    client,
    ...creds,
  };
};

const getRandomConfig = () => ({
  mintyToken: process.env.MINTED_TOKEN,
  treasureHandle: process.env.TREASURE_TWITTER_HANDLE,
  ourTwitterHandle: process.env.OUR_TWITTER_HANDLE,
});

module.exports = {
  getTwitterCreds,
  getHederaCreds,
  getRandomConfig,
};
