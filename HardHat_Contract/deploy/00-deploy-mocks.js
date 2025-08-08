const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { parseEther } = require("ethers")

const BASE_FEE = parseEther("0.25") //0.25 is the premium,it costs 0.25 link for a request
const GAS_PRICE_LINK = 1e9 //calculated value based on the gas price of the chain
const WEI_PER_UNIT_LINK = parseEther("1") //1 LINK = 10^18 wei

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId

	if (developmentChains.includes(network.name)) {
		log("Local network detected! Deploying Mocks....")
		//deploy a mock vrfcoordinator
		await deploy("VRFCoordinatorV2_5Mock", {
			from: deployer,
			log: true,
			args: [BASE_FEE, GAS_PRICE_LINK,WEI_PER_UNIT_LINK], //Constructor arduments of the contract
		})
		log("Mocks Deployed!")
		log("______________________________________________________________________")
	}
}

module.exports.tags = ["all", "mocks"]
