import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, where, addDoc, doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, FriendRelation, CharacterClass } from "../types";
import { Trophy, Users, ShieldAlert, Award, ChevronRight, UserPlus, Trash2, ShieldCheck, Flame } from "lucide-react";
import { getHunterRank } from "../utils/rankUtils";

interface LeaderboardViewProps {
  currentUser: UserProfile;
}

export function LeaderboardView({ currentUser }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [globalLeaders, setGlobalLeaders] = useState<UserProfile[]>([]);
  const [friendsList, setFriendsList] = useState<FriendRelation[]>([]);
  const [friendInput, setFriendInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [countdown, setCountdown] = useState("");

  // Seasonal countdown timer (resets every Sunday midnight UTC)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()) % 7);
      nextSunday.setUTCHours(23, 59, 59, 999);
      if (nextSunday.getTime() <= now.getTime()) {
        nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
      }

      const diff = nextSunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch global leaders
  const fetchGlobalLeaders = async () => {
    setLoading(true);
    setErrorText("");
    const mockLeadersBasis: UserProfile[] = [
      {
        uid: "legend_1",
        email: "jinwoo@shadowmonarch.realm",
        displayName: "Sung Jinwoo",
        characterClass: "Assassin",
        level: 99,
        xp: 850,
        stats: { STR: 500, AGI: 500, END: 500, VIT: 500 },
        streak: 85,
        lastWorkoutDate: null,
        createdAt: "",
        badges: ["novice_badge"],
        shadows: ["shadow_infantry", "tank", "iron", "igris", "tusk", "beru", "bellion"]
      },
      {
        uid: "legend_2",
        email: "hae-in@hunter.realm",
        displayName: "Cha Hae-In",
        characterClass: "Warrior",
        level: 82,
        xp: 410,
        stats: { STR: 240, AGI: 310, END: 210, VIT: 220 },
        streak: 42,
        lastWorkoutDate: null,
        createdAt: "",
        badges: ["novice_badge"],
        shadows: []
      },
      {
        uid: "legend_3",
        email: "choi@mageguild.realm",
        displayName: "Choi Jong-In",
        characterClass: "Mage",
        level: 78,
        xp: 990,
        stats: { STR: 110, AGI: 200, END: 350, VIT: 180 },
        streak: 31,
        lastWorkoutDate: null,
        createdAt: "",
        badges: [],
        shadows: []
      },
      {
        uid: "legend_4",
        email: "baek@white_tiger.realm",
        displayName: "Baek Yoonho",
        characterClass: "Warrior",
        level: 76,
        xp: 320,
        stats: { STR: 310, AGI: 190, END: 240, VIT: 290 },
        streak: 28,
        lastWorkoutDate: null,
        createdAt: "",
        badges: [],
        shadows: []
      },
      {
        uid: "legend_5",
        email: "thomas@scavenger.realm",
        displayName: "Thomas Andre",
        characterClass: "Warrior",
        level: 91,
        xp: 150,
        stats: { STR: 480, AGI: 210, END: 450, VIT: 490 },
        streak: 71,
        lastWorkoutDate: null,
        createdAt: "",
        badges: [],
        shadows: []
      }
    ];

    if (currentUser.uid.startsWith("guest_")) {
      const merged = [currentUser, ...mockLeadersBasis].sort((a, b) => b.level - a.level || b.xp - a.xp);
      setGlobalLeaders(merged);
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      // Query top 20 users by level then xp
      const q = query(usersRef, orderBy("level", "desc"), orderBy("xp", "desc"), limit(20));
      const snapshot = await getDocs(q);
      const leaders: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        leaders.push(docSnap.data() as UserProfile);
      });
      
      // If db has entries, display them. Otherwise merge with base legends
      if (leaders.length > 0) {
        setGlobalLeaders(leaders);
      } else {
        const merged = [currentUser, ...mockLeadersBasis].sort((a, b) => b.level - a.level || b.xp - a.xp);
        setGlobalLeaders(merged);
      }
    } catch (err) {
      console.error(err);
      setErrorText("Database synclink offline: Alignment with local S-class hunter records completed.");
      const merged = [currentUser, ...mockLeadersBasis].sort((a, b) => b.level - a.level || b.xp - a.xp);
      setGlobalLeaders(merged);
    } finally {
      setLoading(false);
    }
  };

  // Fetch friends list
  const fetchFriends = async () => {
    setLoading(true);
    setErrorText("");

    if (currentUser.uid.startsWith("guest_")) {
      const localFriends = localStorage.getItem(`friends_${currentUser.uid}`);
      if (localFriends) {
        setFriendsList(JSON.parse(localFriends));
      } else {
        const defaultLocalFriends: FriendRelation[] = [
          {
            id: "ally_yoo",
            userId: currentUser.uid,
            friendUid: "ally_yoo",
            friendUsername: "Yoo Jinho",
            friendClass: "Warrior",
            friendLevel: 12,
            friendXp: 450,
            addedAt: new Date().toISOString(),
          }
        ];
        setFriendsList(defaultLocalFriends);
        localStorage.setItem(`friends_${currentUser.uid}`, JSON.stringify(defaultLocalFriends));
      }
      setLoading(false);
      return;
    }

    try {
      const friendsRef = collection(db, `users/${currentUser.uid}/friends`);
      const snapshot = await getDocs(friendsRef);
      const friends: FriendRelation[] = [];
      snapshot.forEach((docSnap) => {
        friends.push(docSnap.data() as FriendRelation);
      });
      // Sort friends by levels
      friends.sort((a, b) => b.friendLevel - a.friendLevel || b.friendXp - a.friendXp);
      setFriendsList(friends);
    } catch (err) {
      console.error(err);
      setErrorText("Alliance list offline: Syncing with local guild squad database.");
      const localFriends = localStorage.getItem(`friends_${currentUser.uid}`);
      if (localFriends) {
        setFriendsList(JSON.parse(localFriends));
      } else {
        setFriendsList([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "global") {
      fetchGlobalLeaders();
    } else {
      fetchFriends();
    }
  }, [activeTab]);

  // Add friend by username look up
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const searchName = friendInput.trim();
    if (searchName.toLowerCase() === currentUser.displayName.toLowerCase()) {
      setErrorText("You cannot invite yourself to your alliance!");
      setLoading(false);
      return;
    }

    const existingFriend = friendsList.find(f => f.friendUsername.toLowerCase() === searchName.toLowerCase());
    if (existingFriend) {
      setErrorText("This hero is already in your alliance list.");
      setLoading(false);
      return;
    }

    if (currentUser.uid.startsWith("guest_") || errorText === "Database synclink offline: Alignment with local S-class hunter records completed.") {
      // Local addition via S-Rank pools
      const customSrank = [
        { name: "Yoo Jinho", class: "Warrior" as CharacterClass, lv: 12, xp: 450, uid: "ally_yoo" },
        { name: "Cha Hae-In", class: "Warrior" as CharacterClass, lv: 82, xp: 410, uid: "legend_2" },
        { name: "Sung Jinwoo", class: "Assassin" as CharacterClass, lv: 99, xp: 850, uid: "legend_1" },
        { name: "Choi Jong-In", class: "Mage" as CharacterClass, lv: 78, xp: 990, uid: "legend_3" },
        { name: "Baek Yoonho", class: "Warrior" as CharacterClass, lv: 76, xp: 320, uid: "legend_4" },
        { name: "Thomas Andre", class: "Warrior" as CharacterClass, lv: 91, xp: 150, uid: "legend_5" }
      ];

      const found = customSrank.find(x => x.name.toLowerCase() === searchName.toLowerCase());
      if (!found) {
        setErrorText(`No hero named '${searchName}' was found in offline database. Available offlines: 'Sung Jinwoo', 'Cha Hae-In', 'Yoo Jinho', 'Baek Yoonho', 'Choi Jong-In', 'Thomas Andre'.`);
        setLoading(false);
        return;
      }

      const friendPayload: FriendRelation = {
        id: found.uid,
        userId: currentUser.uid,
        friendUid: found.uid,
        friendUsername: found.name,
        friendClass: found.class,
        friendLevel: found.lv,
        friendXp: found.xp,
        addedAt: new Date().toISOString()
      };

      const updatedFriends = [...friendsList, friendPayload].sort((a,b) => b.friendLevel - a.friendLevel);
      localStorage.setItem(`friends_${currentUser.uid}`, JSON.stringify(updatedFriends));
      setFriendsList(updatedFriends);
      setSuccessText(`${found.name} was successfully recruited to your alliance!`);
      setFriendInput("");
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("displayName", "==", searchName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Fallback check to S-Rank offline roster in case of missing online query
        const customSrank = [
          { name: "Yoo Jinho", class: "Warrior" as CharacterClass, lv: 12, xp: 450, uid: "ally_yoo" },
          { name: "Cha Hae-In", class: "Warrior" as CharacterClass, lv: 82, xp: 410, uid: "legend_2" },
          { name: "Sung Jinwoo", class: "Assassin" as CharacterClass, lv: 99, xp: 850, uid: "legend_1" }
        ];
        const foundLocal = customSrank.find(x => x.name.toLowerCase() === searchName.toLowerCase());
        if (foundLocal) {
          const friendPayload: FriendRelation = {
            id: foundLocal.uid,
            userId: currentUser.uid,
            friendUid: foundLocal.uid,
            friendUsername: foundLocal.name,
            friendClass: foundLocal.class,
            friendLevel: foundLocal.lv,
            friendXp: foundLocal.xp,
            addedAt: new Date().toISOString()
          };
          const updatedFriends = [...friendsList, friendPayload].sort((a,b) => b.friendLevel - a.friendLevel);
          localStorage.setItem(`friends_${currentUser.uid}`, JSON.stringify(updatedFriends));
          setFriendsList(updatedFriends);
          setSuccessText(`${foundLocal.name} was successfully recruited to your offline alliance list!`);
          setFriendInput("");
          setLoading(false);
          return;
        }

        setErrorText(`No hero named '${searchName}' was found in the realm.`);
        setLoading(false);
        return;
      }

      // Get friend profile
      const friendDoc = querySnapshot.docs[0];
      const friendProfile = friendDoc.data() as UserProfile;

      // Add to current user's friends subcollection
      const newFriendRef = doc(db, `users/${currentUser.uid}/friends`, friendProfile.uid);
      const friendPayload: FriendRelation = {
        id: friendProfile.uid,
        userId: currentUser.uid,
        friendUid: friendProfile.uid,
        friendUsername: friendProfile.displayName,
        friendClass: friendProfile.characterClass,
        friendLevel: friendProfile.level,
        friendXp: friendProfile.xp,
        addedAt: new Date().toISOString(),
      };

      await setDoc(newFriendRef, friendPayload);
      setSuccessText(`${friendProfile.displayName} was successfully added!`);
      setFriendInput("");
      fetchFriends();
    } catch (err) {
      console.error(err);
      setErrorText("Friend addition query rejected. Bypassing online database.");
    } finally {
      setLoading(false);
    }
  };

  // Remove friend from subcollection
  const handleRemoveFriend = async (friendUid: string) => {
    setErrorText("");
    setSuccessText("");

    if (currentUser.uid.startsWith("guest_")) {
      const updatedFriends = friendsList.filter(f => f.friendUid !== friendUid);
      localStorage.setItem(`friends_${currentUser.uid}`, JSON.stringify(updatedFriends));
      setFriendsList(updatedFriends);
      setSuccessText("Ally dismissed from alliance.");
      return;
    }

    try {
      const friendDocRef = doc(db, `users/${currentUser.uid}/friends`, friendUid);
      await deleteDoc(friendDocRef);
      setSuccessText("Ally dismissed from alliance.");
      fetchFriends();
    } catch (err) {
      console.error(err);
      setErrorText("Failed to dismiss ally (Using offline cache bypass).");
      const updatedFriends = friendsList.filter(f => f.friendUid !== friendUid);
      localStorage.setItem(`friends_${currentUser.uid}`, JSON.stringify(updatedFriends));
      setFriendsList(updatedFriends);
      setSuccessText("Ally dismissed from localized alliance cache.");
    }
  };

  return (
    <div className="space-y-6">
      {/* season reset countdown */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-yellow-500/35 rounded-xl text-center">
        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block font-mono">
          Season Rest Reset Countdown
        </span>
        <div className="text-xl font-bold font-mono text-white mt-1 uppercase tracking-wide flex items-center justify-center gap-1.5 animate-pulse">
          <Award className="w-5 h-5 text-yellow-500" /> {countdown}
        </div>
        <p className="text-gray-400 text-[10px] mt-0.5">
          Guild grand rewards disbursed to top 10 positions on Sunday reset.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer border-b-2 transition-colors ${
            activeTab === "global"
              ? "border-yellow-400 text-yellow-300"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Trophy className="w-4 h-4" /> Global Champions
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 pb-3 text-sm font-black uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer border-b-2 transition-colors ${
            activeTab === "friends"
              ? "border-yellow-400 text-yellow-300"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
          style={{ minHeight: "44px" }}
        >
          <Users className="w-4 h-4" /> Friends Guild
        </button>
      </div>

      {/* Friend Search & Add Bar */}
      {activeTab === "friends" && (
        <form onSubmit={handleAddFriend} className="space-y-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          <label className="text-gray-300 text-xs font-bold uppercase tracking-widest block font-mono">
            Rally New Ally
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Search by hero's handle..."
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              className="flex-1 h-11 px-4 rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black rounded-lg border border-yellow-300 shadow hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 uppercase tracking-wider text-xs font-mono"
              style={{ minHeight: "44px" }}
            >
              <UserPlus className="w-4 h-4" /> Recruit
            </button>
          </div>
          {successText && <p className="text-emerald-400 text-xs font-mono">{successText}</p>}
          {errorText && <p className="text-red-400 text-xs font-mono">{errorText}</p>}
        </form>
      )}

      {/* Ranks list */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl divide-y divide-slate-900 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500 font-mono text-xs">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            Querying server records...
          </div>
        )}

        {!loading && activeTab === "global" && globalLeaders.length === 0 && (
          <p className="text-center py-12 text-gray-500 text-xs font-mono">No heroes have logged XP yet. Be the first!</p>
        )}

        {!loading && activeTab === "friends" && friendsList.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-mono">You haven't formed any alliances yet.</p>
            <p className="text-gray-500 text-[10px] mt-1">Search their gaming handle above to invite them!</p>
          </div>
        )}

        {/* Global tab render */}
        {!loading && activeTab === "global" && (
          <div className="flex flex-col font-mono">
            {globalLeaders.map((leader, index) => {
              const matchesUser = leader.uid === currentUser.uid;
              const rank = index + 1;
              const hunterRank = getHunterRank(leader.level);
              
              // Rank specific color glows
              let rowColorClass = "border-b border-slate-900/40";
              if (hunterRank === "S") {
                rowColorClass += " bg-yellow-950/5 border-l-2 border-l-yellow-500/80 shadow-[inset_4px_0_12px_rgba(234,179,8,0.06)]";
              } else if (hunterRank === "A") {
                rowColorClass += " bg-purple-950/5 border-l-2 border-l-purple-500/80 shadow-[inset_4px_0_12px_rgba(147,51,234,0.06)]";
              } else if (hunterRank === "B") {
                rowColorClass += " bg-blue-950/5 border-l-2 border-l-blue-500/80 shadow-[inset_4px_0_12px_rgba(59,130,246,0.06)]";
              } else if (hunterRank === "C") {
                rowColorClass += " bg-green-950/5 border-l-2 border-l-green-500/80 shadow-[inset_4px_0_12px_rgba(34,197,94,0.06)]";
              }

              return (
                <div
                  key={leader.uid}
                  className={`flex items-center justify-between p-4 transition-all duration-300 ${rowColorClass} ${
                    matchesUser ? "bg-purple-950/20 shadow-inner" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge with Crown SVG for 1st, 2nd, 3rd */}
                    <div className="w-12 text-left font-mono font-black text-xs flex items-center justify-start shrink-0">
                      {rank === 1 ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-405 drop-shadow-[0_0_6px_#facc15] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
                          </svg>
                          <span className="text-yellow-400 font-extrabold text-[10px]">1ST</span>
                        </div>
                      ) : rank === 2 ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-slate-305 drop-shadow-[0_0_5px_#cbd5e1] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
                          </svg>
                          <span className="text-slate-300 font-extrabold text-[10px]">2ND</span>
                        </div>
                      ) : rank === 3 ? (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-amber-605 drop-shadow-[0_0_4px_#d97706] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
                          </svg>
                          <span className="text-amber-600 font-extrabold text-[10px]">3RD</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 pl-1">[{rank}TH]</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold font-sans text-sm ${matchesUser ? "text-yellow-300" : "text-white"}`}>
                          {leader.displayName}
                        </span>
                        {matchesUser && (
                          <span className="text-[9px] bg-yellow-400/25 border border-yellow-400/40 text-yellow-300 px-1 py-0.5 rounded font-black font-mono">
                            YOU
                          </span>
                        )}
                        <span className="text-[8.5px] uppercase font-bold text-gray-500 tracking-widest font-mono">
                          [{hunterRank}-Rank]
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                        {leader.characterClass}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-yellow-400 text-sm font-black">
                      Lv. {leader.level}
                    </div>
                    <div className="text-gray-500 text-[10px]">
                      {leader.xp} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Friends tab render */}
        {!loading && activeTab === "friends" && (
          <div className="flex flex-col font-mono">
            {/* Inject current user first for friend leaderboard layout */}
            {(() => {
              const userHunterRank = getHunterRank(currentUser.level);
              let userGlowClass = "bg-purple-950/25 border-b border-purple-900/45";
              if (userHunterRank === "S") {
                userGlowClass += " border-l-2 border-l-yellow-500/80";
              } else if (userHunterRank === "A") {
                userGlowClass += " border-l-2 border-l-purple-500/80";
              } else if (userHunterRank === "B") {
                userGlowClass += " border-l-2 border-l-blue-500/80";
              } else if (userHunterRank === "C") {
                userGlowClass += " border-l-2 border-l-green-500/80";
              }
              return (
                <div className={`flex items-center justify-between p-4 ${userGlowClass}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-6 text-center font-mono font-bold text-xs text-yellow-500 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-yellow-300">{currentUser.displayName}</span>
                        <span className="text-[9px] bg-yellow-400/25 text-yellow-300 px-1 rounded font-mono font-bold">OWNER</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        {currentUser.characterClass}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-yellow-400 text-sm font-black">Lv. {currentUser.level}</div>
                    <div className="text-gray-500 text-[10px]">{currentUser.xp} XP</div>
                  </div>
                </div>
              );
            })()}

            {friendsList.map((friend) => {
              const friendRank = getHunterRank(friend.friendLevel);
              let friendGlowClass = "border-b border-slate-900/40";
              if (friendRank === "S") {
                friendGlowClass += " bg-yellow-950/5 border-l-2 border-l-yellow-500/80 shadow-[inset_4px_0_12px_rgba(234,179,8,0.06)]";
              } else if (friendRank === "A") {
                friendGlowClass += " bg-purple-950/5 border-l-2 border-l-purple-500/80 shadow-[inset_4px_0_12px_rgba(147,51,234,0.06)]";
              } else if (friendRank === "B") {
                friendGlowClass += " bg-blue-950/5 border-l-2 border-l-blue-500/80 shadow-[inset_4px_0_12px_rgba(59,130,246,0.06)]";
              } else if (friendRank === "C") {
                friendGlowClass += " bg-green-950/5 border-l-2 border-l-green-500/80 shadow-[inset_4px_0_12px_rgba(34,197,94,0.06)]";
              }

              return (
                <div key={friend.id} className={`flex items-center justify-between p-4 transition-all duration-300 ${friendGlowClass}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-6 text-center flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{friend.friendUsername}</span>
                        <span className="text-[8.5px] uppercase font-bold text-gray-500 tracking-widest font-mono">
                          [{friendRank}-Rank]
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        {friend.friendClass}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className="text-yellow-400 text-sm font-black">Lv. {friend.friendLevel}</div>
                      <div className="text-gray-500 text-[10px]">{friend.friendXp} XP</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.friendUid)}
                      title="Dismiss Ally"
                      className="p-2 text-slate-800 hover:text-red-500 hover:bg-red-950/30 rounded-lg transition-all cursor-pointer"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
