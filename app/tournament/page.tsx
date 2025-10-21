"use client";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Tournament from "../components/Tournament";
import styles from "./tournament.module.css";

export default function TournamentPage() {
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
            <h1>Tournament</h1>
            <p>Compete for the prize pool by entering and scoring high!</p>
          </div>
          <Tournament />
          <div className={styles.infoSection}>
            <h2>How It Works</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Enter Tournament</h3>
                  <p>Pay the entry fee to join the current tournament</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Play & Score</h3>
                  <p>Play Crossy Road and submit your best score</p>
                </div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Win Prizes</h3>
                  <p>Highest score wins the prize pool when tournament ends</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
