"use client";
import { useEffect, useState, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { saveScore } from "./Leaderboard";
import { TOURNAMENT_ABI } from "../contracts/tournamentABI";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import styles from "./Game.module.css";

export default function Game() {
  const { address, isConnected } = useAccount();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSavedScoreRef = useRef(0);

  // Tournament contract integration
  const { writeContract: submitTournamentScore } = useWriteContract();

  // Check if player has entered current tournament
  const { data: currentTournamentId } = useReadContract({
    address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "currentTournamentId",
  });

  const { data: hasEnteredTournament } = useReadContract({
    address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "hasPlayerEntered",
    args: currentTournamentId && address ? [currentTournamentId, address] : undefined,
  });

  useEffect(() => {
    // Listen for score updates from the game iframe
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data.score !== "number") return;

      // Handle real-time score updates for UI display
      if (event.data.type === "scoreUpdate") {
        const currentScore = event.data.score;
        setScore(currentScore);

        // Update high score in state if exceeded (but don't save to leaderboard yet)
        if (currentScore > highScore) {
          setHighScore(currentScore);
        }
      }

      // Handle game over event - only save to leaderboard on death
      if (event.data.type === "gameOver") {
        const finalScore = event.data.score;
        setScore(finalScore);

        // Only save to leaderboard if score surpasses previously saved high score
        if (address && finalScore > lastSavedScoreRef.current && finalScore > 0) {
          saveScore(address, finalScore);
          lastSavedScoreRef.current = finalScore;
          setHighScore(finalScore);

          // Submit score to tournament contract if player has entered
          if (hasEnteredTournament && finalScore > 0) {
            try {
              submitTournamentScore({
                address: CONTRACT_ADDRESSES.tournament as `0x${string}`,
                abi: TOURNAMENT_ABI,
                functionName: "submitScore",
                args: [BigInt(finalScore)],
              });
            } catch (error) {
              console.error("Error submitting tournament score:", error);
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [highScore, address, hasEnteredTournament, submitTournamentScore]);

  // Load high score from localStorage and leaderboard
  useEffect(() => {
    if (address) {
      const savedHighScore = localStorage.getItem(`highScore_${address}`);
      if (savedHighScore) {
        const highScoreValue = parseInt(savedHighScore);
        setHighScore(highScoreValue);
        lastSavedScoreRef.current = highScoreValue;
      }

      // Also check leaderboard for saved score
      const stored = localStorage.getItem("leaderboard");
      if (stored) {
        try {
          const entries = JSON.parse(stored);
          const userEntry = entries.find((e: { address: string; score: number }) => e.address === address);
          if (userEntry && userEntry.score > lastSavedScoreRef.current) {
            lastSavedScoreRef.current = userEntry.score;
            setHighScore(userEntry.score);
          }
        } catch (e) {
          console.error("Failed to parse leaderboard", e);
        }
      }
    }
  }, [address]);

  // Save high score to localStorage
  useEffect(() => {
    if (address && highScore > 0) {
      localStorage.setItem(`highScore_${address}`, highScore.toString());
    }
  }, [highScore, address]);

  const startGame = () => {
    setIsGameActive(true);
    setScore(0);
    // Reload iframe to reset game state
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.walletGate}>
        <div className={styles.walletGateContent}>
          <h2>Connect Wallet to Play</h2>
          <p>Please connect your wallet to start playing Crossy Road</p>
          <div className={styles.lockIcon}>🔒</div>
        </div>
      </div>
    );
  }

  if (!isGameActive) {
    return (
      <div className={styles.gameStart}>
        <div className={styles.gameStartContent}>
          <h1>Crossy Road on Base</h1>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>High Score</span>
              <span className={styles.statValue}>{highScore}</span>
            </div>
          </div>
          <button className={styles.startButton} onClick={startGame}>
            Start Game
          </button>
          <p className={styles.hint}>
            Navigate using Tournament, Leaderboard, and Profile below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <div className={styles.scoreBoard}>
          <div className={styles.scoreItem}>
            <span>Score: {score}</span>
          </div>
          <div className={styles.scoreItem}>
            <span>High: {highScore}</span>
          </div>
        </div>
        <button
          className={styles.backButton}
          onClick={() => setIsGameActive(false)}
        >
          Back
        </button>
      </div>
      <div className={styles.iframeWrapper}>
        <iframe
          ref={iframeRef}
          src="/CrossyRoads/index.html"
          className={styles.gameIframe}
          title="Crossy Road Game"
        />
      </div>
    </div>
  );
}
