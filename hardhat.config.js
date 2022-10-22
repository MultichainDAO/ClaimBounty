
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()
require("@nomiclabs/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")

module.exports = {
  solidity: {
    compilers:[
      
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "constantinople",
          outputSelection: {
            "*": {
              "*": [
                "evm.bytecode.object",
                "evm.deployedBytecode.object",
                "abi",
                "evm.bytecode.sourceMap",
                "evm.deployedBytecode.sourceMap",
                "metadata"
              ],
              "": ["ast"]
            }
          }
        }
      }
    ]
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337
    },
    // bscTestnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    //   chainId: 97,
    //   accounts: [ process.env.ADMIN_PK ],
    // },
    // ftmTestnet: {
    //   url: "https://xapi.testnet.fantom.network/lachesis",
    //   chainId: 4002,
    //   accounts: [ process.env.ADMIN_PK ],
    //   gas: 8000000,
    //   gasPrice: 2000000000
    // }
  },
  mocha: {
    timeout: 600000
  }
}
