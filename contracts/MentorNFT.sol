// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// MentorNFT - ERC721 Smart Contract
// Deploy this on Remix IDE at remix.ethereum.org
// Network: Ethereum Sepolia Testnet
// After deploy, copy the address to .env.local
// ============================================================

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MentorNFT is ERC721, Ownable {

    // Token ID counter
    uint256 private _nextTokenId = 1;

    // Mentor data stored on-chain
    struct Mentor {
        string name;
        string expertise;
        string personality;
        string adviceStyle;
        uint256 level;
        uint256 xp;
        uint256 mintedAt;
    }

    // Level-up history for each token
    struct LevelEvent {
        uint256 level;
        uint256 timestamp;
    }

    mapping(uint256 => Mentor) public mentors;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => LevelEvent[]) public levelHistory;
    mapping(address => uint256[]) public ownerTokens;

    // XP constants
    uint256 public constant XP_PER_TASK  = 100;
    uint256 public constant XP_PER_LEVEL = 300;

    // Events
    event MentorMinted(address indexed owner, uint256 indexed tokenId, string name, string expertise);
    event MentorLeveledUp(uint256 indexed tokenId, uint256 newLevel, uint256 xp);

    constructor() ERC721("MentorMint", "MNTR") Ownable(msg.sender) {}

    // ---- Mint a new mentor NFT ----
    function mintMentor(
        string memory name,
        string memory expertise,
        string memory personality,
        string memory adviceStyle,
        string memory tokenURI_
    ) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = tokenURI_;

        mentors[tokenId] = Mentor({
            name:        name,
            expertise:   expertise,
            personality: personality,
            adviceStyle: adviceStyle,
            level:       1,
            xp:          0,
            mintedAt:    block.timestamp
        });

        levelHistory[tokenId].push(LevelEvent({
            level:     1,
            timestamp: block.timestamp
        }));

        ownerTokens[msg.sender].push(tokenId);

        emit MentorMinted(msg.sender, tokenId, name, expertise);
        return tokenId;
    }

    // ---- Complete a task: +100 XP, auto level-up ----
    function levelUp(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not your mentor");

        Mentor storage m = mentors[tokenId];
        m.xp += XP_PER_TASK;

        // Level up if XP threshold reached
        if (m.xp >= XP_PER_LEVEL * m.level) {
            m.level += 1;
            levelHistory[tokenId].push(LevelEvent({
                level:     m.level,
                timestamp: block.timestamp
            }));
        }

        emit MentorLeveledUp(tokenId, m.level, m.xp);
    }

    // ---- Read functions ----
    function getMentor(uint256 tokenId) external view returns (Mentor memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mentors[tokenId];
    }

    function getLevelHistory(uint256 tokenId) external view returns (LevelEvent[] memory) {
        return levelHistory[tokenId];
    }

    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return ownerTokens[owner];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
