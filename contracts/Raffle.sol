// Enter the lottery(paying some amount)
// Pick a random number(verifiably random)
// Winner to be selected every X minures -> completely automated

//ChainLink Oracle -> Randomness,Automated Execution(Chainlink keepers)

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Raffle_Not_enough_ETH();
error Raffle_Transfer_Failed();
error Raffle__Not_Open();
error Raffle__upkeepNotNeeded(uint256 currentBalance, uint256 players, uint256 raffleState);

/**
 * @title A simple Raffle contract
 * @author Sourya Adhikary
 * @notice This contract is for creating an untamparable decentralized smart contract
 * @dev this implements chainlinkVrfV2 and ca=hainlink keppers
 */

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
	//type declarations
	enum RaffleState {
		OPEN,
		CALCULATING,
		PENDING,
		CLOSED
	}

	//state variable
	address payable[] private s_players;
	// address (Normal Address) -> It can store an Ethereum address.
	// address payable -> It can store an Ethereum address and receive Ether.
	// uint256 constant MINIMUM_ETH = 1e17;
	uint256 private immutable i_entranceFee;
	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	bytes32 private immutable i_gasLane;
	uint64 private immutable i_subscriptionId;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private immutable i_callbackGasLimit;
	uint32 private constant NUM_WORDS = 1;
	uint256 private s_lastTimeStamp;
	uint256 private s_interval;

	//Lottery Variables
	address private s_recentWinner;
	RaffleState private s_raffleState;

	//events
	event RaffleEnter(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	constructor(
		uint256 entranceFee,
		address vrfCoordinatorV2,
		bytes32 gasLane,
		uint64 subscriptionId,
		uint32 callbackGasLimit,
		uint256 interval
	) VRFConsumerBaseV2(vrfCoordinatorV2) {
		i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
		i_entranceFee = entranceFee;
		i_gasLane = gasLane;
		i_subscriptionId = subscriptionId;
		i_callbackGasLimit = callbackGasLimit;
		s_raffleState = RaffleState.OPEN;
		s_lastTimeStamp = block.timestamp;
		s_interval = interval;
	}

	function enterRaffle() public payable {
		if (msg.value < i_entranceFee) revert Raffle_Not_enough_ETH();
		if (s_raffleState != RaffleState.OPEN) revert Raffle__Not_Open();

		s_players.push(payable(msg.sender));
		//emit and event when we update a dynamic array or mapping
		emit RaffleEnter(msg.sender);
	}

	/**
	 * @dev this is the function that the chainlink keppers node calls they for 'upkeepNeeded' to be true
	 * following is needed to be true
	 * 1.time interval should have passed
	 * 2.lottery should have atlease one player and some eth
	 * 3.our subscription in funded with link
	 * 4.lottery should be in open state
	 */
	function checkUpkeep(
		bytes memory /* checkData */
	) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
		bool isOpen = (RaffleState.OPEN == s_raffleState);
		bool timePassed = (block.timestamp - s_lastTimeStamp) > s_interval;
		bool hasPlayers = (s_players.length > 0);
		bool hasBalance = (address(this).balance > 0);

		upkeepNeeded = (isOpen && timePassed && hasBalance && hasPlayers);
	}

	function performUpkeep(bytes calldata /* performData */) external override {
		//request the random number
		//once we get do something with it
		//2 transaction process
		(bool upkeepNeeded, ) = checkUpkeep(bytes(""));
		if (!upkeepNeeded)
			revert Raffle__upkeepNotNeeded(
				address(this).balance,
				s_players.length,
				uint256(s_raffleState)
			);

		s_raffleState = RaffleState.CALCULATING;
		uint256 requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane, //gasLen
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);

		emit RequestedRaffleWinner(requestId);
	}

	function fulfillRandomWords(
		uint256 /*requestId*/,
		uint256[] memory randomWords
	) internal override {
		//s_players size 10
		//randomNumber 202
		//202%10 = 2
		uint256 indexOfWinner = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[indexOfWinner];
		s_recentWinner = recentWinner;
		s_raffleState = RaffleState.OPEN;
		s_players = new address payable[](0);
		s_lastTimeStamp = block.timestamp;

		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		//require success
		if (!success) revert Raffle_Transfer_Failed();
		emit WinnerPicked(recentWinner);
	}

	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getPlayer(uint256 index) public view returns (address) {
		return s_players[index];
	}

	function getRecentWinner() public view returns (address) {
		return s_recentWinner;
	}

	function getRaffleState() public view returns (RaffleState) {
		return s_raffleState;
	}

	function getNumWords() public pure returns (uint32) {
		return NUM_WORDS;
	}

	function getNumberOfPlayers() public view returns (uint256) {
		return s_players.length;
	}

	function getLatestTimeStamp() public view returns (uint256) {
		return s_lastTimeStamp;
	}

	function geTRequestConfirmatioons() public pure returns (uint256) {
		return REQUEST_CONFIRMATIONS;
	}

	function getInterval() public view returns (uint256) {
		return s_interval;
	}
}
