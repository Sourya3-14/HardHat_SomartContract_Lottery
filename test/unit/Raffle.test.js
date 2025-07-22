const { network, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert } = require("chai")

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle", async function () {
			let raffle, vrfCoordinatorV2Mock
            const chainId = network.config.chainId
			beforeEach(async function () {
				const { deployer } = await getNamedAccounts()
				await deployments.fixture(["all"])
				raffle = await ethers.getContract("Raffle", deployer)
				vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
			})
            describe("Constructor",async function () {
                it("Initializes the raffle correctly",async function (){
                    //Ideally we make our test just 1 assert per it
                    const raffleState = await raffle.getRaffleState()
                    assert.equal(raffleState.toString(),"0")

                    const interval = await raffle.getInterval()
                    assert.equal(interval.toString(),networkConfig[chainId]["interval"])
                })
            })

            describe("enterRaffle",async function(){
                
            })
		})
