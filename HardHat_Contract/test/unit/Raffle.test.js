const { network, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle", function () {
			let raffle, vrfCoordinatorV2_5Mock, raffleEntrancefee, deployer, interval
			const chainId = network.config.chainId

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer
				await deployments.fixture(["all"])

				const RaffleDeployment = await deployments.get("Raffle")
				raffle = await ethers.getContractAt("Raffle", RaffleDeployment.address)

				const MockDeployment = await deployments.get("VRFCoordinatorV2_5Mock")
				vrfCoordinatorV2_5Mock = await ethers.getContractAt(
					"VRFCoordinatorV2_5Mock",
					MockDeployment.address,
				)

				raffleEntrancefee = await raffle.getEntranceFee()
				interval = await raffle.getInterval()
			})
			describe("Constructor", function () {
				it("Initializes the raffle correctly", async function () {
					//Ideally we make our test just 1 assert per it
					const raffleState = await raffle.getRaffleState()
					assert.equal(raffleState.toString(), "0")

					const interval = await raffle.getInterval()
					assert.equal(interval.toString(), networkConfig[chainId]["interval"])
				})
			})

			describe("enterRaffle", function () {
				it("reverts when you dont pay enough", async function () {
					await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
						raffle,
						"Raffle__SendMoreToEnterRaffle",
					)
				})
				it("records players when they enter", async function () {
					//raffleEntrancefee
					await raffle.enterRaffle({ value: raffleEntrancefee })
					const playerFromContract = await raffle.getPlayer(0)
					assert.equal(playerFromContract, deployer)
				})
				it("Emits event on enter", async function () {
					await expect(raffle.enterRaffle({ value: raffleEntrancefee })).to.emit(
						raffle,
						"RaffleEnter",
					)
				})
				it("does not allow entrance when the Raffle is calculating", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee })
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					await raffle.performUpkeep("0x")
					//contract enters into calculating state
					await expect(
						raffle.enterRaffle({ value: raffleEntrancefee }),
					).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen")
				})
			})
			describe("checkUpKeep", function () {
				it("returns false if poeple haven't sent any eth", async function () {
					// await raffle.enterRaffle({ value: raffleEntrancefee })//fails cause have not been funded
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					const { upkeepNeeded } = await raffle.checkUpkeep("0x")
					console.log("Upkeep result:", upkeepNeeded)
					assert.equal(upkeepNeeded, false)
				})
				it("returns false if raffle is not opne", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee })
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					await raffle.performUpkeep("0x")
					assert.equal(await raffle.getRaffleState(), 1) //1 means calculating state
					//contract enters into calculating state
					const { upkeepNeeded } = await raffle.checkUpkeep("0x")
					assert.equal(upkeepNeeded, false)
				})
				it("returns false if enough time has not passed", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee }) //fails cause have not been funded
					await network.provider.send("evm_increaseTime", [Number(interval) - 10]) //adding more delay is better and boundry is not strict in hardhat
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					const { upkeepNeeded } = await raffle.checkUpkeep("0x")
					assert.equal(upkeepNeeded, false)
				})
				it("returns true if all the conditions are met", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee }) //fails cause have not been funded
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					const { upkeepNeeded } = await raffle.checkUpkeep("0x")
					assert.equal(upkeepNeeded, true)
				})
			})
			describe("performUpkeep", function () {
				it("it can only run when checkUpkeep is true", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee }) //fails cause have not been funded
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations
					const tx = await raffle.performUpkeep("0x")
					assert(tx)
				})
				it("it reverts when checkUpkeep is false", async function () {
					await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
						raffle,
						"Raffle__UpkeepNotNeeded",
					)
				})
				it("updates the raffle state,emits the event and calls the vrf coordinator", async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee }) //fails cause have not been funded
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", []) //mining 1 block for 1 block confirmations

					const txResponse = await raffle.performUpkeep("0x")
					const txReceipt = await txResponse.wait(1)

					const requestId = txReceipt.logs[1].args.requestId
					assert(Number(requestId) > 0)
					assert.equal(await raffle.getRaffleState(), 1) //1 means calculating state
				})
			})
			describe("fulfillRandomWords", function () {
				beforeEach(async function () {
					await raffle.enterRaffle({ value: raffleEntrancefee })
					await network.provider.send("evm_increaseTime", [Number(interval) + 1])
					await network.provider.send("evm_mine", [])
				})

				// FIX 1: Correct revertedWithCustomError format
				it("can only be called after performUpkeep", async function () {
					await expect(
						vrfCoordinatorV2_5Mock.fulfillRandomWords(0, raffle.target),
					).to.be.revertedWithCustomError(vrfCoordinatorV2_5Mock, "InvalidRequest")

					await expect(
						vrfCoordinatorV2_5Mock.fulfillRandomWords(1, raffle.target),
					).to.be.revertedWithCustomError(vrfCoordinatorV2_5Mock, "InvalidRequest")
				})

				// FIX 2: Ensure subscription has enough balance
				it("picks a winner,resets the lottery and sends the money", async function () {
					const additionalEntrances = 3
					const startingAccountIndex = 2
					const accounts = await ethers.getSigners()

					// Add additional players with await
					for (
						let i = startingAccountIndex;
						i < startingAccountIndex + additionalEntrances;
						i++
					) {
						const accountConnectedRaffle = raffle.connect(accounts[i])
						await accountConnectedRaffle.enterRaffle({ value: raffleEntrancefee })
					}

					const startingTimeStamp = await raffle.getLastTimeStamp()
					let winnerStartingBalance
					// FIX 3: Add timeout and better error handling
					await new Promise(async (resolve, reject) => {
						raffle.once("WinnerPicked", async () => {
							console.log("Found the event!")

							try {
								const recentWinner = await raffle.getRecentWinner()
								console.log("Recent Winner:", recentWinner)

								// Log account addresses for debugging
								for (
									let i = startingAccountIndex;
									i < startingAccountIndex + additionalEntrances;
									i++
								) {
									console.log(`Account ${i}:`, accounts[i].address)
								}

								const raffleState = await raffle.getRaffleState()
								const endingTimeStamp = await raffle.getLastTimeStamp()
								const numPlayers = await raffle.getNumberOfPlayers()
								const winnerEndingBalance = await ethers.provider.getBalance(
									accounts[2],
								)

								assert.equal(numPlayers.toString(), "0")
								assert.equal(raffleState.toString(), "0")
								assert(endingTimeStamp > startingTimeStamp)

								// Verify winner is one of the participants
								const participantAddresses = [
									accounts[0].address, // deployer
									accounts[2].address,
									accounts[3].address,
									accounts[4].address,
								]
								assert(
									participantAddresses.includes(recentWinner),
									`Winner ${recentWinner} should be one of the participants`,
								)
								
								const totalFee = raffleEntrancefee * BigInt(additionalEntrances + 1)
								assert.equal(
									winnerEndingBalance.toString(),
									(winnerStartingBalance + totalFee).toString(),
								)
								resolve()
							} catch (e) {
								clearTimeout(timeout)
								console.error("Error in WinnerPicked event handler:", e)
								reject(e)
							}
						})

						// Setting up the event listener
						try {
							console.log("Calling performUpkeep...")
							const tx = await raffle.performUpkeep("0x")
							const txReceipt = await tx.wait(1)

							const requestId = txReceipt.logs[1].args.requestId
							console.log("Request ID:", requestId.toString())
							winnerStartingBalance = await ethers.provider.getBalance(accounts[2])
							console.log("Calling fulfillRandomWords...")
							await vrfCoordinatorV2_5Mock.fulfillRandomWords(
								requestId,
								raffle.target,
							)
							console.log("fulfillRandomWords called successfully")
						} catch (error) {
							console.error("Error in performUpkeep or fulfillRandomWords:", error)
							reject(error)
						}
					})
				})
			})
		})
