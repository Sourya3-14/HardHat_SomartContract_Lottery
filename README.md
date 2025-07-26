- Deployed my contracts on hardhat localnet and solved an error by replacing events with logs and .address with await ...... .getAddress()
- Completed writing my contract but have not tested or deployed it yet
- Implemented ChainLinkVRF to grt a random Winner
- Created the basic setup and learned about events

**To test it on a testnet**
1.get our subid for chainlink vrf[https://vrf.chain.link/]
2.deploy our contract using the subid
3.register the contract with chainlink vrf and it's subid[add as consumer]

````Successfully submitted source code for contract
contracts/Raffle.sol:Raffle at 0xE01Bab4125d8819588620378AD7379Fb01b71221```

4.register the contract with chainlink keepers/chainlink automation[https://automation.chain.link/]
```create a custom lojic based upkeep```

5.run staging tests
````
