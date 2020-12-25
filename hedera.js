const {
  Hbar,
  TokenCreateTransaction,
  TokenMintTransaction,
  AccountBalanceQuery,
  TransferTransaction,
  FileCreateTransaction,
  FileContentsQuery,
  FileAppendTransaction,
  PrivateKey,
  AccountCreateTransaction,
  TokenAssociateTransaction,
} = require("@hashgraph/sdk");
const CryptoJS = require("crypto-js");

const log = require("./logger");

const publicKeyPrefix = "302a300506032b6570032100";

function generateKeys() {
  const privateKey = PrivateKey.generate();
  const publicKey = privateKey.publicKey;

  return {
    privateKey,
    publicKey,
  };
}

async function createNewAccount({ client }) {
  const { privateKey } = generateKeys();

  //Create the transaction
  const transaction = new AccountCreateTransaction().setKey(
    privateKey.publicKey
  );

  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txResponse = await transaction.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the account ID
  const newAccountId = receipt.accountId;

  log.info(`Created user: ${newAccountId}`);

  return {
    accountId: newAccountId,
    privateKey,
  };
}

async function associateTokenToAccount(
  mintyToken,
  { accountId, privateKey },
  { client }
) {
  //Associate a token to an account and freeze the unsigned transaction for signing
  const transaction = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([mintyToken])
    .freezeWith(client);

  //Sign with the private key of the account that is being associated to a token
  const signTx = await transaction.sign(privateKey);

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

async function createAndWriteUser(twitterId, mintyToken, hederaCreds) {
  log.info(`Creating hedera wallet for user...`);
  const user = await createNewAccount(hederaCreds);
  log.info(`Associating token to wallet...`);
  await associateTokenToAccount(mintyToken, user, hederaCreds);
  const userObject = {
    hederaId: user.accountId.toString(),
    privateKey: user.privateKey.toString(),
    twitterId,
  };

  const lineItem = generateFileLineFromUserAccount(
    userObject,
    hederaCreds.filePrivateKey.toString()
  );

  log.info(`appending user to user file...`);
  await appendToFile(lineItem, hederaCreds);

  const users = await getUserTableFromFile(hederaCreds);

  return users[twitterId];
}

async function upsertTransferWithTwitterId(
  twitterId,
  amount,
  mintyToken,
  hederaCreds
) {
  log.info(`Upserting for ${twitterId}`);
  const userTable = await getUserTableFromFile(hederaCreds);

  let user = userTable[twitterId];
  if (!user) {
    log.info(`${twitterId} was not found. Creating account.`);
    // Create user and write to file
    user = await createAndWriteUser(twitterId, mintyToken, hederaCreds);
  }

  await transferTokens(mintyToken, amount, user.hederaId, hederaCreds);
}

async function createFile({ filePublicKey, filePrivateKey }, { client }) {
  //Create the transaction
  const transaction = await new FileCreateTransaction()
    .setKeys([filePublicKey]) //A different key then the client operator key
    .setContents("")
    .setMaxTransactionFee(new Hbar(200))
    .freezeWith(client);

  //Sign with the file private key
  const signTx = await transaction.sign(filePrivateKey);

  //Sign with the client operator private key and submit to a Hedera network
  const submitTx = await signTx.execute(client);

  //Request the receipt
  const receipt = await submitTx.getReceipt(client);

  //Get the file ID
  const newFileId = receipt.fileId;

  return newFileId;
}

async function getFileContents({ client, fileId }) {
  //Create the query
  const query = new FileContentsQuery().setFileId(fileId);

  //Sign with client operator private key and submit the query to a Hedera network
  const contents = await query.execute(client);

  return contents.toString();
}

async function appendToFile(line, { fileId, client, filePrivateKey }) {
  //Create the transaction
  const transaction = await new FileAppendTransaction()
    .setFileId(fileId)
    .setContents(line)
    .setMaxTransactionFee(new Hbar(200))
    .freezeWith(client);

  //Sign with the file private key
  const signTx = await transaction.sign(filePrivateKey);

  //Sign with the client operator key and submit to a Hedera network
  const txResponse = await signTx.execute(client);

  //Request the receipt
  const receipt = await txResponse.getReceipt(client);

  //Get the transaction consensus status
  const transactionStatus = receipt.status;

  console.log("The transaction consensus status is " + transactionStatus);
}

function generateFileLineFromUserAccount(
  { twitterId, privateKey, hederaId },
  key
) {
  log.info(`Generating user object to write`);

  const special = encrypt(privateKey, key);
  const value = {
    twitterId,
    hederaId,
    special,
  };

  return `"${twitterId}": ${JSON.stringify(value)},`;
}

async function getUserTableFromFile(hederaCreds) {
  const fileContent = await getFileContents(hederaCreds);

  return JSON.parse(`{ ${fileContent.replace(/,\s*$/, "")} }`);
}

function encrypt(message, key) {
  return CryptoJS.AES.encrypt(message, key).toString();
}

function decript(encrypted, key) {
  console.log(encrypted);
  console.log(key);
  return CryptoJS.AES.decrypt(encrypted, key);
}

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

async function transferTokens(
  tokenId,
  amount,
  transferToId,
  { client, myAccountId, myPrivateKey }
) {
  log.info(
    `Transfering ${amount} tokens (${tokenId}) from ${myAccountId} to ${transferToId}`
  );
  //Create the transfer transaction
  const transaction = await new TransferTransaction()
    .addTokenTransfer(tokenId, myAccountId, -1 * amount)
    .addTokenTransfer(tokenId, transferToId, amount)
    .freezeWith(client);

  //Sign with the sender account private key
  const signTx = await transaction.sign(myPrivateKey);

  //Sign with the client operator private key and submit to a Hedera network
  const txResponse = await signTx.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Obtain the transaction consensus status
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

  return JSON.parse(tokenBalance.tokens.toString());
}

async function getTokenTotalForTwitterId(twitterId, hederaCreds) {
  const userTable = await getUserTableFromFile(hederaCreds);
  const user = userTable[twitterId];

  if (!user) {
    return 0;
  }
  return await getTokenTotal(user.hederaId, hederaCreds);
}

module.exports = {
  makeToken,
  addToToken,
  getTokenTotal,
  transferTokens,
  generateKeys,
  createFile,
  getFileContents,
  appendToFile,
  generateFileLineFromUserAccount,
  encrypt,
  decript,
  getUserTableFromFile,
  createNewAccount,
  associateTokenToAccount,
  upsertTransferWithTwitterId,
  getTokenTotalForTwitterId,
};
