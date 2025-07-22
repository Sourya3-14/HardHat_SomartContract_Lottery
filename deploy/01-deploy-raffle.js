const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { parseEther } = require("ethers")
const { verifyContract } = require("../utils/verify") // Importing the verify function from utils/verify.js

const VRF_SUB_FUND_AMOUNT = parseEther("5")

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	let vrfCoordinatorV2Address, subscriptionId

	if (developmentChains.includes(network.name)) {
		const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
		vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress()

		const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
		const transactionReceipt = await transactionResponse.wait(1)

		subscriptionId = transactionReceipt.logs[0].args.subId

		//Fund the transaction
		await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
	} else {
		vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
		subscriptionId = networkConfig[chainId]["subscriptionId"]
	}

	const entranceFee = networkConfig[chainId]["entranceFee"]
	const gasLane = networkConfig[chainId]["gasLane"]
	const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
	const interval = networkConfig[chainId]["interval"]
	const args = [
		entranceFee,
		vrfCoordinatorV2Address,
		gasLane,
		subscriptionId,
		callbackGasLimit,
		interval,
	]

	const Raffle = await deploy("Raffle", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	})
	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		log("Verifying...")
		await verifyContract(Raffle.address, args)
	}

	log("____________________________________________________")
}

module.exports.tags = ["all", "Raffle"]
