const { parseEther } = require("ethers")
const { ethers, deployments } = require("hardhat")

async function main() {
	const RaffleDeployment = await deployments.get("Raffle")
	const [deployer] = await ethers.getSigners()
	const raffle = await ethers.getContractAt("Raffle", RaffleDeployment.address, deployer)
	// console.log("📦 Raffle Deployment Info:", RaffleDeployment)

	const interval = await raffle.getInterval()
	const lastTimestamp = await raffle.getLastTimeStamp()
	const currentTime = (await ethers.provider.getBlock("latest")).timestamp

	console.log(
		`⏱️ Time since last upkeep: ${(Number(currentTime) - Number(lastTimestamp)).toString()} / Interval: ${interval.toString()}`,
	)

	const upkeepResult = await raffle.checkUpkeep("0x")
	const upkeepNeeded = upkeepResult[0]
	const raffleState = await raffle.getRaffleState()
	console.log("🎯 Raffle state:", raffleState.toString()) // should be 0 (OPEN)

	const players = await raffle.getNumberOfPlayers()
	console.log("👥 Players in raffle:", players.toString())

	const balance = await ethers.provider.getBalance(raffle.target)
	console.log("💰 Contract balance:", parseEther(balance.toString()))

	console.log("🛠️ Upkeep needed:", upkeepNeeded)

	if (!upkeepNeeded) {
		console.log("⚠️ No upkeep needed now. Exiting.")
		return
	}

	// raffleEntrancefee = await raffle.getEntranceFee()
	// await raffle.enterRaffle({ value: raffleEntrancefee })

	console.log("🚀 Performing upkeep with increased gas limit...")

	const tx = await raffle.performUpkeep("0x", {
		gasLimit: 500000, // Use `n` for BigInt in v6
	})

	const receipt = await tx.wait()

	console.log("✅ performUpkeep confirmed")

	const event = receipt.logs
		.map((log) => {
			try {
				return raffle.interface.parseLog(log)
			} catch {
				return null
			}
		})
		.find((e) => e && e.name === "RequestedRaffleWinner")

	if (!event) {
		console.error("❌ RequestedRaffleWinner event not found in logs")
		return
	}

	const requestId = event.args.requestId
	console.log("🎲 VRF Request ID:", requestId.toString())

	console.log("⏳ Waiting for WinnerPicked event...")

	await new Promise((resolve, reject) => {
		raffle.once("WinnerPicked", (winner) => {
			console.log("🏆 Winner picked:", winner)
			resolve()
		})

		setTimeout(() => reject("❌ Timeout: Winner not picked"), 180_000)
	})
}

main().catch((err) => {
	console.error("❌ Script failed:", err)
	process.exit(1)
})
