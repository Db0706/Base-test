"use client";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Leaderboard from "../components/Leaderboard";
import styles from "./leaderboard.module.css";

export default function LeaderboardPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1>Leaderboard</h1>
            <p>Top players competing on Crossy Road</p>
          </div>
          <Leaderboard />
        </div>
      </main>
      <Navigation />
    </div>
  );
}
