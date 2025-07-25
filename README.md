- Deployed my contracts on hardhat localnet and solved an error by replacing events with logs and .address with await ...... .getAddress()
- Completed writing my contract but have not tested or deployed it yet
- Implemented ChainLinkVRF to grt a random Winner
- Created the basic setup and learned about events

**To test it on a testnet**
1.get our subid for chainlink vrf[https://vrf.chain.link/]
2.deploy our contract using the subid
3.register the contract with chainlink vrf and it's subid[add as consumer]

```Successfully submitted source code for contract
contracts/Raffle.sol:Raffle at 0x896D321Cbf1D5e6F564dEA84EcB96d7285650582 // use this id
for verification on the block explorer. Waiting for verification result...

Successfully verified contract Raffle on the block explorer.
https://sepolia.etherscan.io/address/0x896D321Cbf1D5e6F564dEA84EcB96d7285650582#code

____________________________________________________
Done in 14.25s.```
4.register the contract with chainlink keepers/chainlink automation[https://automation.chain.link/]
5.run staging tests