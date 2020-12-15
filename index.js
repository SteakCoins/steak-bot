const {
  Client,
  PrivateKey,
  PublicKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenId,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

const adminPublicKey = "holy-moly-this-is-a-key-3IP";

async function makeToken(
  tokenName,
  tokenSymbol,
  { client, myPrivateKey, myPublicKey, myAccountId }
) {
  //Create a token

  const transaction = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTreasuryAccountId(myAccountId)
    .setInitialSupply(5000)
    .setAdminKey(myPublicKey)
    .setSupplyKey(myPublicKey)
    .setWipeKey(myPublicKey)
    .setFreezeKey(myPublicKey)
    .freezeWith(client);

  //Sign the transaction with the token adminKey and the token treasury account private key
  const signTx = await (await transaction.sign(myPrivateKey)).sign(
    myPrivateKey
  );

  //Sign the transaction with the client operator private key and submit to a Hedera network

  const txResponse = await transaction.execute(client);

  //Get the receipt of the the transaction

  const receipt = await txResponse.getReceipt(client);

  //Get the token ID from the receipt

  const tokenId = receipt.tokenId;

  console.log("The new token ID is " + tokenId);

  return tokenId;
}

async function addToToken(tokenId, { client, myPrivateKey }) {
  console.log(tokenId);
  const transaction = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setAmount(100)
    .freezeWith(client);

  const signTx = await transaction.sign(myPrivateKey);

  //Submit the transaction to a Hedera network
  const txResponse = await signTx.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the transaction consensus status
  const transactionStatus = receipt.status;

  console.log(
    "The transaction consensus status " + transactionStatus.toString()
  );
}

async function getTokenTotal(accountId, { client }) {
  const query = new AccountBalanceQuery().setAccountId(accountId);

  //Sign with the client operator private key and submit to a Hedera network
  const tokenBalance = await query.execute(client);

  console.log("The token balance(s) for this account: " + tokenBalance.tokens);

  return tokenBalance;
}

async function main() {
  //Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = process.env.MY_ACCOUNT_ID;
  const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY || "");
  const myPublicKey = PublicKey.fromString(process.env.MY_PUBLIC_KEY);

  // If we weren't able to grab it, we should throw a new error
  if (myAccountId == null || myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }
  const client = Client.forTestnet();

  client.setOperator(myAccountId, myPrivateKey);
  console.log("DONE!");

  // const tokenId = await makeToken("Can we make steaks?", "MAKING STEAKS", {
  //   client,
  //   myPrivateKey,
  //   myPublicKey,
  //   myAccountId,
  // });

  // const tokenId = TokenId.fromString("0.0.145335");

  const tokenId = "0.0.145335";

  // await addToToken(tokenId, { client, myPrivateKey });

  const balance = await getTokenTotal(tokenId, { client });
}
main();
