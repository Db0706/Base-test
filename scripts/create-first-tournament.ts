import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
} catch (error) {
  console.log('No .env.local file found, using existing environment variables');
}

// Tournament contract ABI
const TOURNAMENT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_startTime', type: 'uint256' },
      { internalType: 'uint256', name: '_endTime', type: 'uint256' },
      { internalType: 'uint256', name: '_entryFee', type: 'uint256' },
    ],
    name: 'createTournament',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentTournamentId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TOURNAMENT_ADDRESS = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B' as const;

async function createFirstTournament() {
  try {
    // Get private key from environment variable
    const privateKey = process.env.TOURNAMENT_MANAGER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TOURNAMENT_MANAGER_PRIVATE_KEY not set in environment');
    }

    console.log('🎮 Initializing tournament contract...\n');

    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    console.log(`📝 Using account: ${account.address}\n`);

    // Check if tournament already exists
    try {
      const currentTournamentId = await publicClient.readContract({
        address: TOURNAMENT_ADDRESS,
        abi: TOURNAMENT_ABI,
        functionName: 'currentTournamentId',
      });

      if (currentTournamentId && currentTournamentId > 0n) {
        console.log(`⚠️  Tournament already exists! Current ID: ${currentTournamentId}`);
        return;
      }
    } catch (error) {
      console.log('No tournament found. Creating first tournament...\n');
    }

    // Create tournament (24 hours from now)
    const now = Math.floor(Date.now() / 1000);
    const startTime = BigInt(now);
    const endTime = BigInt(now + 24 * 60 * 60); // 24 hours
    const entryFee = parseEther('0.001');

    console.log(`⏰ Start time: ${new Date(now * 1000).toLocaleString()}`);
    console.log(`⏰ End time: ${new Date((now + 24 * 60 * 60) * 1000).toLocaleString()}`);
    console.log(`💰 Entry fee: 0.001 ETH\n`);

    console.log('📤 Sending transaction...');

    const hash = await walletClient.writeContract({
      address: TOURNAMENT_ADDRESS,
      abi: TOURNAMENT_ABI,
      functionName: 'createTournament',
      args: [startTime, endTime, entryFee],
    });

    console.log(`📝 Transaction hash: ${hash}\n`);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // Verify the tournament was created
    const newTournamentId = await publicClient.readContract({
      address: TOURNAMENT_ADDRESS,
      abi: TOURNAMENT_ABI,
      functionName: 'currentTournamentId',
    });

    console.log(`🎉 Success! Tournament ID: ${newTournamentId}`);
    console.log(`\n🔗 View on BaseScan: https://sepolia.basescan.org/tx/${hash}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
createFirstTournament()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
