import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Your tournament contract ABI (minimal version for cron job)
const TOURNAMENT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_tournamentId', type: 'uint256' }],
    name: 'finalizeTournament',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
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
  {
    inputs: [{ internalType: 'uint256', name: '_tournamentId', type: 'uint256' }],
    name: 'getTournamentInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'uint256', name: 'entryFee', type: 'uint256' },
          { internalType: 'uint256', name: 'prizePool', type: 'uint256' },
          { internalType: 'address', name: 'winner', type: 'address' },
          { internalType: 'uint256', name: 'winningScore', type: 'uint256' },
          { internalType: 'bool', name: 'finalized', type: 'bool' },
          { internalType: 'uint256', name: 'participantCount', type: 'uint256' },
        ],
        internalType: 'struct CrossyRoadTournament.TournamentInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const TOURNAMENT_ADDRESS = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B' as const;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get private key from environment variable
    let privateKey = process.env.TOURNAMENT_MANAGER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'TOURNAMENT_MANAGER_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    // Clean and validate private key
    privateKey = privateKey.trim(); // Remove any whitespace

    // Remove 0x prefix if present, then add it back
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.slice(2);
    }

    // Validate it's a valid hex string of correct length
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      return NextResponse.json(
        { error: 'Invalid private key format' },
        { status: 500 }
      );
    }

    // Add 0x prefix
    privateKey = `0x${privateKey}`;

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

    // Get current tournament ID
    const currentTournamentId = await publicClient.readContract({
      address: TOURNAMENT_ADDRESS,
      abi: TOURNAMENT_ABI,
      functionName: 'currentTournamentId',
    });

    if (!currentTournamentId) {
      return NextResponse.json({ error: 'No tournament found' }, { status: 404 });
    }

    // Get tournament info
    const tournamentInfo = await publicClient.readContract({
      address: TOURNAMENT_ADDRESS,
      abi: TOURNAMENT_ABI,
      functionName: 'getTournamentInfo',
      args: [currentTournamentId],
    });

    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(tournamentInfo.endTime);
    const finalized = tournamentInfo.finalized;

    // Check if tournament has ended and needs finalization
    if (now >= endTime && !finalized) {
      console.log(`Finalizing tournament ${currentTournamentId}...`);

      // Finalize the tournament
      const finalizeHash = await walletClient.writeContract({
        address: TOURNAMENT_ADDRESS,
        abi: TOURNAMENT_ABI,
        functionName: 'finalizeTournament',
        args: [currentTournamentId],
      });

      // Wait for finalization transaction
      await publicClient.waitForTransactionReceipt({ hash: finalizeHash });

      console.log(`Tournament ${currentTournamentId} finalized! TX: ${finalizeHash}`);

      // Create new tournament (24 hours from now)
      const newStartTime = BigInt(now);
      const newEndTime = BigInt(now + 24 * 60 * 60); // 24 hours
      const entryFee = parseEther('0.001');

      console.log('Creating new tournament...');

      const createHash = await walletClient.writeContract({
        address: TOURNAMENT_ADDRESS,
        abi: TOURNAMENT_ABI,
        functionName: 'createTournament',
        args: [newStartTime, newEndTime, entryFee],
      });

      // Wait for creation transaction
      await publicClient.waitForTransactionReceipt({ hash: createHash });

      console.log(`New tournament created! TX: ${createHash}`);

      return NextResponse.json({
        success: true,
        message: 'Tournament finalized and new one created',
        finalizeTx: finalizeHash,
        createTx: createHash,
        previousTournamentId: currentTournamentId.toString(),
        winner: tournamentInfo.winner,
        prizePool: tournamentInfo.prizePool.toString(),
      });
    } else if (finalized) {
      return NextResponse.json({
        success: false,
        message: 'Tournament already finalized',
        tournamentId: currentTournamentId.toString(),
      });
    } else {
      const timeLeft = endTime - now;
      return NextResponse.json({
        success: false,
        message: 'Tournament still active',
        tournamentId: currentTournamentId.toString(),
        endsIn: `${Math.floor(timeLeft / 3600)} hours`,
      });
    }
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
