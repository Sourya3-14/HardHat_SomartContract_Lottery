require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("@nomicfoundation/hardhat-verify")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("dotenv").config()
// /**
//  * @type import('hardhat/config').HardhatUserConfig
//  */

// const MAINNET_RPC_URL =
//     process.env.MAINNET_RPC_URL ||
//     process.env.ALCHEMY_MAINNET_RPC_URL ||
//     "https://eth-mainnet.alchemyapi.io/v2/your-api-key"
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Your etherscan API key"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "Bhar me jao"
// const POLYGON_MAINNET_RPC_URL =
//     process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-mainnet.alchemyapi.io/v2/your-api-key"
// optional
// const MNEMONIC = process.env.MNEMONIC || "your mnemonic"

// // Your API key for Etherscan, obtain one at https://etherscan.io/
// const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key"
// const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337,
			blockConfirmations: 1,
		},
		localhost: {
			chainId: 31337,
		},
		sepolia: {
			url: SEPOLIA_RPC_URL,
			accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
			chainId: 11155111,
			blockConfirmations: 6,
		},
		// mainnet: {
		//     url: MAINNET_RPC_URL,
		//     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
		//     //   accounts: {
		//     //     mnemonic: MNEMONIC,
		//     //   },
		//     saveDeployments: true,
		//     chainId: 1,
		// },
		// polygon: {
		//     url: POLYGON_MAINNET_RPC_URL,
		//     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
		//     saveDeployments: true,
		//     chainId: 137,
		// },
	},
	etherscan: {
	    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
	    apiKey: ETHERSCAN_API_KEY,
	    // customChains: [
	    //     {
	    //         network: "goerli",
	    //         chainId: 5,
	    //         urls: {
	    //             apiURL: "https://api-goerli.etherscan.io/api",
	    //             browserURL: "https://goerli.etherscan.io",
	    //         },
	    //     },
	    // ],
	},
	gasReporter: {
		enabled: false,
		currency: "USD",
		outputFile: "gas-report.txt",
		noColors: true,
		// coinmarketcap: process.env.COINMARKETCAP_API_KEY,
	},
	namedAccounts: {
		deployer: {
			default: 0, // here this will by default take the first account as deployer
		},
		player: {
			default: 1,
		},
	},
	solidity: {
		compilers: [
			{
				version: "0.8.28",
			},
			{
				version: "0.8.7",
			},
		],
	},
	mocha: {
		timeout: 500000, // 100 seconds max for running tests
	},
}

 