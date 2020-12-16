const { getHederaCreds, getRandomConfig } = require("./config");
const {
  getFileContents,
  appendToFile,
  generateKeys,
  generateFileLineFromUserAccount,
  decript,
  createFile,
  getUserTableFromFile,
  createNewAccount,
  associateTokenToAccount,
  transferTokens,
  getTokenTotal,
} = require("./hedera");

(async () => {
  const hederaCreds = getHederaCreds();
  //   const { mintyToken } = getRandomConfig();

  console.log(
    (await getTokenTotal("0.0.154794", hederaCreds)).get("0.0.145669")
  );

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
