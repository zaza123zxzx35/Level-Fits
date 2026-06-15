import React, { useState } from "react";
import { UserProfile } from "../types";
import { auth, db } from "../firebase";
import { doc, updateDoc, deleteDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import { ShieldAlert, LogOut, Check, Edit2, Key, HelpCircle, RefreshCw, Star } from "lucide-react";

interface ProfileViewProps {
  currentUser: UserProfile;
  onRefreshProfile: () => Promise<void>;
  onLogout: () => void;
}

export function ProfileView({ currentUser, onRefreshProfile, onLogout }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [nameField, setNameField] = useState(currentUser.displayName);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Edit display name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameField.trim() || nameField === currentUser.displayName) {
      setEditing(false);
      return;
    }
    setUpdating(true);
    try {
      if (currentUser.uid.startsWith("guest_")) {
        const updatedProfile = { ...currentUser, displayName: nameField.trim() };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        await onRefreshProfile();
        setEditing(false);
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, {
        displayName: nameField.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await onRefreshProfile();
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Reset character stats and levels for interactive debugging
  const handleResetCharacter = async () => {
    if (!window.confirm("Warning: This ritual resets your character to level 1, purges your workouts logs and completed quests. Proceed?")) return;
    setResetting(true);
    try {
      if (currentUser.uid.startsWith("guest_")) {
        const resetProfile = {
          ...currentUser,
          level: 1,
          xp: 0,
          streak: 0,
          lastWorkoutDate: null,
          stats: { STR: 10, AGI: 10, END: 10, VIT: 10 },
          badges: ["novice_badge"],
          shadows: []
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(resetProfile));
        localStorage.removeItem(`workouts_${currentUser.uid}`);
        localStorage.removeItem(`quests_${currentUser.uid}`);
        await onRefreshProfile();
        alert("Character profile rejuvenated back to Initiate level!");
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      // Reset profile fields
      await updateDoc(userRef, {
        level: 1,
        xp: 0,
        streak: 0,
        lastWorkoutDate: null,
        stats: { STR: 10, AGI: 10, END: 10, VIT: 10 },
        badges: ["novice_badge"],
      });

      // Clear workouts
      const workoutsQuery = await getDocs(collection(db, `users/${currentUser.uid}/workouts`));
      const batchWorkouts = writeBatch(db);
      workoutsQuery.forEach((docSnap) => batchWorkouts.delete(docSnap.ref));
      await batchWorkouts.commit();

      // Clear quests
      const questsQuery = await getDocs(collection(db, `users/${currentUser.uid}/quests`));
      const batchQuests = writeBatch(db);
      questsQuery.forEach((docSnap) => batchQuests.delete(docSnap.ref));
      await batchQuests.commit();

      await onRefreshProfile();
      alert("Character profile rejuvenated back to Initiate level!");
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <div className="p-6 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-6">
        <h3 className="text-xl font-display font-semibold text-[#EDE6FA] tracking-wide">
          Arcane Account Configurations
        </h3>

        <div className="space-y-4 font-mono">
          {/* Display Name */}
          <div className="flex justify-between items-center py-1 border-b border-white/10 text-sm">
            <span className="text-[#9A8FB8]">HERO HANDLE:</span>
            {editing ? (
              <form onSubmit={handleUpdateName} className="flex gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={nameField}
                  onChange={(e) => setNameField(e.target.value)}
                  className="bg-[#15101F] text-[#EDE6FA] rounded px-2 py-1 text-xs font-mono h-[32px] border border-white/10"
                />
                <button
                  type="submit"
                  disabled={updating}
                  className="p-1 px-2.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] rounded-full text-xs uppercase font-black cursor-pointer"
                  style={{ minHeight: "32px" }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[#EDE6FA] font-bold">{currentUser.displayName}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 text-[#C9B8F0] hover:text-[#EDE6FA] cursor-pointer"
                  style={{ minWidth: "32px", minHeight: "32px" }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="flex justify-between items-center py-1 border-b border-white/10 text-sm">
            <span className="text-[#9A8FB8]">REGISTERED EMAIL:</span>
            <span className="text-[#C7BBE2] select-all">{currentUser.email}</span>
          </div>

          {/* ID */}
          <div className="flex justify-between items-center py-1 border-b border-white/10 text-[11px]">
            <span className="text-[#9A8FB8]">HERO UUID:</span>
            <span className="text-[#9A8FB8] select-all font-sans">{currentUser.uid}</span>
          </div>

          {/* Class */}
          <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-[#9A8FB8]">CHARACTER CLASS:</span>
            <span className="text-[#C9B8F0] font-black uppercase">{currentUser.characterClass}</span>
          </div>
        </div>

        {success && <p className="text-[#C9B8F0] text-xs font-mono">Destiny handle restructured!</p>}
      </div>

      {/* Dangerous Operations Zone */}
      <div className="p-6 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <h3 className="text-lg font-display font-semibold text-rose-300/80 tracking-wide flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-300/80 animate-pulse" /> Extreme Operations Zone
        </h3>
        <p className="text-xs text-[#9A8FB8] font-mono">
          Perform administrative actions to clean cache, refresh profiles, or reset character histories completely.
        </p>

        <div className="space-y-3 pt-2">
          {/* Debug reset */}
          <button
            onClick={handleResetCharacter}
            disabled={resetting}
            className="w-full py-3 frost text-rose-300/80 hover:text-rose-200 font-bold uppercase rounded-full transition-colors font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
            style={{ minHeight: "44px" }}
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetting Hero..." : "Rejuvenate Character (Reset Stats)"}
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full py-3 frost text-rose-300/80 hover:text-rose-200 font-bold uppercase rounded-full transition-colors font-mono text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            <LogOut className="w-4 h-4" /> Exit Realm (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}
