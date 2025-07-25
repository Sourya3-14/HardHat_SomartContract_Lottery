const { network, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle Integration Tests", function () {
			let raffle, raffleEntranceFee, deployer

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer
				const RaffleDeployment = await deployments.get("Raffle")
				raffle = await ethers.getContractAt("Raffle", RaffleDeployment.address)
				raffleEntranceFee = await raffle.getEntranceFee()
			})

			describe("fulfillRandomWords", function () {
				it("works with live Chainlink Keepers and Chainlink VRF", async function () {
					// Increase timeout for integration test
					// this.timeout(300000) // 5 minutes

					console.log("=== RAFFLE INTEGRATION TEST START ===")
					const startingTimeStamp = await raffle.getLatestTimeStamp()
					const accounts = await ethers.getSigners()
					
					// Check initial contract state
					const initialState = await raffle.getRaffleState()
					console.log("Initial raffle state:", initialState.toString())
					
					// Get contract interval for debugging
					const interval = await raffle.getInterval()
					console.log("Raffle interval:", interval.toString(), "seconds")

					// Check if checkUpkeep returns true initially
					try {
						const checkData = await raffle.checkUpkeep("0x")
						console.log("Initial checkUpkeep result:", checkData)
					} catch (e) {
						console.log("Initial checkUpkeep error:", e.message)
					}

					// Get starting balance
					const winnerStartingBalance = await ethers.provider.getBalance(accounts[0])
					console.log("Starting balance:", ethers.formatEther(winnerStartingBalance), "ETH")

					let monitorInterval

					const testPromise = new Promise(async (resolve, reject) => {
						console.log("Setting up WinnerPicked event listener...")
						
						// Set up the listener FIRST
						const winnerPickedHandler = async () => {
							console.log("🎉 WinnerPicked event fired!")
							clearInterval(monitorInterval) // Stop monitoring
							
							try {
								// Get ending state
								const recentWinner = await raffle.getRecentWinner()
								const raffleState = await raffle.getRaffleState()
								const winnerEndingBalance = await ethers.provider.getBalance(recentWinner)
								const endingTimeStamp = await raffle.getLatestTimeStamp()

								console.log("Recent winner:", recentWinner)
								console.log("Final raffle state:", raffleState.toString())

								// Assertions
								await expect(raffle.getPlayer(0)).to.be.reverted
								assert.equal(recentWinner.toString(), accounts[0].toString())
								assert.equal(raffleState.toString(), "0") // OPEN state
								assert(endingTimeStamp > startingTimeStamp)
								
								console.log("Winner starting balance:", ethers.formatEther(winnerStartingBalance))
								console.log("Winner ending balance:", ethers.formatEther(winnerEndingBalance))

								console.log("✅ All assertions passed!")
								resolve()
							} catch (error) {
								console.log("❌ Error in event handler:", error)
								reject(error)
							}
						}

						raffle.once("WinnerPicked", winnerPickedHandler)

						// Enter the raffle
						console.log("Entering raffle...")
						try {
							const txResponse = await raffle.enterRaffle({ value: raffleEntranceFee })
							await txResponse.wait(1)
							console.log("✅ Successfully entered raffle!")
						} catch (error) {
							console.log("❌ Failed to enter raffle:", error)
							reject(error)
							return
						}

						// Check number of players
						const numPlayers = await raffle.getNumPlayers()
						console.log("Number of players:", numPlayers.toString())

						// Check upkeep after entering
						try {
							const checkDataAfter = await raffle.checkUpkeep("0x")
							console.log("CheckUpkeep after entering:", checkDataAfter)
						} catch (e) {
							console.log("CheckUpkeep after entering error:", e.message)
						}

						// Monitor every 15 seconds
						console.log("🔍 Starting monitoring (every 15 seconds)...")
						let checkCount = 0
						monitorInterval = setInterval(async () => {
							try {
								checkCount++
								console.log(`\n--- Status Check #${checkCount} ---`)
								
								const currentBlock = await ethers.provider.getBlock("latest")
								const contractTime = await raffle.getLatestTimeStamp()
								const timePassed = currentBlock.timestamp - parseInt(contractTime.toString())
								
								console.log("Time passed since contract timestamp:", timePassed, "seconds")
								console.log("Required interval:", interval.toString(), "seconds")
								
								const checkResult = await raffle.checkUpkeep("0x")
								console.log("CheckUpkeep returns:", checkResult[0] ? "TRUE" : "FALSE")
								
								const currentState = await raffle.getRaffleState()
								console.log("Current raffle state:", currentState.toString())
								
								if (timePassed >= parseInt(interval.toString())) {
									if (checkResult[0]) {
										console.log("⚠️  Conditions met but automation hasn't triggered!")
										console.log("🔗 Check your Chainlink Automation dashboard")
									} else {
										console.log("ℹ️  CheckUpkeep returning false - conditions not met")
									}
								} else {
									console.log(`⏰ Waiting ${parseInt(interval.toString()) - timePassed} more seconds...`)
								}
							} catch (e) {
								console.log("Monitor error:", e.message)
							}
						}, 15000) // Check every 15 seconds

						// Set a backup timeout
						setTimeout(() => {
							clearInterval(monitorInterval)
							reject(new Error("❌ Test timed out - Chainlink Automation likely not working"))
						}, 290000) // 4 minutes 50 seconds
					})

					return testPromise
				})
			})

			// Helper test to check contract state
			describe("Contract State Check", function () {
				it("should have correct initial state", async function () {
					const state = await raffle.getRaffleState()
					const interval = await raffle.getInterval()
					const entranceFee = await raffle.getEntranceFee()
					
					console.log("Raffle state:", state.toString())
					console.log("Interval:", interval.toString(), "seconds")
					console.log("Entrance fee:", ethers.formatEther(entranceFee), "ETH")
					
					// Add your expected values here
					assert.equal(state.toString(), "0") // Should be OPEN
				})
			})
		})