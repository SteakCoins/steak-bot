const {
  getHederaCreds,
  getRandomConfig,
  getTwitterCreds,
} = require("./config");

const { retweetAndTweet, replyToTweet, sendDirectMessage } = require("./tweet");
const {
  getFileContents,
  appendToFile,
  generateKeys,
  generateFileLineFromUserAccount,
  encrypt,
  decript,
  createFile,
  getUserTableFromFile,
  createNewAccount,
  associateTokenToAccount,
  transferTokens,
  getTokenTotal,
  getTokenTotalForTwitterId,
  upsertTransferWithTwitterId,
  getTokenSupply,
  makeToken,
} = require("./hedera");

const CryptoJS = require("crypto-js");

(async () => {
  const twitterCreds = getTwitterCreds();
  const hederaCreds = getHederaCreds();

  const userTable = await getUserTableFromFile(hederaCreds);

  const DMObj = {
    twitterId: "377793153",
    message: "hello bro",
  };
  await sendDirectMessage(DMObj, twitterCreds);

  // console.log(userTable["1339093484376973312"]);

  // console.log(
  //   decript(
  //     userTable["1339093484376973312"].special,
  //     hederaCreds.filePrivateKey.toString()
  //   ).toString(CryptoJS.enc.Utf8)
  // );

  // console.log(
  //   encrypt(
  //     hederaCreds.myPrivateKey.toString(),
  //     hederaCreds.filePrivateKey.toString()
  //   )
  // );

  // const enc = encrypt(
  //   hederaCreds.myPrivateKey.toString(),
  //   hederaCreds.filePrivateKey.toString()
  // ).toString();

  // console.log(
  //   decript(
  //     "U2FsdGVkX1/ryj2+0XIhsBC8LvCs80jPbdLsWpVVe53VdlGx6Qlh+62elrAPs3OOVr2c6PZCQS5W5JpH/ws9BgiONfgq66mvDJvuRMtHOBSj/C+CS36H+9tRqKs6odbYMHAONhlJyVaqrzR9mWmqBYWztFFhidz2IiaAN/0fUds=",
  //     hederaCreds.filePrivateKey.toString()
  //   ).toString(CryptoJS.enc.Utf8)
  // );

  // console.log(decript(enc, hederaCreds.filePrivateKey.toString()).toString());
  // const { mintyToken } = getRandomConfig();

  // console.log(
  //   await upsertTransferWithTwitterId(
  //     "1344241334694064129",
  //     1,
  //     mintyToken,
  //     hederaCreds
  //   )
  // );
  // console.log(await createFile(hederaCreds, hederaCreds));
  // const { mintyToken } = getRandomConfig();

  // console.log(getTokenSupply(mintyToken, hederaCreds));

  // upsertTransferWithTwitterId("12334", 2, mintyToken, hederaCreds);

  // console.log((await getTokenTotal("0.0.154794", hederaCreds))["0.0.145669"]);

  // const tokens = await getTokenTotalForTwitterId("2288124321", hederaCreds);

  // console.log(tokens);

  //   const newAccount = await createNewAccount(hederaCreds);

  //   await associateTokenToAccount(mintyToken, newAccount, hederaCreds);

  //   await transferTokens(mintyToken, 1, newAccount.accountId, hederaCreds);

  //   console.log(newAccount);

  //   console.log(await createFile(hederaCreds, hederaCreds));

  //   const newKeys = generateKeys();
  //   const line = generateFileLineFromUserAccount(
  //     {
  //       twitterId: "hello2",
  //       privateKey: newKeys.privateKey.toString(),
  //       hederaId: "0.0.101",
  //     },
  //     hederaCreds.filePrivateKey.toString()
  //   );

  //   console.log(newKeys.privateKey.toString());

  //   const obj = `{ ${line.replace(/,\s*$/, "")} }`;

  //   const json = JSON.parse(obj);

  //   //   decript(json.hello.special, hederaCreds.filePrivateKey.toString());

  //   let fileContent = await getFileContents(hederaCreds);
  //   console.log(fileContent);

  //   await appendToFile(line, hederaCreds);

  //   fileContent = await getUserTableFromFile(hederaCreds);
  //   console.log(fileContent);
})();

//   transferTokens(mintyToken, 10, "0.0.152990", hederaCreds);
