const fs = require("fs");
const path = require("path");

// Replace with your contract name
const contractName = "Raffle";

// Build the path to the ABI JSON file
const abiPath = path.join(__dirname, "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);

// Read and parse the file
const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// Extract the ABI
const abi = contractJson.abi;

// Now use the ABI
console.log("ABI:", abi);
