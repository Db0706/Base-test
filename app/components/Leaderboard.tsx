"use client";
import { useEffect, useState } from "react";
import styles from "./Leaderboard.module.css";

interface LeaderboardEntry {
  address: string;
  score: number;
  timestamp: number;
}

interface LeaderboardProps {
  refreshTrigger?: number;
}

export default function Leaderboard({ refreshTrigger }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [refreshTrigger]);

  const loadLeaderboard = () => {
    // Load from localStorage for now (can be upgraded to on-chain later)
    const stored = localStorage.getItem("leaderboard");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setEntries(data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score).slice(0, 10));
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      }
    }
    setIsLoading(false);
  };

  const getPlayerName = (address: string) => {
    const savedName = localStorage.getItem(`profile_name_${address}`);
    return savedName || `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={styles.leaderboard}>
        <h2>Leaderboard</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.leaderboard}>
      <h2>Top Players</h2>
      {entries.length === 0 ? (
        <p className={styles.empty}>No scores yet. Be the first to play!</p>
      ) : (
        <div className={styles.entries}>
          {entries.map((entry, index) => (
            <div key={`${entry.address}-${entry.timestamp}`} className={styles.entry}>
              <div className={styles.rank}>#{index + 1}</div>
              <div className={styles.details}>
                <div className={styles.address}>{getPlayerName(entry.address)}</div>
                <div className={styles.date}>{formatDate(entry.timestamp)}</div>
              </div>
              <div className={styles.score}>{entry.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function saveScore(address: string, score: number) {
  const stored = localStorage.getItem("leaderboard");
  let entries: LeaderboardEntry[] = [];

  if (stored) {
    try {
      entries = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse leaderboard", e);
    }
  }

  // Find existing entry for this address
  const existingIndex = entries.findIndex(entry => entry.address === address);

  if (existingIndex !== -1) {
    // Update only if new score is higher
    if (score > entries[existingIndex].score) {
      entries[existingIndex] = {
        address,
        score,
        timestamp: Date.now(),
      };
    }
  } else {
    // Add new entry for new address
    entries.push({
      address,
      score,
      timestamp: Date.now(),
    });
  }

  // Sort by score descending and keep only top 100
  entries.sort((a, b) => b.score - a.score);
  entries = entries.slice(0, 100);

  localStorage.setItem("leaderboard", JSON.stringify(entries));
}
