# Crossy Road on Base - Web3 Game Integration

A wallet-gated Crossy Road game built on Base blockchain using OnchainKit and Next.js.

## Features

### 🔐 Wallet Gating
- **Connect to Play**: Users must connect their wallet to access the game
- **Powered by OnchainKit**: Uses Coinbase's OnchainKit for seamless wallet integration
- **Base Network**: Built on Base L2 for fast, low-cost transactions

### 🎮 Game Features
- **Three.js Graphics**: Beautiful 3D Crossy Road game
- **Real-time Score Tracking**: Scores update in real-time as you play
- **Personal High Scores**: Each wallet tracks its own high score
- **Persistent Storage**: High scores saved to localStorage per wallet address

### 🏆 Leaderboard
- **Global Rankings**: See top 10 players across all wallets
- **Personal Stats**: View your wallet address and high score
- **Timestamp Tracking**: See when high scores were achieved
- **Beautiful UI**: Glassmorphism design with animations

## How to Play

1. **Connect Wallet**
   - Click the wallet button in the top-right corner
   - Connect your wallet (Coinbase Wallet, MetaMask, etc.)
   - Make sure you're on Base network

2. **Start Game**
   - Once connected, you'll see the game start screen
   - View your wallet address and current high score
   - Click "Start Game" to begin playing

3. **Game Controls**
   - Use the on-screen arrow buttons to move
   - Forward: Move the chicken forward
   - Left/Right: Move sideways
   - Backward: Move back
   - Avoid cars and trucks!

4. **Score Tracking**
   - Your score increases as you move forward
   - When you beat your high score, it's automatically saved
   - Scores are linked to your wallet address

5. **Leaderboard**
   - Click "Show Leaderboard" to see top players
   - Your best score appears if you're in the top 100

## Tech Stack

- **Next.js 15**: React framework
- **OnchainKit**: Coinbase's toolkit for Base integration
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **Three.js**: 3D graphics for the game
- **Base**: Coinbase's L2 blockchain

## API Endpoints

### POST `/api/scores`
Save a new score for a wallet address.

**Request:**
```json
{
  "address": "0x...",
  "score": 42,
  "signature": "0x..." // Optional for future verification
}
```

**Response:**
```json
{
  "success": true,
  "highScore": 42
}
```

### GET `/api/scores?address=0x...`
Get scores for a specific address.

**Response:**
```json
{
  "scores": [...],
  "highScore": 42
}
```

### GET `/api/scores`
Get global leaderboard.

**Response:**
```json
{
  "leaderboard": [
    {
      "address": "0x...",
      "score": 100,
      "timestamp": 1234567890
    }
  ]
}
```

## Future Enhancements

### On-Chain Score Storage
Currently, scores are stored in localStorage and server memory. Future versions could:
- Store scores as NFTs on Base
- Use a smart contract for leaderboard
- Implement score verification with signatures
- Add rewards/tokens for high scores

### Additional Features
- **Multiplayer Mode**: Compete in real-time
- **NFT Skins**: Unlock character skins as NFTs
- **Token Rewards**: Earn tokens for achievements
- **Tournaments**: Time-limited competitions
- **Social Features**: Share scores to Farcaster
- **Power-ups**: Purchase power-ups with crypto

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file:

```env
NEXT_PUBLIC_PROJECT_NAME="your-project-name"
NEXT_PUBLIC_ONCHAINKIT_API_KEY="your-api-key"
NEXT_PUBLIC_URL="https://your-domain.com"
```

## Security Notes

⚠️ **Current Implementation**:
- Scores are stored client-side (localStorage)
- No signature verification yet
- Anyone can submit scores via API

🔒 **Recommended for Production**:
- Implement signature verification
- Use on-chain storage or verified database
- Add rate limiting
- Implement anti-cheat measures
- Verify wallet ownership

## License

MIT

## Credits

- Original Crossy Road game clone by Talha
- Integrated with Base blockchain by the community
- Built with OnchainKit by Coinbase
