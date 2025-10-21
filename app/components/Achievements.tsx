"use client";
import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ACHIEVEMENTS_ABI, ACHIEVEMENT_TYPES } from "../contracts/achievementsABI";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import styles from "./Achievements.module.css";

const ACHIEVEMENT_DATA = [
  {
    type: ACHIEVEMENT_TYPES.ROOKIE,
    name: "Rookie Crosser",
    description: "Score 50 points",
    icon: "🐣",
    color: "#10B981",
  },
  {
    type: ACHIEVEMENT_TYPES.ADVENTURER,
    name: "Bold Adventurer",
    description: "Score 100 points",
    icon: "⚔️",
    color: "#3B82F6",
  },
  {
    type: ACHIEVEMENT_TYPES.EXPERT,
    name: "Road Expert",
    description: "Score 150 points",
    icon: "🎯",
    color: "#8B5CF6",
  },
  {
    type: ACHIEVEMENT_TYPES.MASTER,
    name: "Crossing Master",
    description: "Score 200 points",
    icon: "👑",
    color: "#F59E0B",
  },
  {
    type: ACHIEVEMENT_TYPES.LEGEND,
    name: "Legendary Crosser",
    description: "Score 250 points",
    icon: "🏆",
    color: "#EF4444",
  },
];

export default function Achievements() {
  const { address } = useAccount();
  const [achievements, setAchievements] = useState<boolean[]>([false, false, false, false, false]);
  const [achievementCount, setAchievementCount] = useState(0);

  const { data: playerAchievements } = useReadContract({
    address: CONTRACT_ADDRESSES.achievements as `0x${string}`,
    abi: ACHIEVEMENTS_ABI,
    functionName: "getPlayerAchievements",
    args: address ? [address] : undefined,
  });

  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESSES.achievements as `0x${string}`,
    abi: ACHIEVEMENTS_ABI,
    functionName: "getAchievementCount",
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (playerAchievements) {
      setAchievements(playerAchievements as boolean[]);
    }
  }, [playerAchievements]);

  useEffect(() => {
    if (count !== undefined) {
      setAchievementCount(Number(count));
    }
  }, [count]);

  if (!address) {
    return null;
  }

  return (
    <div className={styles.achievements}>
      <div className={styles.header}>
        <h3>Achievements</h3>
        <div className={styles.count}>
          {achievementCount} / {ACHIEVEMENT_DATA.length}
        </div>
      </div>

      <div className={styles.grid}>
        {ACHIEVEMENT_DATA.map((achievement, index) => {
          const unlocked = achievements[achievement.type];

          return (
            <div
              key={achievement.type}
              className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
              style={{
                borderColor: unlocked ? achievement.color : "#E5E7EB",
              }}
            >
              <div
                className={styles.icon}
                style={{
                  backgroundColor: unlocked ? achievement.color : "#F3F4F6",
                }}
              >
                {unlocked ? achievement.icon : "🔒"}
              </div>

              <div className={styles.info}>
                <div className={styles.name}>{achievement.name}</div>
                <div className={styles.description}>{achievement.description}</div>
              </div>

              {unlocked && <div className={styles.checkmark}>✓</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
