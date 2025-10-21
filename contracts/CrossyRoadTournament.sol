// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CrossyRoadTournament
 * @dev Tournament contract for Crossy Road game with entry fees and prize pools
 */
contract CrossyRoadTournament is Ownable, ReentrancyGuard {
    struct Tournament {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        address winner;
        uint256 winningScore;
        bool finalized;
        mapping(address => uint256) playerScores;
        mapping(address => bool) hasEntered;
        address[] participants;
    }

    struct TournamentInfo {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 entryFee;
        uint256 prizePool;
        address winner;
        uint256 winningScore;
        bool finalized;
        uint256 participantCount;
    }

    mapping(uint256 => Tournament) public tournaments;
    uint256 public currentTournamentId;
    uint256 public nextTournamentId = 1;

    // Platform fee (20%)
    uint256 public platformFeePercent = 20;
    uint256 public accumulatedFees;

    event TournamentCreated(uint256 indexed tournamentId, uint256 startTime, uint256 endTime, uint256 entryFee);
    event PlayerEntered(uint256 indexed tournamentId, address indexed player, uint256 entryFee);
    event ScoreSubmitted(uint256 indexed tournamentId, address indexed player, uint256 score);
    event TournamentFinalized(uint256 indexed tournamentId, address indexed winner, uint256 prize);

    constructor() Ownable(msg.sender) {
        // Create first tournament (24 hour duration, 0.001 ETH entry)
        createTournament(block.timestamp, block.timestamp + 1 days, 0.001 ether);
    }

    /**
     * @dev Create a new tournament
     */
    function createTournament(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _entryFee
    ) public onlyOwner returns (uint256) {
        require(_endTime > _startTime, "Invalid time range");
        require(_endTime > block.timestamp, "End time must be in future");

        uint256 tournamentId = nextTournamentId++;
        Tournament storage newTournament = tournaments[tournamentId];
        newTournament.id = tournamentId;
        newTournament.startTime = _startTime;
        newTournament.endTime = _endTime;
        newTournament.entryFee = _entryFee;
        newTournament.prizePool = 0;
        newTournament.finalized = false;

        currentTournamentId = tournamentId;

        emit TournamentCreated(tournamentId, _startTime, _endTime, _entryFee);
        return tournamentId;
    }

    /**
     * @dev Enter current tournament with entry fee
     */
    function enterTournament() external payable nonReentrant {
        Tournament storage tournament = tournaments[currentTournamentId];

        require(block.timestamp >= tournament.startTime, "Tournament not started");
        require(block.timestamp < tournament.endTime, "Tournament ended");
        require(!tournament.hasEntered[msg.sender], "Already entered");
        require(msg.value == tournament.entryFee, "Incorrect entry fee");

        tournament.hasEntered[msg.sender] = true;
        tournament.participants.push(msg.sender);

        // Calculate platform fee
        uint256 fee = (msg.value * platformFeePercent) / 100;
        accumulatedFees += fee;
        tournament.prizePool += (msg.value - fee);

        emit PlayerEntered(currentTournamentId, msg.sender, msg.value);
    }

    /**
     * @dev Submit score for current tournament
     */
    function submitScore(uint256 _score) external {
        Tournament storage tournament = tournaments[currentTournamentId];

        require(tournament.hasEntered[msg.sender], "Not entered in tournament");
        require(block.timestamp < tournament.endTime, "Tournament ended");
        require(_score > tournament.playerScores[msg.sender], "Score not improved");

        tournament.playerScores[msg.sender] = _score;

        // Update winner if this is the highest score
        if (_score > tournament.winningScore) {
            tournament.winningScore = _score;
            tournament.winner = msg.sender;
        }

        emit ScoreSubmitted(currentTournamentId, msg.sender, _score);
    }

    /**
     * @dev Finalize tournament and distribute prizes
     */
    function finalizeTournament(uint256 _tournamentId) external nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];

        require(block.timestamp >= tournament.endTime, "Tournament not ended");
        require(!tournament.finalized, "Already finalized");
        require(tournament.participants.length > 0, "No participants");

        tournament.finalized = true;

        if (tournament.winner != address(0)) {
            // Transfer prize to winner
            (bool success, ) = tournament.winner.call{value: tournament.prizePool}("");
            require(success, "Prize transfer failed");

            emit TournamentFinalized(_tournamentId, tournament.winner, tournament.prizePool);
        }
    }

    /**
     * @dev Get tournament information
     */
    function getTournamentInfo(uint256 _tournamentId) external view returns (TournamentInfo memory) {
        Tournament storage tournament = tournaments[_tournamentId];

        return TournamentInfo({
            id: tournament.id,
            startTime: tournament.startTime,
            endTime: tournament.endTime,
            entryFee: tournament.entryFee,
            prizePool: tournament.prizePool,
            winner: tournament.winner,
            winningScore: tournament.winningScore,
            finalized: tournament.finalized,
            participantCount: tournament.participants.length
        });
    }

    /**
     * @dev Get player's score in tournament
     */
    function getPlayerScore(uint256 _tournamentId, address _player) external view returns (uint256) {
        return tournaments[_tournamentId].playerScores[_player];
    }

    /**
     * @dev Check if player has entered tournament
     */
    function hasPlayerEntered(uint256 _tournamentId, address _player) external view returns (bool) {
        return tournaments[_tournamentId].hasEntered[_player];
    }

    /**
     * @dev Get all participants in a tournament
     */
    function getTournamentParticipants(uint256 _tournamentId) external view returns (address[] memory) {
        return tournaments[_tournamentId].participants;
    }

    /**
     * @dev Withdraw accumulated platform fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }

    /**
     * @dev Update platform fee percentage
     */
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 25, "Fee too high"); // Max 25%
        platformFeePercent = _feePercent;
    }
}
