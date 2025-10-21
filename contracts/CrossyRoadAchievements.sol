// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CrossyRoadAchievements
 * @dev NFT Achievement badges for Crossy Road milestones
 */
contract CrossyRoadAchievements is ERC721, Ownable {
    using Strings for uint256;

    struct Achievement {
        string name;
        string description;
        uint256 scoreRequired;
        string imageURI;
    }

    // Achievement types
    uint256 public constant ROOKIE = 0;      // Score 50
    uint256 public constant ADVENTURER = 1;  // Score 100
    uint256 public constant EXPERT = 2;      // Score 150
    uint256 public constant MASTER = 3;      // Score 200
    uint256 public constant LEGEND = 4;      // Score 250

    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public playerAchievements;
    mapping(address => uint256) public highestScore;

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    event AchievementUnlocked(address indexed player, uint256 indexed achievementType, uint256 tokenId);
    event ScoreUpdated(address indexed player, uint256 score);

    constructor() ERC721("Crossy Road Achievements", "CRACH") Ownable(msg.sender) {
        _initializeAchievements();
        _baseTokenURI = "ipfs://"; // Will be updated with actual IPFS base URI
    }

    function _initializeAchievements() private {
        achievements[ROOKIE] = Achievement({
            name: "Rookie Crosser",
            description: "Reached score of 50",
            scoreRequired: 50,
            imageURI: "QmRookie" // Placeholder
        });

        achievements[ADVENTURER] = Achievement({
            name: "Bold Adventurer",
            description: "Reached score of 100",
            scoreRequired: 100,
            imageURI: "QmAdventurer"
        });

        achievements[EXPERT] = Achievement({
            name: "Road Expert",
            description: "Reached score of 150",
            scoreRequired: 150,
            imageURI: "QmExpert"
        });

        achievements[MASTER] = Achievement({
            name: "Crossing Master",
            description: "Reached score of 200",
            scoreRequired: 200,
            imageURI: "QmMaster"
        });

        achievements[LEGEND] = Achievement({
            name: "Legendary Crosser",
            description: "Reached score of 250",
            scoreRequired: 250,
            imageURI: "QmLegend"
        });
    }

    /**
     * @dev Update player score and mint achievement NFTs if milestones reached
     */
    function updateScore(address _player, uint256 _score) external onlyOwner {
        require(_score > highestScore[_player], "Score not improved");

        uint256 oldScore = highestScore[_player];
        highestScore[_player] = _score;

        emit ScoreUpdated(_player, _score);

        // Check and mint achievements
        _checkAndMintAchievements(_player, oldScore, _score);
    }

    /**
     * @dev Check if player unlocked new achievements and mint them
     */
    function _checkAndMintAchievements(address _player, uint256 _oldScore, uint256 _newScore) private {
        uint256[5] memory achievementTypes = [ROOKIE, ADVENTURER, EXPERT, MASTER, LEGEND];

        for (uint256 i = 0; i < achievementTypes.length; i++) {
            uint256 achievementType = achievementTypes[i];
            Achievement memory achievement = achievements[achievementType];

            // Check if player just reached this milestone
            if (_newScore >= achievement.scoreRequired &&
                _oldScore < achievement.scoreRequired &&
                !playerAchievements[_player][achievementType]) {

                _mintAchievement(_player, achievementType);
            }
        }
    }

    /**
     * @dev Mint an achievement NFT
     */
    function _mintAchievement(address _player, uint256 _achievementType) private {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(_player, tokenId);

        playerAchievements[_player][_achievementType] = true;

        emit AchievementUnlocked(_player, _achievementType, tokenId);
    }

    /**
     * @dev Get all achievements unlocked by a player
     */
    function getPlayerAchievements(address _player) external view returns (bool[5] memory) {
        return [
            playerAchievements[_player][ROOKIE],
            playerAchievements[_player][ADVENTURER],
            playerAchievements[_player][EXPERT],
            playerAchievements[_player][MASTER],
            playerAchievements[_player][LEGEND]
        ];
    }

    /**
     * @dev Check if player has specific achievement
     */
    function hasAchievement(address _player, uint256 _achievementType) external view returns (bool) {
        return playerAchievements[_player][_achievementType];
    }

    /**
     * @dev Get achievement count for player
     */
    function getAchievementCount(address _player) external view returns (uint256) {
        uint256 count = 0;
        uint256[5] memory achievementTypes = [ROOKIE, ADVENTURER, EXPERT, MASTER, LEGEND];

        for (uint256 i = 0; i < achievementTypes.length; i++) {
            if (playerAchievements[_player][achievementTypes[i]]) {
                count++;
            }
        }

        return count;
    }

    /**
     * @dev Get achievement details
     */
    function getAchievement(uint256 _achievementType) external view returns (Achievement memory) {
        return achievements[_achievementType];
    }

    /**
     * @dev Update base URI for metadata
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Update achievement image URI
     */
    function updateAchievementImage(uint256 _achievementType, string memory _imageURI) external onlyOwner {
        achievements[_achievementType].imageURI = _imageURI;
    }

    /**
     * @dev Override tokenURI to return metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        return string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"));
    }

    /**
     * @dev Get next token ID
     */
    function getNextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
