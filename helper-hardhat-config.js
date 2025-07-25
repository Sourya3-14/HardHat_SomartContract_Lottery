const { parseEther } = require("ethers")

const networkConfig = {
	11155111: {
		name: "sepolia",
		vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
		entranceFee: parseEther("0.001"),
		gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", //5000 gwei Key Hash of sepolia
		subscriptionId: "34173559721319756141178144569491962402106007956501173962804552399864443606601", //last 4 digits of the subid
		// callbackGasLimit: "100000",
		interval: "30",
	},
	31337: {
		name: "hardhat",
		vrfCoordinatorV2: "",
		entranceFee: parseEther("0.001"),
		gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", //750 gwei Key Hash of sepolia
		// callbackGasLimit: "100000",
		interval: "30",
	},
}
const developmentChains = ["hardhat", "localhost"]

module.exports = {
	networkConfig,
	developmentChains,
}
