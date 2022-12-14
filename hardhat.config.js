
require("@nomiclabs/hardhat-truffle5")
require("dotenv").config()
require("@nomiclabs/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: {
    compilers: [

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
    hardhat: {
    },
    bsc: {
      url: process.env.BSC_RPC_PROVIDER,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.POLYGON_RPC_PROVIDER,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY
    }
  },
  mocha: {
    timeout: 600000
  }
}
