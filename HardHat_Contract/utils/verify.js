const { run } = require("hardhat")

async function verifyContract(address, args) {
	console.log("Verifying contract...")
	try {
		await run("verify:verify", {
			address: address,
			constructorArguments: args,
		})
	} catch (error) {
		if (error.message.toLowerCase().includes("already verified")) {
			console.log("Contract already verified")
		} else {
			console.error("Verification failed:", error)
		}
	}
}
module.exports = { verifyContract }
