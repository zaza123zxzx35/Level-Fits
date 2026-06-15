import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, Quest, WorkoutLog } from "../types";
import { Sparkles, Star, Flame, Wand2, CheckCircle, Clock, AlertCircle, Play, ShieldEllipsis, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuestsViewProps {
  currentUser: UserProfile;
  workoutHistory: WorkoutLog[];
  onClaimQuest: (quest: Quest) => Promise<void>;
  onRefreshProfile: () => Promise<void>;
}

export function QuestsView({ currentUser, workoutHistory, onClaimQuest, onRefreshProfile }: QuestsViewProps) {
  const [questsList, setQuestsList] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [summoning, setSummoning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Push Notifications Setup State
  const [notifTime, setNotifTime] = useState("20:00");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPopup, setNotifPopup] = useState(false);

  // Fetch user active quests
  const fetchQuests = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const questsRef = collection(db, `users/${currentUser.uid}/quests`);
      const snapshot = await getDocs(questsRef);
      const activeQuests: Quest[] = [];
      snapshot.forEach((docSnap) => {
        activeQuests.push(docSnap.data() as Quest);
      });
      setQuestsList(activeQuests);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to read trials list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [currentUser]);

  // Handle Summon (Generate new weekly trials using Gemini Server Route)
  const handleSummonQuests = async () => {
    setSummoning(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      // Fetch dynamic medieval quests from Express backend
      const response = await fetch("/api/generate-quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workoutHistory }),
      });

      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Quest generator rejected request.");
      }

      const generatedQuests = body.quests;

      // Clean old quests in batch
      const questsRef = collection(db, `users/${currentUser.uid}/quests`);
      const oldQuestsSnapshot = await getDocs(questsRef);
      const batch = writeBatch(db);

      oldQuestsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      // Write new quests to Firestore
      generatedQuests.forEach((q: any) => {
        const newQuestId = Math.random().toString(36).substring(2, 11);
        const questData: Quest = {
          id: newQuestId,
          userId: currentUser.uid,
          title: q.title,
          description: q.description,
          type: q.type,
          targetValue: q.targetValue,
          currentValue: 0,
          completed: false,
          xpReward: q.xpReward,
          badgeReward: q.badgeReward || undefined,
          createdAt: new Date().toISOString(),
        };
        const docRef = doc(db, `users/${currentUser.uid}/quests`, newQuestId);
        batch.set(docRef, questData);
      });

      await batch.commit();
      setSuccessMessage("Weekly dynamic quests summoned from the void!");
      fetchQuests();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to dial RPG Quest Master.");
    } finally {
      setSummoning(false);
    }
  };

  // Turn on push reminders simulation
  const handleTogglePushNotifications = () => {
    if (!notifEnabled) {
      setNotifEnabled(true);
      setNotifPopup(true);
      // Actual browser Notification API access attempt if granted
      if ("Notification" in window) {
        Notification.requestPermission();
      }
      setTimeout(() => setNotifPopup(false), 3000);
    } else {
      setNotifEnabled(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campfire Bonfire Daily Streak panel */}
      <div className="p-5 frost rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
        {/* Campfire graphics indicator */}
        <div className="relative flex items-center justify-center w-24 h-24 bg-[#15101F] border border-[#C9B8F0]/30 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center justify-center"
          >
            <Flame className="w-12 h-12 text-[#C9B8F0]" />
          </motion.div>
          <div className="absolute -bottom-1 px-2.5 py-0.5 bg-[#B9A3E3] text-[#241B3A] font-monument text-[9px] tracking-[0.15em] rounded-full">
            STREAK
          </div>
        </div>

        <div className="text-center md:text-left flex-1">
          <h3 className="text-xl font-display font-semibold text-[#EDE6FA] flex items-center justify-center md:justify-start gap-1">
            {currentUser.streak} Day Heat Streak
          </h3>
          <p className="text-[#9A8FB8] text-xs mt-1">
            Feed the gym bonfire daily. A lapse of 24 hours of training will break the heat streak.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {/* Simulated Push notices button */}
            <button
              onClick={handleTogglePushNotifications}
              className={`px-3 py-1.5 rounded-full text-[11px] font-monument uppercase tracking-[0.15em] cursor-pointer transition-all flex items-center gap-1.5 ${
                notifEnabled
                  ? "frost border border-[#C9B8F0]/40 text-[#C9B8F0]"
                  : "frost text-[#C7BBE2] hover:text-[#EDE6FA]"
              }`}
              style={{ minHeight: "44px" }}
            >
              <BellRing className="w-3.5 h-3.5" />
              {notifEnabled ? `Active (Reminding at ${notifTime})` : "Streak Reminders"}
            </button>

            {notifEnabled && (
              <input
                type="time"
                value={notifTime}
                onChange={(e) => setNotifTime(e.target.value)}
                className="bg-[#15101F] text-[#C9B8F0] border border-white/10 text-xs h-10 px-2.5 rounded-full"
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Push Reminder Notice Banner */}
      <AnimatePresence>
        {notifPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="p-4 frost border border-[#C9B8F0]/40 text-[#EDE6FA] text-xs rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center gap-2"
          >
            <BellRing className="w-5 h-5 text-[#C9B8F0]" />
            <div>
              <span className="font-monument uppercase tracking-[0.15em] block text-[#C9B8F0]">Push Notifications Enabled!</span>
              We will transmit telepathic workout alerts daily to protect your streak.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Quests summon head */}
      <div className="p-6 frost rounded-2xl relative shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h2 className="text-xl font-display font-semibold text-[#C9B8F0] tracking-wide flex items-center gap-2">
              <Star className="w-5 h-5 text-[#C9B8F0]" /> Weekly Trials from the Void
            </h2>
            <p className="text-[#9A8FB8] text-xs mt-0.5">
              Personalized guilds mandates synthesized dynamically based on your workout history.
            </p>
          </div>

          <button
            onClick={handleSummonQuests}
            disabled={summoning}
            className="w-full md:w-auto px-5 py-2.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-monument text-xs uppercase tracking-[0.15em] rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            style={{ minHeight: "44px" }}
          >
            <Wand2 className={`w-4 h-4 ${summoning ? "animate-spin" : ""}`} />
            {summoning ? "Summoning Trials..." : "Recast Trials"}
          </button>
        </div>

        {errorMessage && <p className="text-[#C9B8F0] text-xs mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-[#C9B8F0] text-xs mb-4">{successMessage}</p>}

        {/* Quests Lists */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-6 text-[#9A8FB8] text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#C9B8F0] border-t-transparent rounded-full animate-spin" />
              Deciphering trial scripts...
            </div>
          )}

          {!loading && questsList.length === 0 && (
            <div className="text-center py-10 border border-white/10 rounded-2xl bg-[#15101F] px-6">
              <Wand2 className="w-8 h-8 text-[#9A8FB8] mx-auto mb-2" />
              <p className="text-[#C7BBE2] text-xs">The prompt scroll is empty.</p>
              <p className="text-[#9A8FB8] text-[10px] mt-1">Tap the Summon button above to invite your first trials.</p>
            </div>
          )}

          {!loading &&
            questsList.map((quest) => {
              const currentProgress = Math.min(quest.currentValue, quest.targetValue);
              const progressPct = (currentProgress / quest.targetValue) * 100;
              const isClaimable = currentProgress >= quest.targetValue && !quest.completed;

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-2xl frost transition-all ${
                    quest.completed
                      ? "opacity-60"
                      : "hover:border-[#C9B8F0]/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-semibold text-sm ${quest.completed ? "text-[#9A8FB8] line-through" : "text-[#C9B8F0]"}`}>
                          {quest.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#15101F] border border-white/10 rounded-full text-[#9A8FB8] uppercase font-monument tracking-[0.1em]">
                          {quest.type}
                        </span>
                      </div>
                      <p className="text-[#9A8FB8] text-xs font-sans max-w-xl">{quest.description}</p>
                    </div>

                    <div className="text-right whitespace-nowrap self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end">
                      <span className="text-xs text-[#C9B8F0] font-semibold block">+{quest.xpReward} XP</span>
                      {quest.badgeReward && (
                        <span className="text-[10px] text-[#C9B8F0] font-semibold block uppercase">Loot: {quest.badgeReward}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress panel */}
                  <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px] mb-1 text-[#9A8FB8]">
                        <span>Trial Objective Progress</span>
                        <span className="text-[#C9B8F0]">
                          {currentProgress} / {quest.targetValue} {quest.type === "Strength" ? "Sets" : quest.type === "Streak" ? "Days" : "Mins"}
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="h-2 w-full bg-[#15101F] rounded-full border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    {quest.completed ? (
                      <div className="px-4 py-2 frost rounded-full text-[11px] font-monument uppercase text-[#C9B8F0] tracking-[0.15em] flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Finished
                      </div>
                    ) : isClaimable ? (
                      <button
                        onClick={() => onClaimQuest(quest)}
                        className="px-4 py-2 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-monument text-xs uppercase rounded-full active:scale-95 transition-all duration-150 cursor-pointer text-center"
                        style={{ minHeight: "44px" }}
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <div className="px-4 py-2 frost text-[#9A8FB8] text-[10px] uppercase rounded-full tracking-[0.15em] flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Working
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
