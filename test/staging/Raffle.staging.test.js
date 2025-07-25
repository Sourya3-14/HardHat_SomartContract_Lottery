const { network, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle", function () {
			let raffle, raffleEntrancefee, deployer

			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer

				const RaffleDeployment = await deployments.get("Raffle")
				raffle = await ethers.getContractAt("Raffle", RaffleDeployment.address)

				raffleEntrancefee = await raffle.getEntranceFee()
				// interval = await raffle.getInterval()
			})
			describe("fulfillRandomWords", function () {
				it("works with live chainlink keepers and ChainLink VRF", async function () {
					//enter the raffle
					const startingTimeStamp = await raffle.getLatestTimeStamp()
					const accounts = await ethers.getSigners()
					//setup a listener before we enter the raffle
					//just in case the blockchain moves really fast
					await raffle.enterRaffle({ value: raffleEntrancefee })
					const winnerStartingBalance = await ethers.provider.getBalance(accounts[0])

					await new Promise(async (resolve, reject) => {
						//then entering the raffle

						raffle.once("WinnerPicked", async () => {
							console.log("WinnerPicked event fired!")
							try {
								const recentWinner = await raffle.getRecentWinner()
								const raffleState = await raffle.getRaffleState()
								const winnerEndingBalance =
									await ethers.provider.getBalance(recentWinner)
								const endingTimeStamp = await raffle.getLatestTimeStamp()

								await expect(raffle.getPlayer(0)).to.be.reverted
								assert.equal(recentWinner.toString(), accounts[0].toString())
								assert.equal(raffleState.toString(), "0")
								assert(endingTimeStamp > startingTimeStamp)

								assert.equal(
									winnerEndingBalance.toString(),
									(winnerStartingBalance + raffleEntrancefee).toString(),
								)

								resolve()
							} catch (e) {
								reject(e)
							}

							//and this code will not be complete until our listener has finished listening
						})
					})
				})
			})
		})
