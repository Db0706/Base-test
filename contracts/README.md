# Crossy Road Smart Contracts

## Overview

This project includes two smart contracts for the Crossy Road game on Base:

1. **CrossyRoadTournament** - Handles pay-to-play tournaments with prize pools
2. **CrossyRoadAchievements** - NFT achievement badges for score milestones

## Contracts

### CrossyRoadTournament.sol

A tournament management contract with:
- Entry fees in ETH
- Automated prize pool distribution
- Time-limited tournaments (24 hours)
- Score submission and tracking
- Winner determination
- 20% platform fee (80% to winner, 20% to contract owner)

**Key Features:**
- Players pay entry fee to join tournament
- Scores are submitted on-chain
- Highest score wins the prize pool
- Automatic tournament creation
- Owner can finalize tournaments

### CrossyRoadAchievements.sol

An ERC-721 NFT contract for achievement badges:
- 🐣 **Rookie Crosser** - Score 50
- ⚔️ **Bold Adventurer** - Score 100
- 🎯 **Road Expert** - Score 150
- 👑 **Crossing Master** - Score 200
- 🏆 **Legendary Crosser** - Score 250

**Key Features:**
- Automatic NFT minting on milestone achievement
- One NFT per achievement type
- Player achievement tracking
- Metadata support for OpenSea/marketplaces

## Deployment Instructions

### Prerequisites

1. Install Foundry (for deployment):
\`\`\`bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
\`\`\`

2. Or use Remix IDE (https://remix.ethereum.org)

### Deploy to Base Sepolia Testnet

#### Option 1: Using Foundry

1. Create a new Foundry project:
\`\`\`bash
forge init crossy-contracts
cd crossy-contracts
\`\`\`

2. Copy the contracts to `src/`

3. Install OpenZeppelin:
\`\`\`bash
forge install OpenZeppelin/openzeppelin-contracts
\`\`\`

4. Create `.env`:
\`\`\`
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
\`\`\`

5. Deploy Tournament Contract:
\`\`\`bash
forge create --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key $PRIVATE_KEY \\
  --etherscan-api-key $BASESCAN_API_KEY \\
  --verify \\
  src/CrossyRoadTournament.sol:CrossyRoadTournament
\`\`\`

6. Deploy Achievements Contract:
\`\`\`bash
forge create --rpc-url $BASE_SEPOLIA_RPC \\
  --private-key $PRIVATE_KEY \\
  --etherscan-api-key $BASESCAN_API_KEY \\
  --verify \\
  src/CrossyRoadAchievements.sol:CrossyRoadAchievements
\`\`\`

#### Option 2: Using Remix IDE

1. Go to https://remix.ethereum.org
2. Create new files for both contracts
3. Paste contract code
4. Compile with Solidity 0.8.20+
5. Deploy using MetaMask connected to Base Sepolia:
   - Network: Base Sepolia
   - RPC: https://sepolia.base.org
   - Chain ID: 84532
   - Currency: ETH

6. Copy deployed contract addresses

### Update Frontend

After deployment, update the contract addresses in:
\`app/contracts/addresses.ts\`

\`\`\`typescript
export const CONTRACT_ADDRESSES = {
  tournament: "0xYOUR_TOURNAMENT_CONTRACT_ADDRESS",
  achievements: "0xYOUR_ACHIEVEMENTS_CONTRACT_ADDRESS",
} as const;
\`\`\`

## Contract Interactions

### Tournament Contract

**Enter Tournament:**
\`\`\`typescript
await writeContract({
  address: TOURNAMENT_ADDRESS,
  abi: TOURNAMENT_ABI,
  functionName: "enterTournament",
  value: entryFee, // In Wei
});
\`\`\`

**Submit Score:**
\`\`\`typescript
await writeContract({
  address: TOURNAMENT_ADDRESS,
  abi: TOURNAMENT_ABI,
  functionName: "submitScore",
  args: [score],
});
\`\`\`

### Achievements Contract

**Update Player Score (Owner only):**
\`\`\`typescript
await writeContract({
  address: ACHIEVEMENTS_ADDRESS,
  abi: ACHIEVEMENTS_ABI,
  functionName: "updateScore",
  args: [playerAddress, newScore],
});
\`\`\`

**Get Player Achievements:**
\`\`\`typescript
const achievements = await readContract({
  address: ACHIEVEMENTS_ADDRESS,
  abi: ACHIEVEMENTS_ABI,
  functionName: "getPlayerAchievements",
  args: [playerAddress],
});
\`\`\`

## Testing

Get Base Sepolia testnet ETH:
- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia

## Security Considerations

1. **Tournament Contract:**
   - ReentrancyGuard protects prize distribution
   - Platform fee capped at 10%
   - Only owner can create tournaments
   - Finalization requires tournament to be ended

2. **Achievements Contract:**
   - Only owner can update scores (should be backend server)
   - Each achievement can only be minted once per player
   - Scores must increase to trigger achievements

## Gas Optimization

- Use calldata for read-only arrays
- Batch achievement checks in single transaction
- Store minimal data on-chain
- Use events for indexing

## Future Enhancements

- [ ] Chainlink VRF for fair winner selection
- [ ] Multi-tier prize distribution (1st, 2nd, 3rd)
- [ ] Referral system
- [ ] Season-based tournaments
- [ ] Achievement trading/marketplace
- [ ] Token-gated tournaments

## License

MIT
