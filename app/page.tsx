"use client";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Game from "./components/Game";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Game />
      <Navigation />
    </div>
  );
}
