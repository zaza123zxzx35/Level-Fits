import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, WorkoutLog, Quest, WorkoutCategory, CharacterClass } from "./types";
import { AuthScreen } from "./components/AuthScreen";
import { ParticleBackground } from "./components/ParticleBackground";
import { LevelUpSplash } from "./components/LevelUpSplash";
import { HomeOverview } from "./components/HomeOverview";
import { WorkoutLogger } from "./components/WorkoutLogger";
import { CharacterProfile } from "./components/CharacterProfile";
import { QuestsView } from "./components/QuestsView";
import { ProfileView } from "./components/ProfileView";
import { AchievementsView } from "./components/AchievementsView";
import { TransformationView } from "./components/TransformationView";
import { Home, Dumbbell, Shield, User, Sparkles, Flame, LogOut, Loader2, Compass, Volume2, VolumeX, Lock } from "lucide-react";
import { sfx } from "./utils/audio";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "transformation" | "workout" | "character" | "profile">("home");
  const [charSubTab, setCharSubTab] = useState<"status" | "quests" | "achievements">("status");
  const [sfxEnabled, setSfxEnabled] = useState(sfx.getEnabled());

  // Discipline Lock: when enabled and today's core ritual isn't done, other screens are blocked
  const [disciplineLocked, setDisciplineLocked] = useState(false);

  const changeTab = (tab: "home" | "transformation" | "workout" | "character" | "profile") => {
    setActiveTab(tab);
    sfx.playClick();
  };

  const changeCharSubTab = (subTab: "status" | "quests" | "achievements") => {
    setCharSubTab(subTab);
    sfx.playClick();
  };

  // History states
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Cinematic Level Up animation state
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpTarget, setLevelUpTarget] = useState(1);
  const [workoutSaving, setWorkoutSaving] = useState(false);

  // Solo Leveling Gates Opening States
  const [gatesOpen, setGatesOpen] = useState(false);
  const [gatesActive, setGatesActive] = useState(true);

  useEffect(() => {
    // Start sliding apart after 1200ms
    const slideTimer = setTimeout(() => {
      setGatesOpen(true);
    }, 1200);

    // Remove from DOM after transition completes
    const removeTimer = setTimeout(() => {
      setGatesActive(false);
    }, 2800);

    return () => {
      clearTimeout(slideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Authenticate listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const storedLastUser = localStorage.getItem("last_active_user_id");
    if (storedLastUser && storedLastUser.startsWith("guest_")) {
      loadUserProfile(storedLastUser);
    } else {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setAuthLoading(true);
        if (user) {
          localStorage.setItem("last_active_user_id", user.uid);
          // Load Profile from Firestore
          await loadUserProfile(user.uid);
        } else {
          setCurrentUser(null);
          setAuthLoading(false);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen to Workouts and Quests once user logs in
  useEffect(() => {
    if (!currentUser) {
      setWorkoutHistory([]);
      setQuests([]);
      return;
    }

    if (currentUser.uid.startsWith("guest_")) {
      // Load workouts & quests from local storage
      const localWorkouts = localStorage.getItem(`workouts_${currentUser.uid}`);
      setWorkoutHistory(localWorkouts ? JSON.parse(localWorkouts) : []);

      const localQuests = localStorage.getItem(`quests_${currentUser.uid}`);
      if (localQuests) {
        setQuests(JSON.parse(localQuests));
      } else {
        const defaultQuests: Quest[] = [
          {
            id: "quest_1",
            userId: currentUser.uid,
            title: "First Awakening",
            description: "Log any workout session to clear your first hunter threshold.",
            type: "Any",
            targetValue: 1,
            currentValue: 0,
            completed: false,
            xpReward: 300,
            createdAt: new Date().toISOString()
          },
          {
            id: "quest_2",
            userId: currentUser.uid,
            title: "Path of Strength",
            description: "Complete 15 total strength sets to level physical force.",
            type: "Strength",
            targetValue: 15,
            currentValue: 0,
            completed: false,
            xpReward: 500,
            createdAt: new Date().toISOString()
          },
          {
            id: "quest_3",
            userId: currentUser.uid,
            title: "Speed Raider",
            description: "Survive 30 minutes of Cardio drills.",
            type: "Cardio",
            targetValue: 30,
            currentValue: 0,
            completed: false,
            xpReward: 400,
            createdAt: new Date().toISOString()
          }
        ];
        setQuests(defaultQuests);
        localStorage.setItem(`quests_${currentUser.uid}`, JSON.stringify(defaultQuests));
      }
      return;
    }

    // Workouts dynamic listener
    const workoutsRef = collection(db, `users/${currentUser.uid}/workouts`);
    const unsubWorkouts = onSnapshot(workoutsRef, (snapshot) => {
      const history: WorkoutLog[] = [];
      snapshot.forEach((docSnap) => {
        history.push(docSnap.data() as WorkoutLog);
      });
      setWorkoutHistory(history);
    });

    // Quests dynamic listener
    const questsRef = collection(db, `users/${currentUser.uid}/quests`);
    const unsubQuests = onSnapshot(questsRef, (snapshot) => {
      const trials: Quest[] = [];
      snapshot.forEach((docSnap) => {
        trials.push(docSnap.data() as Quest);
      });
      setQuests(trials);
    });

    return () => {
      unsubWorkouts();
      unsubQuests();
    };
  }, [currentUser?.uid]);

  // Evaluate Discipline Lock on login (so it is enforced before the 21-Day tab is opened)
  useEffect(() => {
    if (!currentUser) {
      setDisciplineLocked(false);
      return;
    }
    let cancelled = false;
    const checkLock = async () => {
      try {
        let st: any = null;
        if (currentUser.uid.startsWith("guest_")) {
          const raw = localStorage.getItem(`transformation_${currentUser.uid}`);
          st = raw ? JSON.parse(raw) : null;
        } else {
          const ref = doc(db, `users/${currentUser.uid}/soloLeveling`, "transformation");
          const snap = await getDoc(ref);
          st = snap.exists() ? snap.data() : null;
        }

        if (!st || !st.disciplineLock || !st.startDate) {
          if (!cancelled) setDisciplineLocked(false);
          return;
        }

        const start = new Date(st.startDate + "T00:00:00").getTime();
        const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00").getTime();
        const dayNum = Math.floor((today - start) / 86400000) + 1;

        if (dayNum < 1 || dayNum > 21) {
          if (!cancelled) setDisciplineLocked(false);
          return;
        }

        const done = st.completions?.[dayNum];
        if (!cancelled) setDisciplineLocked(!(done && done.workout));
      } catch (e) {
        if (!cancelled) setDisciplineLocked(false);
      }
    };
    checkLock();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  // Load profile details
  const loadUserProfile = async (uid: string) => {
    try {
      if (uid.startsWith("guest_")) {
        const localProf = localStorage.getItem(`profile_${uid}`);
        if (localProf) {
          const profile = JSON.parse(localProf) as UserProfile;
          if (profile.statPoints === undefined) {
            profile.statPoints = 5;
          }

          // Check if user missed a day (skipped training daily system)
          if (profile.lastWorkoutDate) {
            const todayString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const lastDate = new Date(profile.lastWorkoutDate);
            const todayDate = new Date(todayString);
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays > 1 && !profile.debuffActive) {
              // Trigger Penalty!
              profile.debuffActive = true;
              profile.debuffReason = "Penalty Active: Skip Daily Training Ritual! Complete 1 workout session of any category to break the exhaust debuff! (-150 XP)";
              profile.xp = Math.max(profile.xp - 150, 0); // XP Penalty
              profile.punishmentQuestActive = true;
              profile.punishmentQuestProgress = 0;

              localStorage.setItem(`profile_${uid}`, JSON.stringify(profile));

              try {
                // Trigger toxic system notification
                const alertSp = new SpeechSynthesisUtterance("System warning. You have missed your ritual cycle. Penalty activated.");
                alertSp.pitch = 0.45;
                window.speechSynthesis.speak(alertSp);
              } catch(e){}
            }
          }

          setCurrentUser(profile);
        }
        setAuthLoading(false);
        return;
      }

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        if (profile.statPoints === undefined) {
          profile.statPoints = 5;
        }

        // Check if user missed a day (skipped training daily system)
        if (profile.lastWorkoutDate) {
          const todayString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
          const lastDate = new Date(profile.lastWorkoutDate);
          const todayDate = new Date(todayString);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays > 1 && !profile.debuffActive) {
            // Trigger Penalty!
            await updateDoc(docRef, {
              debuffActive: true,
              debuffReason: "Penalty Active: Skip Daily Training Ritual! Complete 1 workout session of any category to break the exhaust debuff!",
              xp: Math.max(profile.xp - 150, 0), // XP Penalty
              punishmentQuestActive: true,
              punishmentQuestProgress: 0
            });
            profile.debuffActive = true;
            profile.debuffReason = "Penalty Active: Skip Daily Training Ritual! Complete 1 workout session of any category to break the exhaust debuff!";
            profile.xp = Math.max(profile.xp - 150, 0);
            profile.punishmentQuestActive = true;
            profile.punishmentQuestProgress = 0;

            try {
              // Trigger toxic system notification
              const alertSp = new SpeechSynthesisUtterance("System warning. You have missed your ritual cycle. Penalty activated.");
              alertSp.pitch = 0.45;
              window.speechSynthesis.speak(alertSp);
            } catch(e){}
          }
        }

        setCurrentUser(profile);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
    }
  };

  // Log Workout and trigger core leveling, stats, quests and streak updates
  const handleLogWorkout = async (workout: {
    exerciseName: string;
    category: WorkoutCategory;
    sets: number;
    reps: number;
    duration: number;
    intensity: number;
    xpGained: number;
  }) => {
    if (!currentUser) return;
    setWorkoutSaving(true);

    try {
      const todayString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      let newStreak = currentUser.streak;

      // Calculate new streak
      if (!currentUser.lastWorkoutDate) {
        newStreak = 1;
      } else if (currentUser.lastWorkoutDate === todayString) {
        // Logged workout already today, keep streak the same
      } else {
        const lastDate = new Date(currentUser.lastWorkoutDate);
        const todayDate = new Date(todayString);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = currentUser.streak + 1; // Consecutive days
        } else if (diffDays > 1) {
          newStreak = 1; // Streak broken, resets to 1
        }
      }

      // Check for Solo Leveling Boss Workout (Shadow extraction eligibility)
      const totalReps = workout.sets * workout.reps;
      const isBossWorkout = (totalReps >= 200) || (workout.duration >= 60);

      const existingShadows = currentUser.shadows || [];
      const updatedShadows = [...existingShadows];

      if (isBossWorkout) {
        const shadowPool = ["shadow_infantry", "tank", "iron", "igris", "tusk", "beru", "bellion"];
        const nextExtract = shadowPool.find(s => !existingShadows.includes(s));
        if (nextExtract) {
          updatedShadows.push(nextExtract);

          // Vocal announcement
          try {
            const extractSp = new SpeechSynthesisUtterance("Boss workout cleared. Arise. Reanimating shadow soldier soul.");
            extractSp.pitch = 0.35;
            extractSp.rate = 0.8;
            window.speechSynthesis.speak(extractSp);
          } catch(e){}
        }
      }

      // Prepare Workout Log Document
      const workoutId = Math.random().toString(36).substring(2, 11);
      const logPayload: WorkoutLog = {
        id: workoutId,
        userId: currentUser.uid,
        exerciseName: workout.exerciseName,
        category: workout.category,
        sets: workout.sets,
        reps: workout.reps,
        duration: workout.duration,
        intensity: workout.intensity,
        xpGained: workout.xpGained,
        loggedAt: new Date().toISOString(),
      };

      // 2. Calculate Profile XP levels & stats adjustments
      let totalXp = currentUser.xp + workout.xpGained;
      let userLevel = currentUser.level;
      let shouldLevelUpAnim = false;
      let gainedStatPoints = 0;

      // Level limit formula (1000 XP per level)
      while (totalXp >= 1000) {
        totalXp -= 1000;
        userLevel += 1;
        shouldLevelUpAnim = true;
        gainedStatPoints += 5;
      }

      const finalStatPoints = (currentUser.statPoints || 0) + gainedStatPoints;

      // Incremental stat gains based on workout category
      const currentStats = { ...currentUser.stats };
      if (workout.category === "Strength") {
        currentStats.STR += 2;
        currentStats.VIT += 1;
      } else if (workout.category === "Cardio") {
        currentStats.END += 2;
        currentStats.AGI += 1;
      } else if (workout.category === "Flexibility") {
        currentStats.AGI += 2;
        currentStats.VIT += 1;
      } else if (workout.category === "Endurance") {
        currentStats.VIT += 2;
        currentStats.END += 1;
      }

      if (currentUser.uid.startsWith("guest_")) {
        // Local Guest Workouts Logic
        const currentLocalWorkouts = JSON.parse(localStorage.getItem(`workouts_${currentUser.uid}`) || "[]");
        const updatedLocalWorkouts = [logPayload, ...currentLocalWorkouts];
        localStorage.setItem(`workouts_${currentUser.uid}`, JSON.stringify(updatedLocalWorkouts));
        setWorkoutHistory(updatedLocalWorkouts);

        const updatedLocalProfile: UserProfile = {
          ...currentUser,
          xp: totalXp,
          level: userLevel,
          stats: currentStats,
          statPoints: finalStatPoints,
          streak: newStreak,
          lastWorkoutDate: todayString,
          shadows: updatedShadows,
          debuffActive: false,
          debuffReason: "",
          punishmentQuestActive: false
        };

        if (currentUser.debuffActive) {
          try {
            const clearSp = new SpeechSynthesisUtterance("Punishment survived. Debuff enforcement cleared.");
            clearSp.pitch = 0.55;
            window.speechSynthesis.speak(clearSp);
          } catch(e){}
        }

        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedLocalProfile));
        setCurrentUser(updatedLocalProfile);

        if (shouldLevelUpAnim) {
          try {
            sfx.playLevelUp();
          } catch(e){}
        }

        // Process Quest Goals locally
        const updatedLocalQuests = quests.map(quest => {
          if (quest.completed) return quest;

          let increment = 0;
          if (quest.type === workout.category || quest.type === "Any") {
            if (workout.category === "Strength") {
              increment = workout.sets;
            } else {
              increment = workout.duration;
            }
          }

          if (increment > 0) {
            return {
              ...quest,
              currentValue: quest.currentValue + increment
            };
          }
          return quest;
        });

        localStorage.setItem(`quests_${currentUser.uid}`, JSON.stringify(updatedLocalQuests));
        setQuests(updatedLocalQuests);

        if (shouldLevelUpAnim) {
          setLevelUpTarget(userLevel);
          setLevelUpVisible(true);
        }

        setWorkoutSaving(false);
        return;
      }

      const workoutDocRef = doc(db, `users/${currentUser.uid}/workouts`, workoutId);
      await setDoc(workoutDocRef, logPayload);

      // Update User Profile document (Clearing punishment and debuff dynamically if they were active!)
      const userRef = doc(db, "users", currentUser.uid);
      
      const updateData: any = {
        xp: totalXp,
        level: userLevel,
        stats: currentStats,
        statPoints: finalStatPoints,
        streak: newStreak,
        lastWorkoutDate: todayString,
        shadows: updatedShadows
      };

      if (currentUser.debuffActive) {
        updateData.debuffActive = false;
        updateData.debuffReason = "";
        updateData.punishmentQuestActive = false;

        try {
          const clearSp = new SpeechSynthesisUtterance("Punishment survived. Debuff enforcement cleared.");
          clearSp.pitch = 0.55;
          window.speechSynthesis.speak(clearSp);
        } catch(e){}
      }

      await updateDoc(userRef, updateData);


      // 3. Process Quest Goals in client subcollection
      quests.forEach(async (quest) => {
        if (quest.completed) return;

        let increment = 0;
        if (quest.type === workout.category || quest.type === "Any") {
          if (workout.category === "Strength") {
            increment = workout.sets; // Weightlifters increment via completed sets
          } else {
            increment = workout.duration; // Cardio drills increment via minutes
          }
        }

        if (increment > 0) {
          const questRef = doc(db, `users/${currentUser.uid}/quests`, quest.id);
          await updateDoc(questRef, {
            currentValue: quest.currentValue + increment,
          });
        }
      });

      // Trigger cinematic Level Up Splash if leveled up
      if (shouldLevelUpAnim) {
        setLevelUpTarget(userLevel);
        setLevelUpVisible(true);
        try {
          sfx.playLevelUp();
        } catch(e){}
      }

      await loadUserProfile(currentUser.uid);
    } catch (err) {
      console.error(err);
    } finally {
      setWorkoutSaving(false);
    }
  };

  // Claim quest bonus XP
  const handleClaimQuest = async (quest: Quest) => {
    if (!currentUser) return;
    try {
      try {
        sfx.playQuestComplete();
      } catch(e){}

      let totalXp = currentUser.xp + quest.xpReward;
      let userLevel = currentUser.level;
      let shouldLevelUpAnim = false;
      let gainedStatPoints = 0;

      while (totalXp >= 1000) {
        totalXp -= 1000;
        userLevel += 1;
        shouldLevelUpAnim = true;
        gainedStatPoints += 5;
      }

      const finalStatPoints = (currentUser.statPoints || 0) + gainedStatPoints;

      // Apply stat points bonus upon quest claim
      const currentStats = { ...currentUser.stats };
      currentStats.STR += 1;
      currentStats.AGI += 1;
      currentStats.END += 1;
      currentStats.VIT += 1;

      if (currentUser.uid.startsWith("guest_")) {
        const updatedLocalQuests = quests.map(q => q.id === quest.id ? { ...q, completed: true } : q);
        localStorage.setItem(`quests_${currentUser.uid}`, JSON.stringify(updatedLocalQuests));
        setQuests(updatedLocalQuests);

        const updatedLocalProfile: UserProfile = {
          ...currentUser,
          xp: totalXp,
          level: userLevel,
          stats: currentStats,
          statPoints: finalStatPoints
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedLocalProfile));
        setCurrentUser(updatedLocalProfile);

        if (shouldLevelUpAnim) {
          setLevelUpTarget(userLevel);
          setLevelUpVisible(true);
          try {
            sfx.playLevelUp();
          } catch(e){}
        }
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);

      // Update Quest status
      const questRef = doc(db, `users/${currentUser.uid}/quests`, quest.id);
      await updateDoc(questRef, {
        completed: true,
      });

      // Update user levels
      await updateDoc(userRef, {
        xp: totalXp,
        level: userLevel,
        stats: currentStats,
        statPoints: finalStatPoints
      });

      if (shouldLevelUpAnim) {
        setLevelUpTarget(userLevel);
        setLevelUpVisible(true);
        try {
          sfx.playLevelUp();
        } catch(e){}
      }

      await loadUserProfile(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocateStat = async (stat: "STR" | "AGI" | "END" | "VIT") => {
    if (!currentUser || !currentUser.statPoints || currentUser.statPoints <= 0) return;

    const updatedStats = {
      ...currentUser.stats,
      [stat]: currentUser.stats[stat] + 1
    };
    const updatedStatPoints = currentUser.statPoints - 1;

    try {
      sfx.playStatAlloc();
    } catch(e){}

    if (currentUser.uid.startsWith("guest_")) {
      const updatedLocalProfile: UserProfile = {
        ...currentUser,
        stats: updatedStats,
        statPoints: updatedStatPoints
      };
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedLocalProfile));
      setCurrentUser(updatedLocalProfile);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        stats: updatedStats,
        statPoints: updatedStatPoints
      });
      await loadUserProfile(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  // Reward XP + stat points when a Transformation day (or the final boss) is cleared
  const handleTransformationReward = async (xpReward: number, statReward: number) => {
    if (!currentUser) return;

    let totalXp = currentUser.xp + xpReward;
    let userLevel = currentUser.level;
    let shouldLevelUpAnim = false;
    let gainedStatPoints = statReward;

    while (totalXp >= 1000) {
      totalXp -= 1000;
      userLevel += 1;
      shouldLevelUpAnim = true;
      gainedStatPoints += 5;
    }

    const finalStatPoints = (currentUser.statPoints || 0) + gainedStatPoints;

    try {
      sfx.playQuestComplete();
    } catch (e) {}

    if (currentUser.uid.startsWith("guest_")) {
      const updatedLocalProfile: UserProfile = {
        ...currentUser,
        xp: totalXp,
        level: userLevel,
        statPoints: finalStatPoints
      };
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedLocalProfile));
      setCurrentUser(updatedLocalProfile);
    } else {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          xp: totalXp,
          level: userLevel,
          statPoints: finalStatPoints
        });
        await loadUserProfile(currentUser.uid);
      } catch (err) {
        console.error(err);
      }
    }

    if (shouldLevelUpAnim) {
      setLevelUpTarget(userLevel);
      setLevelUpVisible(true);
      try {
        sfx.playLevelUp();
      } catch (e) {}
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0E0B16] flex flex-col items-center justify-center text-[#9A8FB8] gap-3.5">
        <Loader2 className="w-8 h-8 text-[#C9B8F0] animate-spin" />
        <span className="font-display text-lg tracking-widest">Syncing Hero Data…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0B16] text-[#EDE6FA] flex flex-col relative py-0 select-none">
      {/* Particle background ember floating */}
      <ParticleBackground />

      {/* Solo Leveling Dual Gates Opening Animation */}
      {gatesActive && (
        <div className="fixed inset-0 z-[999] pointer-events-none flex overflow-hidden">
          {/* Left Door */}
          <div
            className="w-1/2 h-full border-r border-[#7B2FBE]/30 flex flex-col justify-center items-end pr-8 transition-transform duration-[1200ms] cubic-bezier(0.77, 0, 0.175, 1) pointer-events-auto shadow-[15px_0_30px_rgba(0,0,0,0.85)]"
            style={{
              transform: gatesOpen ? "translateX(-100%)" : "translateX(0%)",
              backgroundImage: "radial-gradient(circle at right, #0F0A1E 0%, #030611 100%)"
            }}
          >
            {/* Runes & Heavy Stone Gate texture */}
            <div className="max-w-[180px] text-right font-mono space-y-3 opacity-60">
              <div className="text-[10px] text-[#7B2FBE] tracking-widest font-bold">WARNING: INTEGRITY</div>
              <p className="text-[8px] text-gray-500 font-bold tracking-tight">RITUAL_DOOR_01</p>
              <div className="text-xs text-purple-400 font-extrabold leading-none tracking-widest select-none uppercase">
                ARISE / ARISE / ARISE
              </div>
            </div>
          </div>

          {/* Right Door */}
          <div
            className="w-1/2 h-full border-l border-[#C9B8F0]/30 flex flex-col justify-center items-start pl-8 transition-transform duration-[1200ms] cubic-bezier(0.77, 0, 0.175, 1) pointer-events-auto shadow-[-15px_0_30px_rgba(0,0,0,0.85)]"
            style={{
              transform: gatesOpen ? "translateX(100%)" : "translateX(0%)",
              backgroundImage: "radial-gradient(circle at left, #0A1424 0%, #030611 100%)"
            }}
          >
            {/* Right Door graphics */}
            <div className="max-w-[180px] text-left font-mono space-y-3 opacity-60">
              <div className="text-[10px] text-[#C9B8F0] tracking-widest font-bold font-mono">SYSTEM LOADING</div>
              <p className="text-[8px] text-gray-500 font-bold tracking-tight">REALM_HUNTER_GATE_02</p>
              <div className="text-xs text-[#C9B8F0] font-extrabold leading-none tracking-widest select-none uppercase animate-pulse">
                SYSTEM_LINK_ACTIVE
              </div>
            </div>
          </div>

          {/* S-Gate Rune Center Seal */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-purple-500 bg-[#060A1A] flex items-center justify-center transition-all duration-700 pointer-events-auto shadow-[0_0_40px_rgba(123,47,190,0.5)] z-50 ${
              gatesOpen ? "scale-0 opacity-0 rotate-180" : "scale-100 opacity-100"
            }`}
          >
            <div className="absolute inset-1 border border-dashed border-[#C9B8F0]/50 rounded-full animate-spin" />
            <span className="text-[#C9B8F0] font-mono font-black text-xl tracking-wider select-none animate-pulse">
              S-GATE
            </span>
          </div>
        </div>
      )}

      {/* Level Up splash render */}
      {currentUser && (
        <LevelUpSplash
          isVisible={levelUpVisible}
          newLevel={levelUpTarget}
          characterClass={currentUser.characterClass}
          onClose={() => setLevelUpVisible(false)}
        />
      )}

      {/* Main framed Smartphone layout mock to simulate native mobile experience */}
      <div className="flex-1 flex justify-center items-stretch py-0 md:py-8 w-full z-10">
        <div className="w-full max-w-md bg-[#15101F] md:rounded-[40px] md:border-[10px] md:border-[#241B33] shadow-[0_0_60px_rgba(124,95,192,0.18)] md:aspect-[9/19.5] flex flex-col relative overflow-hidden">

          {/* Mock Speaker/Camera Phone notch */}
          <div className="hidden md:flex justify-center absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#241B33] rounded-b-2xl z-50">
            <div className="w-12 h-1 bg-[#15101F] rounded mt-1" />
          </div>

          {!currentUser ? (
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center">
              <AuthScreen onAuthSuccess={(user) => {
                localStorage.setItem("last_active_user_id", user.uid);
                setCurrentUser(user);
              }} />
            </div>
          ) : (
            <>
              {/* Game HUD Bar header */}
              <div className="px-5 pt-7 pb-4 bg-[#15101F]/90 border-b border-white/10 flex justify-between items-center relative z-25">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#B9A3E3] rounded-full" />
                  <span className="text-[#EDE6FA] font-monument tracking-[0.3em] text-base">
                    LEVELFIT
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  {/* SFX Audio Toggle */}
                  <button
                    onClick={() => {
                      const state = sfx.toggle();
                      setSfxEnabled(state);
                      if (state) sfx.playClick();
                    }}
                    className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      sfxEnabled
                        ? "bg-[#3A2F58]/50 border-[#C9B8F0]/30 text-[#C9B8F0] hover:bg-[#3A2F58]/70"
                        : "bg-[#15101F] border-white/10 text-[#9A8FB8] hover:text-[#C7BBE2]"
                    }`}
                    title={sfxEnabled ? "System audio: ON" : "System audio: LOCKED"}
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  >
                    {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  {/* Streak */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 frost rounded-full text-xs text-[#C9B8F0] font-medium">
                    <Flame className="w-4 h-4 text-[#C9B8F0]" /> {currentUser.streak}d
                  </div>

                  {/* Level text */}
                  <div className="px-2.5 py-1 frost rounded-full text-xs text-[#EDE6FA] font-medium">
                    Lv. {currentUser.level}
                  </div>
                </div>
              </div>

              {/* Central screen tab contents */}
              <main className="flex-1 overflow-y-auto px-4 py-6 relative z-10 pb-20">
                {activeTab === "home" && (
                  <HomeOverview
                    currentUser={currentUser}
                    workoutHistory={workoutHistory}
                    quests={quests}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === "transformation" && (
                  <TransformationView
                    currentUser={currentUser}
                    onReward={handleTransformationReward}
                    onLockChange={setDisciplineLocked}
                  />
                )}

                {/* Duolingo-style hard lock: blocks every other screen until today's ritual is done */}
                {disciplineLocked && activeTab !== "transformation" && (
                  <div className="absolute inset-0 z-40 bg-[#1B1528]/95 backdrop-blur-md flex flex-col items-center justify-center text-center px-8">
                    <Lock className="w-10 h-10 text-[#C9B8F0] mb-5" />
                    <p className="font-mono text-[10px] tracking-[0.4em] text-[#C9B8F0]/60 uppercase mb-2">Locked</p>
                    <h3 className="text-2xl text-[#EDE6FA] font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      ภารกิจวันนี้ยังไม่เสร็จ
                    </h3>
                    <p className="text-xs text-[#9A8FB8] mt-3 leading-relaxed max-w-xs">
                      Discipline Lock เปิดอยู่ — ทำ "ออกกำลังกาย" ของวันนี้ให้เสร็จก่อน ถึงจะเข้าหน้าอื่นได้
                    </p>
                    <button
                      onClick={() => changeTab("transformation")}
                      className="mt-6 px-8 py-3.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold rounded-full transition-colors cursor-pointer shadow-[0_8px_30px_rgba(185,163,227,0.3)]"
                      style={{ minHeight: "52px" }}
                    >
                      ไปทำภารกิจวันนี้
                    </button>
                  </div>
                )}

                {activeTab === "workout" && (
                  <div className="space-y-6">
                    <WorkoutLogger onLogWorkout={handleLogWorkout} isLogging={workoutSaving} workoutHistory={workoutHistory} />
                  </div>
                )}

                {activeTab === "character" && (
                  <div className="space-y-5">
                    {/* Character sub-tabs */}
                    <div className="grid grid-cols-3 p-1 frost rounded-xl gap-1">
                      <button
                        onClick={() => changeCharSubTab("status")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "status"
                            ? "bg-[#3A2F58]/60 border border-[#C9B8F0]/30 text-[#C9B8F0]"
                            : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                        }`}
                        style={{ minHeight: "44px" }}
                      >
                        Status
                      </button>
                      <button
                        onClick={() => changeCharSubTab("quests")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "quests"
                            ? "bg-[#3A2F58]/60 border border-[#C9B8F0]/30 text-[#C9B8F0]"
                            : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                        }`}
                        style={{ minHeight: "44px" }}
                      >
                        Trials
                      </button>
                      <button
                        onClick={() => changeCharSubTab("achievements")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "achievements"
                            ? "bg-[#3A2F58]/60 border border-[#C9B8F0]/30 text-[#C9B8F0]"
                            : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                        }`}
                        style={{ minHeight: "44px" }}
                      >
                        Medals
                      </button>
                    </div>

                    {charSubTab === "status" ? (
                      <CharacterProfile 
                        currentUser={currentUser} 
                        workoutHistory={workoutHistory} 
                        onRefreshProfile={handleRefreshProfile}
                        onAllocateStat={handleAllocateStat}
                      />
                    ) : charSubTab === "quests" ? (
                      <QuestsView
                        currentUser={currentUser}
                        workoutHistory={workoutHistory}
                        onClaimQuest={handleClaimQuest}
                        onRefreshProfile={handleRefreshProfile}
                      />
                    ) : (
                      <AchievementsView
                        currentUser={currentUser}
                        workoutHistory={workoutHistory}
                        onRefreshProfile={handleRefreshProfile}
                      />
                    )}
                  </div>
                )}

                {activeTab === "profile" && (
                  <ProfileView
                    currentUser={currentUser}
                    onRefreshProfile={handleRefreshProfile}
                    onLogout={async () => {
                      if (currentUser.uid.startsWith("guest_")) {
                        localStorage.removeItem("last_active_user_id");
                        setCurrentUser(null);
                      } else {
                        localStorage.removeItem("last_active_user_id");
                        await auth.signOut();
                      }
                    }}
                  />
                )}
              </main>

              {/* Persistent Bottom Mobile Navigation Rail */}
              <nav className="absolute bottom-0 left-0 right-0 h-16 bg-[#15101F]/95 border-t border-white/10 flex justify-around items-stretch z-30 pb-safe px-2">
                <button
                  onClick={() => changeTab("home")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "home" ? "text-[#C9B8F0]" : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <CastleIcon className={`w-5 h-5 ${activeTab === "home" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Home</span>
                </button>

                <button
                  onClick={() => changeTab("transformation")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "transformation" ? "text-[#C9B8F0]" : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <RuneScrollIcon className={`w-5 h-5 ${activeTab === "transformation" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">21-Day</span>
                </button>

                <button
                  onClick={() => changeTab("workout")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "workout" ? "text-[#C9B8F0]" : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <CrossedSwordsIcon className={`w-5 h-5 ${activeTab === "workout" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Workout</span>
                </button>

                <button
                  onClick={() => changeTab("character")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "character" ? "text-[#C9B8F0]" : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <HelmetIcon className={`w-5 h-5 ${activeTab === "character" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Character</span>
                </button>

                <button
                  onClick={() => changeTab("profile")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "profile" ? "text-[#C9B8F0]" : "text-[#9A8FB8] hover:text-[#C7BBE2]"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <HunterMaskIcon className={`w-5 h-5 ${activeTab === "profile" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Profile</span>
                </button>
              </nav>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// Hand-drawn custom vector icons matching the dark fantasy Solo Leveling request scope
function CastleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 20v-9H2v9" />
      <path d="M18 11V4h-3v3h-2V4h-3v3H8V4H5v7" />
      <path d="M11 20v-4a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1v4" />
    </svg>
  );
}

function CrossedSwordsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 21 13" />
      <polyline points="9.5 17.5 3 11" />
    </svg>
  );
}

function HelmetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 11c0 5 4 10 10 10s10-5 10-10C22 6 18 2 12 2S2 6 2 11z" />
      <path d="M12 2v9" />
      <path d="M5 11h14" strokeWidth="2" />
      <path d="M9 11v5" />
      <path d="M15 11v5" />
    </svg>
  );
}

function RuneScrollIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
      <circle cx="17.5" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HunterMaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10l2-6h12l2 6v6c0 3-3 5-8 5s-8-2-8-5v-6z" />
      {/* Eye cuts glowing details */}
      <path d="M7 10l3 1.5" />
      <path d="M17 10l-3 1.5" />
      <path d="M12 11v3" />
    </svg>
  );
}
