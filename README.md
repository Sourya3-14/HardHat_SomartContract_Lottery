- Deployed my contracts on hardhat localnet and solved an error by replacing events with logs and .address with await ...... .getAddress()
- Completed writing my contract but have not tested or deployed it yet
- Implemented ChainLinkVRF to grt a random Winner
- Created the basic setup and learned about events

**To test it on a testnet**

1.get our subid for chainlink vrf
<br/>[https://vrf.chain.link/]
<br/>[try to pay it using eth then excessive cost may not be more than 0.1 eth for link it may go to 100 LINK also]
<br/>`shows too much but takes only few amount like 0.000003 eth`

2.deploy our contract using the subid

3.register the contract with chainlink vrf and it's subid[add as consumer]
<br/>`Successfully submitted source code for contract`
<br/>`contracts/Raffle.sol:Raffle at 0xE01Bab4125d8819588620378AD7379Fb01b71221`

4.register the contract with chainlink keepers/chainlink automation
<br/>[https://automation.chain.link/]
<br/>`create a custom lojic based upkeep`

5.run staging tests[test may be shown pending on vrf for a few seconds]
