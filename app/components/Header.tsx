"use client";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import styles from "./Header.module.css";

export default function Header() {
  const { address, isConnected } = useAccount();

  // Generate a simple avatar based on address
  const getAvatarColor = (addr: string | undefined) => {
    if (!addr) return "#0052FF";
    const hash = addr.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  const getInitials = (addr: string | undefined) => {
    if (!addr) return "?";
    return addr.slice(2, 4).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Crossy Road</span>
          <span className={styles.baseBadge}>on Base</span>
        </div>

        <div className={styles.walletSection}>
          {isConnected && address ? (
            <div className={styles.profileContainer}>
              <div
                className={styles.avatar}
                style={{ backgroundColor: getAvatarColor(address) }}
              >
                <span className={styles.avatarInitials}>
                  {getInitials(address)}
                </span>
              </div>
            </div>
          ) : (
            <ConnectWallet />
          )}
        </div>
      </div>
    </header>
  );
}
