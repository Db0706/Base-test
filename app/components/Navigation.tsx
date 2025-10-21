"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Navigation.module.css";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Play", icon: "🎮" },
    { href: "/tournament", label: "Tournament", icon: "🏆" },
    { href: "/leaderboard", label: "Leaderboard", icon: "📊" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
