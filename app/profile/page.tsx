"use client";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Achievements from "../components/Achievements";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (address) {
      // Load profile data from localStorage
      const savedName = localStorage.getItem(`profile_name_${address}`);
      const savedBio = localStorage.getItem(`profile_bio_${address}`);
      const savedHighScore = localStorage.getItem(`highScore_${address}`);

      if (savedName) setName(savedName);
      if (savedBio) setBio(savedBio);
      if (savedHighScore) setHighScore(parseInt(savedHighScore));
    }
  }, [address, isConnected, router]);

  const handleSave = () => {
    if (address) {
      localStorage.setItem(`profile_name_${address}`, name);
      localStorage.setItem(`profile_bio_${address}`, bio);
      setIsEditing(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {name ? name.charAt(0).toUpperCase() : address?.slice(2, 4).toUpperCase()}
            </div>
            <h1 className={styles.title}>
              {name || `Player ${address?.slice(0, 6)}`}
            </h1>
            <p className={styles.address}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{highScore}</div>
              <div className={styles.statLabel}>High Score</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Profile Info</h2>
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>

            {isEditing ? (
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={150}
                    rows={4}
                    className={styles.textarea}
                  />
                  <div className={styles.charCount}>{bio.length}/150</div>
                </div>

                <button className={styles.saveButton} onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            ) : (
              <div className={styles.profileInfo}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Name</div>
                  <div className={styles.infoValue}>
                    {name || "Not set"}
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>Bio</div>
                  <div className={styles.infoValue}>
                    {bio || "No bio yet"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Achievements</h2>
            <Achievements />
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
