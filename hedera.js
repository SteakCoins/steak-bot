const {
  TokenCreateTransaction,
  TokenMintTransaction,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");

const log = require("./logger");

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

async function addToToken(tokenId, amount, { client, myPrivateKey }) {
  log.info(`Minting ${amount} number of new tokens to ${tokenId}`);
  const transaction = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setAmount(amount)
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

module.exports = {
  makeToken,
  addToToken,
  getTokenTotal,
};
