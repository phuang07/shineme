const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonicPhrase = "dignity wealth expire monitor language pulse argue giant vintage hip fatal urge"
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      // port: 7545,
      port: 8545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 8545
    },
    ropsten: {
      // See: https://trufflesuite.com/docs/truffle/reference/configuration/#networks
      // See: https://www.geeksforgeeks.org/deploying-smart-contract-on-test-main-network-using-truffle/
      // See: https://infura.io/dashboard/ethereum/f1ab052519f048849a083628b38ace95/settings
      provider: function() {
        return new HDWalletProvider(mnemonicPhrase, "https://ropsten.infura.io/v3/f1ab052519f048849a083628b38ace95");
      },
      network_id: '3',
    },
  }
};
