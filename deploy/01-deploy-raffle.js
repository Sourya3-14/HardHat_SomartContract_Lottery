const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { parseEther } = require("ethers")
const { verifyContract } = require("../utils/verify") // Importing the verify function from utils/verify.js

const VRF_SUB_FUND_AMOUNT = parseEther("10")

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId
	let vrfCoordinatorV2_5Mock, vrfCoordinatorV2_5Address, subscriptionId

	if (developmentChains.includes(network.name)) {
		// const vrfCoordinatorV2MockDeployment = await deployments.get("VRFCoordinatorV2Mock")
		// const vrfCoordinatorV2Mock = await ethers.getContractAt(
		// 	"VRFCoordinatorV2Mock",
		// 	vrfCoordinatorV2MockDeployment.address,
		// )

		const vrfCoordinatorV2_5MockDeployment = await deployments.get("VRFCoordinatorV2_5Mock")

		const signer = await ethers.getSigner(deployer)
		vrfCoordinatorV2_5Mock = await ethers.getContractAt(
			"VRFCoordinatorV2_5Mock",
			vrfCoordinatorV2_5MockDeployment.address,
			signer,
		)
		vrfCoordinatorV2_5Address = await vrfCoordinatorV2_5Mock.getAddress()

		const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription()
		const transactionReceipt = await transactionResponse.wait(1)

		subscriptionId = transactionReceipt.logs[0].args.subId

		//Fund the transaction
		await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
	} else {
		vrfCoordinatorV2_5Address = networkConfig[chainId]["vrfCoordinatorV2"]
		subscriptionId = networkConfig[chainId]["subscriptionId"]
	}

	const entranceFee = networkConfig[chainId]["entranceFee"]
	const gasLane = networkConfig[chainId]["gasLane"]
	const interval = networkConfig[chainId]["interval"]
	const args = [
		subscriptionId,
		gasLane,
		interval,
		entranceFee,
		vrfCoordinatorV2_5Address,
	]

	const Raffle = await deploy("Raffle", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	})
	
	if (developmentChains.includes(network.name)) {
		await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, Raffle.address)
	} else {
		log(
			"On testnet, manually add the consumer to your subscription on Chainlink VRF dashboard.",
		)
		log(`Subscription ID: ${subscriptionId}`)
		log(`Raffle Contract Address: ${Raffle.address}`)
	}

	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		log("Verifying...")
		await verifyContract(Raffle.address, args)
	}

	log("____________________________________________________")
}

module.exports.tags = ["all", "Raffle"]
