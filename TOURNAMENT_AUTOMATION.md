# Tournament Automation Setup

This guide explains how to set up automated 24-hour tournament cycles.

## How It Works

Every hour, a cron job checks if the current tournament has ended. If it has:
1. ✅ Finalizes the tournament (pays out the winner)
2. ✅ Creates a new 24-hour tournament automatically
3. ✅ The cycle repeats forever

## Setup Instructions

### Step 1: Create a Tournament Manager Wallet

You need a dedicated wallet for the automation bot:

1. Create a new MetaMask wallet (don't use your main wallet!)
2. Export the private key (Settings → Security & Privacy → Show Private Key)
3. Fund it with ~0.01 ETH on Base Sepolia (for gas fees)

⚠️ **SECURITY WARNING**: This private key will be stored as an environment variable. Never share it!

### Step 2: Add Environment Variables

You need to add these to your `.env.local` file:

```bash
# Tournament Manager Private Key (the wallet that will finalize/create tournaments)
TOURNAMENT_MANAGER_PRIVATE_KEY=0xyour_private_key_here

# Cron Secret (random string to secure the cron endpoint)
CRON_SECRET=your_random_secret_here_make_it_long_and_random
```

**Generate a random CRON_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or just make up a long random string
```

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `TOURNAMENT_MANAGER_PRIVATE_KEY`
   - `CRON_SECRET`
4. Deploy!

Vercel will automatically run the cron job **every hour** (as configured in `vercel.json`).

## Testing Locally

You can test the cron job manually:

```bash
# Make sure your .env.local has the required variables
curl http://localhost:3002/api/cron/tournament \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How the Cron Job Works

### Schedule
- Runs **every hour** (`0 * * * *` in cron syntax)
- Checks if current tournament has ended
- Only acts when tournament is past end time

### Actions
1. **Check Tournament Status**
   - Reads current tournament from blockchain
   - Checks if it's past end time
   - Checks if it's already finalized

2. **Finalize Tournament** (if ended)
   - Calls `finalizeTournament(tournamentId)`
   - Sends prize pool (80%) to winner
   - Keeps platform fee (20%) in contract

3. **Create New Tournament**
   - Calls `createTournament(startTime, endTime, entryFee)`
   - Start time: Now
   - End time: 24 hours from now
   - Entry fee: 0.001 ETH

### Response Examples

**Tournament still active:**
```json
{
  "success": false,
  "message": "Tournament still active",
  "tournamentId": "1",
  "endsIn": "18 hours"
}
```

**Tournament finalized and new one created:**
```json
{
  "success": true,
  "message": "Tournament finalized and new one created",
  "finalizeTx": "0x...",
  "createTx": "0x...",
  "previousTournamentId": "1",
  "winner": "0x...",
  "prizePool": "8000000000000000"
}
```

## Withdrawing Platform Fees

As the contract owner, you can withdraw accumulated fees anytime:

1. Go to Remix IDE
2. Connect to your tournament contract
3. Call `withdrawFees()` function
4. All accumulated fees (20% of each tournament) will be sent to your wallet

## Monitoring

Check Vercel's cron logs to see when tournaments are finalized:
- Go to Vercel Dashboard → Your Project → Logs
- Filter by `/api/cron/tournament`

## Cost Estimate

**Gas fees per cycle:**
- Finalize tournament: ~$0.01
- Create new tournament: ~$0.01
- **Total per 24h:** ~$0.02

With **0.01 ETH** in the manager wallet, you can run ~500 tournament cycles (~1.5 years).

## Security Notes

1. ✅ The cron endpoint requires `CRON_SECRET` header
2. ✅ Only Vercel Cron (or authorized requests) can trigger it
3. ✅ Private key is stored securely in Vercel environment variables
4. ✅ Contract is Ownable - only your wallet can create tournaments

## Troubleshooting

**Cron job failing?**
- Check Vercel logs for errors
- Verify environment variables are set
- Ensure manager wallet has enough ETH for gas

**Tournament not finalizing?**
- Check if tournament has participants (requires at least 1)
- Verify end time has passed
- Check manager wallet has gas

**Need to stop automation?**
- Remove the `vercel.json` file
- Or remove environment variables
