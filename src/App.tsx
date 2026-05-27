import { useState, useEffect } from "react";
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
import { LeaderboardView } from "./components/LeaderboardView";
import { ProfileView } from "./components/ProfileView";
import { AchievementsView } from "./components/AchievementsView";
import { Home, Dumbbell, Shield, Trophy, User, Sparkles, Flame, LogOut, Loader2, Compass } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "workout" | "character" | "leaderboard" | "profile">("home");
  const [charSubTab, setCharSubTab] = useState<"status" | "quests" | "achievements">("status");

  // History states
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);

  // Cinematic Level Up animation state
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpTarget, setLevelUpTarget] = useState(1);
  const [workoutSaving, setWorkoutSaving] = useState(false);

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

  // Load profile details
  const loadUserProfile = async (uid: string) => {
    try {
      if (uid.startsWith("guest_")) {
        const localProf = localStorage.getItem(`profile_${uid}`);
        if (localProf) {
          const profile = JSON.parse(localProf) as UserProfile;

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

      // Level limit formula (1000 XP per level)
      while (totalXp >= 1000) {
        totalXp -= 1000;
        userLevel += 1;
        shouldLevelUpAnim = true;
      }

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
      let totalXp = currentUser.xp + quest.xpReward;
      let userLevel = currentUser.level;
      let shouldLevelUpAnim = false;

      while (totalXp >= 1000) {
        totalXp -= 1000;
        userLevel += 1;
        shouldLevelUpAnim = true;
      }

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
          stats: currentStats
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedLocalProfile));
        setCurrentUser(updatedLocalProfile);

        if (shouldLevelUpAnim) {
          setLevelUpTarget(userLevel);
          setLevelUpVisible(true);
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
      });

      if (shouldLevelUpAnim) {
        setLevelUpTarget(userLevel);
        setLevelUpVisible(true);
      }

      await loadUserProfile(currentUser.uid);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center text-gray-400 font-mono gap-3.5">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        <span>Syncing Hero Data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative py-0 select-none">
      {/* Particle background ember floating */}
      <ParticleBackground />

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
        <div className="w-full max-w-md bg-[#0A0E1A] md:rounded-[40px] md:border-[10px] md:border-slate-800 shadow-[0_0_60px_rgba(123,47,190,0.15)] md:aspect-[9/19.5] flex flex-col relative overflow-hidden">
          
          {/* Mock Speaker/Camera Phone notch */}
          <div className="hidden md:flex justify-center absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50">
            <div className="w-12 h-1 bg-slate-900 rounded mt-1" />
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
              <div className="px-5 pt-7 pb-4 bg-slate-950/90 border-b border-purple-550/20 flex justify-between items-center relative z-25">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#7B2FBE] rounded-full" />
                  <span className="text-yellow-400 font-black font-sans uppercase tracking-widest text-sm">
                    LevelFit
                  </span>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  {/* Streak */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-amber-500 font-bold">
                    <Flame className="w-4 h-4 text-amber-500 animate-bounce" /> {currentUser.streak}d
                  </div>

                  {/* Level text */}
                  <div className="px-2.5 py-1 bg-gradient-to-r from-purple-950 to-slate-900 border border-[#7B2FBE]/30 rounded-full text-xs text-yellow-300 font-bold">
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

                {activeTab === "workout" && (
                  <div className="space-y-6">
                    <WorkoutLogger onLogWorkout={handleLogWorkout} isLogging={workoutSaving} />
                  </div>
                )}

                {activeTab === "character" && (
                  <div className="space-y-5">
                    {/* Character sub-tabs */}
                    <div className="grid grid-cols-3 p-1 bg-slate-950/80 border border-slate-800 rounded-xl gap-1">
                      <button
                        onClick={() => setCharSubTab("status")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "status"
                            ? "bg-purple-900/40 border border-purple-500/20 text-yellow-300 shadow"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                        style={{ minHeight: "44px" }}
                      >
                        Status
                      </button>
                      <button
                        onClick={() => setCharSubTab("quests")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "quests"
                            ? "bg-purple-900/40 border border-purple-500/20 text-yellow-300 shadow"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                        style={{ minHeight: "44px" }}
                      >
                        Trials
                      </button>
                      <button
                        onClick={() => setCharSubTab("achievements")}
                        className={`py-2 text-[10px] font-black font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                          charSubTab === "achievements"
                            ? "bg-purple-900/40 border border-purple-500/20 text-yellow-300 shadow"
                            : "text-gray-500 hover:text-gray-300"
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

                {activeTab === "leaderboard" && (
                  <LeaderboardView currentUser={currentUser} />
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
              <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/95 border-t border-purple-550/15 flex justify-around items-stretch z-30 pb-safe px-2">
                <button
                  onClick={() => setActiveTab("home")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "home" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Home className={`w-5 h-5 ${activeTab === "home" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Home</span>
                </button>

                <button
                  onClick={() => setActiveTab("workout")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "workout" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Dumbbell className={`w-5 h-5 ${activeTab === "workout" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Workout</span>
                </button>

                <button
                  onClick={() => setActiveTab("character")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "character" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <User className={`w-5 h-5 ${activeTab === "character" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Character</span>
                </button>

                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "leaderboard" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Trophy className={`w-5 h-5 ${activeTab === "leaderboard" ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-bold tracking-widest uppercase font-mono mt-1">Leaderboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex flex-col items-center justify-center flex-1 cursor-pointer transition-colors ${
                    activeTab === "profile" ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ minWidth: "44px", minHeight: "44px" }}
                >
                  <Shield className={`w-5 h-5 ${activeTab === "profile" ? "scale-110" : ""}`} />
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
