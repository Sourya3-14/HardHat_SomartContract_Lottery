const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { parseEther } = require("ethers")

const BASE_FEE = parseEther("0.25") //0.25 is the premium,it costs 0.25 link for a request
const GAS_PRICE_LINK = 1e9 //calculated value based on the gas price of the chain

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId

	if (developmentChains.includes(network.name)) {
		log("Local network detected! Deploying Mocks....")
		//deploy a mock vrfcoordinator
		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			log: true,
			args: [BASE_FEE, GAS_PRICE_LINK], //Constructor arduments of the contract
		})
		log("Mocks Deployed!")
		log("______________________________________________________________________")
	}
}

module.exports.tags = ["all", "mocks"]
