"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { TOURNAMENT_ABI } from "../contracts/tournamentABI";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import styles from "./Tournament.module.css";

interface TournamentInfo {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  entryFee: bigint;
  prizePool: bigint;
  winner: string;
  winningScore: bigint;
  finalized: boolean;
  participantCount: bigint;
}

export default function Tournament() {
  const { address } = useAccount();
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Read current tournament ID
  const { data: currentTournamentId, refetch: refetchTournamentId, error: tournamentIdError } = useReadContract({
    address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "currentTournamentId",
  });

  // Log errors
  useEffect(() => {
    if (tournamentIdError) {
      console.error("Error fetching tournament ID:", tournamentIdError);
    }
  }, [tournamentIdError]);

  // Read tournament info
  const { data: tournamentData, refetch: refetchTournamentInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "getTournamentInfo",
    args: currentTournamentId ? [currentTournamentId] : undefined,
  });

  // Check if player has entered
  const { data: playerEntered, refetch: refetchPlayerEntered } = useReadContract({
    address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "hasPlayerEntered",
    args: currentTournamentId && address ? [currentTournamentId, address] : undefined,
  });

  // Write functions
  const { writeContract: enterTournament, data: enterHash } = useWriteContract();

  const { isLoading: isEntering, isSuccess: hasEnteredSuccess } = useWaitForTransactionReceipt({
    hash: enterHash,
  });

  useEffect(() => {
    if (tournamentData) {
      console.log("Tournament data:", tournamentData);
      setTournamentInfo(tournamentData as TournamentInfo);
    }
  }, [tournamentData]);

  useEffect(() => {
    console.log("Current Tournament ID:", currentTournamentId);
    console.log("Tournament Info:", tournamentInfo);
    console.log("Has Entered:", hasEntered);
    console.log("Player Entered Data:", playerEntered);
  }, [currentTournamentId, tournamentInfo, hasEntered, playerEntered]);

  useEffect(() => {
    if (playerEntered !== undefined) {
      setHasEntered(playerEntered as boolean);
    }
  }, [playerEntered]);

  useEffect(() => {
    if (hasEnteredSuccess) {
      refetchPlayerEntered();
      refetchTournamentInfo();
    }
  }, [hasEnteredSuccess, refetchPlayerEntered, refetchTournamentInfo]);

  // Update countdown timer
  useEffect(() => {
    if (!tournamentInfo) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(tournamentInfo.endTime);
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("Ended");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournamentInfo]);

  const handleEnterTournament = async () => {
    if (!tournamentInfo || !address) return;

    try {
      enterTournament({
        address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
        abi: TOURNAMENT_ABI,
        functionName: "enterTournament",
        value: tournamentInfo.entryFee,
      });
    } catch (error) {
      console.error("Error entering tournament:", error);
    }
  };

  if (!address) {
    return (
      <div className={styles.tournament}>
        <div className={styles.loading}>Connect wallet to view tournament</div>
      </div>
    );
  }

  if (!currentTournamentId) {
    return (
      <div className={styles.tournament}>
        <div className={styles.loading}>Loading tournament data...</div>
      </div>
    );
  }

  if (!tournamentInfo) {
    return (
      <div className={styles.tournament}>
        <div className={styles.header}>
          <h2>🏆 Tournament</h2>
        </div>
        <div className={styles.inactive}>
          Unable to load tournament. Make sure you're connected to Base Sepolia.
        </div>
      </div>
    );
  }

  const isActive =
    Math.floor(Date.now() / 1000) >= Number(tournamentInfo.startTime) &&
    Math.floor(Date.now() / 1000) < Number(tournamentInfo.endTime);

  return (
    <div className={styles.tournament}>
      <div className={styles.header}>
        <h2>🏆 Active Tournament</h2>
        <div className={styles.timer}>{timeLeft}</div>
      </div>

      <div className={styles.info}>
        <div className={styles.stat}>
          <span className={styles.label}>Entry Fee</span>
          <span className={styles.value}>{formatEther(tournamentInfo.entryFee)} ETH</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>Prize Pool</span>
          <span className={styles.value}>{formatEther(tournamentInfo.prizePool)} ETH</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>Players</span>
          <span className={styles.value}>{tournamentInfo.participantCount.toString()}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>Top Score</span>
          <span className={styles.value}>{tournamentInfo.winningScore.toString()}</span>
        </div>
      </div>

      {tournamentInfo.winner !== "0x0000000000000000000000000000000000000000" && (
        <div className={styles.leader}>
          <span className={styles.leaderLabel}>Current Leader:</span>
          <span className={styles.leaderAddress}>
            {tournamentInfo.winner.slice(0, 6)}...{tournamentInfo.winner.slice(-4)}
          </span>
        </div>
      )}

      {address && isActive && !hasEntered && (
        <button
          className={styles.enterButton}
          onClick={handleEnterTournament}
          disabled={isEntering}
        >
          {isEntering ? "Entering..." : `Enter Tournament (${formatEther(tournamentInfo.entryFee)} ETH)`}
        </button>
      )}

      {hasEntered && (
        <div className={styles.entered}>
          <span className={styles.checkmark}>✓</span>
          You're in! Play to compete for the prize pool!
        </div>
      )}

      {!isActive && (
        <div className={styles.inactive}>
          Tournament has ended
        </div>
      )}
    </div>
  );
}
