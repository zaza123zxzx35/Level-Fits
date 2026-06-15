import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { CharacterClass, UserProfile, CharacterStats, Quest } from "../types";
import { Sword, Wand2, Shield, Skull, Eye, EyeOff, Sparkles } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedClass, setSelectedClass] = useState<CharacterClass>("Warrior");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOpNotAllowed, setIsOpNotAllowed] = useState(false);
  const [googleUserForSelection, setGoogleUserForSelection] = useState<{
    uid: string;
    email: string;
    displayName: string;
  } | null>(null);

  // Sign up character class starter stats mapping
  const getStarterStats = (rpgClass: CharacterClass): CharacterStats => {
    switch (rpgClass) {
      case "Warrior":
        return { STR: 15, AGI: 10, END: 12, VIT: 18 };
      case "Mage":
        return { STR: 8, AGI: 12, END: 18, VIT: 10 };
      case "Assassin":
        return { STR: 12, AGI: 18, END: 10, VIT: 12 };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorText("");

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setErrorText("You must designate a Hero display handle.");
          setLoading(false);
          return;
        }

        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const { user } = userCredential;

        // 2. Prepare user profile payload
        const starterProfile: UserProfile = {
          uid: user.uid,
          email: user.email || email,
          displayName: displayName.trim(),
          characterClass: selectedClass,
          level: 1,
          xp: 0,
          stats: getStarterStats(selectedClass),
          streak: 0,
          lastWorkoutDate: null,
          createdAt: new Date().toISOString(),
          badges: ["novice_badge"],
        };

        // 3. Write profile to Firestore
        await setDoc(doc(db, "users", user.uid), starterProfile);
        onAuthSuccess(starterProfile);
      } else {
        // Log in
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        // Profile will be auto-loaded in the parent App.tsx listener
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorText("Email already claims a soul in this realm.");
      } else if (err.code === "auth/weak-password") {
        setErrorText("Your magical password must be at least 6 characters.");
      } else if (err.code === "auth/invalid-credential") {
        setErrorText("Incorrect credentials; check email/password spells.");
      } else if (err.code === "auth/operation-not-allowed") {
        setIsOpNotAllowed(true);
        setErrorText("Email/Password authentication provider is not enabled in your Firebase console project template.");
      } else {
        setErrorText(err.message || "An error occurred. Check internet magic.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorText("");
    setIsOpNotAllowed(false);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const { user } = userCredential;

      // Prepopulate displayName with user's Google display name as a starter guess
      if (user.displayName) {
        setDisplayName(user.displayName);
      }

      // Check if user profile already exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        onAuthSuccess(userSnap.data() as UserProfile);
      } else {
        // First-time user sign up via Google Login! Prompt them to complete class selection.
        setGoogleUserForSelection({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "New Hunter"
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setIsOpNotAllowed(true);
        setErrorText("Google Sign-In is not enabled as a provider in your Firebase project.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setErrorText("SSO popup dismissed by owner before authenticating.");
      } else {
        setErrorText(err.message || "An error occurred during Google authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = () => {
    setLoading(true);
    setErrorText("");
    try {
      const guestUid = `guest_${Math.random().toString(36).substring(2, 11)}`;
      const guestHandle = displayName.trim() || "ShadowHunter";
      const starterProfile: UserProfile = {
        uid: guestUid,
        email: "local-hunter@level-fit.realm",
        displayName: guestHandle,
        characterClass: selectedClass,
        level: 1,
        xp: 0,
        stats: getStarterStats(selectedClass),
        streak: 0,
        lastWorkoutDate: null,
        createdAt: new Date().toISOString(),
        badges: ["novice_badge"],
        shadows: []
      };
      
      localStorage.setItem(`profile_${guestUid}`, JSON.stringify(starterProfile));
      
      const defaultQuests: Quest[] = [
        {
          id: "quest_1",
          userId: guestUid,
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
          userId: guestUid,
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
          userId: guestUid,
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
      localStorage.setItem(`quests_${guestUid}`, JSON.stringify(defaultQuests));
      onAuthSuccess(starterProfile);
    } catch (err: any) {
      setErrorText("Guest portal formulation encountered a memory glitch.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUserForSelection) return;
    if (!displayName.trim()) {
      setErrorText("You must designate a Hero display handle.");
      return;
    }
    setLoading(true);

    try {
      const starterProfile: UserProfile = {
        uid: googleUserForSelection.uid,
        email: googleUserForSelection.email,
        displayName: displayName.trim(),
        characterClass: selectedClass,
        level: 1,
        xp: 0,
        stats: getStarterStats(selectedClass),
        streak: 0,
        lastWorkoutDate: null,
        createdAt: new Date().toISOString(),
        badges: ["novice_badge"],
      };

      await setDoc(doc(db, "users", googleUserForSelection.uid), starterProfile);
      onAuthSuccess(starterProfile);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Failed to finalize character awakening. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (googleUserForSelection) {
    return (
      <div className="w-full max-w-md mx-auto p-8 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden text-center z-10 my-8">

        <h1 className="text-3xl font-display font-semibold uppercase tracking-widest text-[#C9B8F0]">
          ARISE HUNTER
        </h1>
        <p className="text-[#9A8FB8] text-xs mt-1.5 font-monument tracking-[0.3em] uppercase mb-6">
          Initialize your Hero Class Specialty
        </p>

        {errorText && (
          <div className="mb-4 p-3 bg-red-950/40 border border-dashed border-red-500/30 rounded-xl text-red-400 text-xs font-display">
            ⚠️ {errorText}
          </div>
        )}

        <form onSubmit={handleCreateGoogleProfile} className="space-y-4 text-left">
          <div>
            <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-1">
              Soulbound Account
            </label>
            <div className="w-full h-11 px-4 text-xs font-display rounded-xl border border-white/10 bg-[#15101F] text-[#9A8FB8] flex items-center overflow-x-auto whitespace-nowrap">
              {googleUserForSelection.email}
            </div>
          </div>

          <div>
            <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-1">
              Gamer Display Handle
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g., Lancelot99, ShadowFiend"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-4 text-xs rounded-xl border border-white/10 bg-[#15101F] text-[#EDE6FA] placeholder-[#9A8FB8] focus:outline-none focus:border-[#C9B8F0]/50"
            />
          </div>

          <div>
            <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-2">
              Choose Heroic Guild Specialty
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: "Warrior" as CharacterClass, icon: Sword, color: "border-rose-600 bg-rose-950/20 text-rose-300", spec: "STR + VIT" },
                { name: "Mage" as CharacterClass, icon: Wand2, color: "border-purple-600 bg-purple-950/20 text-purple-300", spec: "END + AGI" },
                { name: "Assassin" as CharacterClass, icon: Skull, color: "border-emerald-600 bg-emerald-950/20 text-emerald-300", spec: "AGI + VIT" },
              ].map((hClass) => {
                const ClassIcon = hClass.icon;
                const isSelected = selectedClass === hClass.name;
                return (
                  <button
                    key={hClass.name}
                    type="button"
                    onClick={() => setSelectedClass(hClass.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center h-[90px] select-none ${
                      isSelected
                        ? "bg-[#3A2F58] border-[#C9B8F0]/40 text-[#C9B8F0]"
                        : "border-white/10 bg-[#15101F] hover:bg-[#1d1729] text-[#9A8FB8]"
                    }`}
                  >
                    <ClassIcon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-display font-semibold uppercase">{hClass.name}</span>
                    <span className="text-[8px] opacity-75 mt-0.5 block font-monument leading-none">{hClass.spec}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-display font-semibold text-xs tracking-widest rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ minHeight: "44px" }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#241B3A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Finalize Awakening <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setGoogleUserForSelection(null)}
            className="w-full text-xs font-display text-[#9A8FB8] hover:text-[#C7BBE2] text-center block pt-2 underline cursor-pointer"
            style={{ minHeight: "44px" }}
          >
            Back to Portal Select
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 frost rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden text-center z-10 my-8">

      {/* Title */}
      <h1 className="text-4xl font-display font-semibold uppercase tracking-widest text-[#EDE6FA]">
        LevelFit
      </h1>
      <p className="text-[#9A8FB8] text-xs mt-1.5 font-monument tracking-[0.3em] uppercase">
        The Dark Fantasy RPG Fitness Realm
      </p>

      {errorText && (
        <div className="mt-4 p-3 bg-red-950/40 border border-dashed border-red-500/30 rounded-xl text-red-400 text-xs font-display text-left">
          ⚠️ {errorText}
        </div>
      )}

      {/* Interactive troubleshooting guide for auth/operation-not-allowed */}
      {isOpNotAllowed && (
        <div className="mt-4 p-4 rounded-xl border border-[#C9B8F0]/30 bg-[#15101F] text-left font-display text-xs text-[#C7BBE2] space-y-2">
          <h3 className="text-[#C9B8F0] font-display font-semibold uppercase tracking-wider text-xs">
            Realm Config Required
          </h3>
          <p className="leading-relaxed text-[10px]">
            The <strong>Email/Password</strong> sign-in method is currently disabled in your Firebase project. To enable it:
          </p>
          <ol className="text-[10px] text-[#9A8FB8] space-y-1 list-decimal list-inside leading-snug">
            <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#C9B8F0] font-semibold underline decoration-[#C9B8F0]/50">Firebase Console</a>.</li>
            <li>Select your current project.</li>
            <li>Under &quot;Build&quot; in the left panel, click <strong>Authentication</strong>.</li>
            <li>Go to the <strong>Sign-in method</strong> tab.</li>
            <li>Click <strong>Add new provider</strong> (or edit) &amp; choose <strong>Email/Password</strong>.</li>
            <li>Enable the toggle and click <strong>Save</strong>.</li>
          </ol>
          <div className="pt-2 border-t border-white/10 text-[10px] text-[#C9B8F0] leading-snug">
            💡 <strong>Instant Bypass:</strong> Use the <strong>Google Sign-In</strong> button below. It requires zero configuration and works instantly!
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        {isSignUp && (
          <div>
            <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-1">
              Gamer Display Handle
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g., Lancelot99, ShadowFiend"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-11 px-4 text-xs rounded-xl border border-white/10 bg-[#15101F] text-[#EDE6FA] placeholder-[#9A8FB8] focus:outline-none focus:border-[#C9B8F0]/50"
            />
          </div>
        )}

        <div>
          <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-1">
            Spellbound Email
          </label>
          <input
            type="email"
            required
            placeholder="hero@realm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 text-xs rounded-xl border border-white/10 bg-[#15101F] text-[#EDE6FA] placeholder-[#9A8FB8] focus:outline-none focus:border-[#C9B8F0]/50"
          />
        </div>

        <div>
          <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-1">
            Arcane Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs rounded-xl border border-white/10 bg-[#15101F] text-[#EDE6FA] placeholder-[#9A8FB8] focus:outline-none focus:border-[#C9B8F0]/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-[#9A8FB8] hover:text-[#C7BBE2] focus:outline-none"
              style={{ minHeight: "44px" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Class selection cards on sign up */}
        {isSignUp && (
          <div>
            <label className="text-[#C9B8F0]/60 text-[10px] font-monument uppercase tracking-[0.3em] block mb-2.5">
              Choose Heroic Guild Specialty
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: "Warrior" as CharacterClass, icon: Sword, color: "border-rose-600 bg-rose-950/20 text-rose-300", spec: "STR + VIT" },
                { name: "Mage" as CharacterClass, icon: Wand2, color: "border-purple-600 bg-purple-950/20 text-purple-300", spec: "END + AGI" },
                { name: "Assassin" as CharacterClass, icon: Skull, color: "border-emerald-600 bg-emerald-950/20 text-emerald-300", spec: "AGI + VIT" },
              ].map((hClass) => {
                const ClassIcon = hClass.icon;
                const isSelected = selectedClass === hClass.name;
                return (
                  <button
                    key={hClass.name}
                    type="button"
                    onClick={() => setSelectedClass(hClass.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center h-[90px] select-none ${
                      isSelected
                        ? "bg-[#3A2F58] border-[#C9B8F0]/40 text-[#C9B8F0]"
                        : "border-white/10 bg-[#15101F] hover:bg-[#1d1729] text-[#9A8FB8]"
                    }`}
                  >
                    <ClassIcon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-display font-semibold uppercase">{hClass.name}</span>
                    <span className="text-[8px] opacity-75 mt-0.5 block font-monument leading-none">{hClass.spec}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Trigger */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-display font-semibold text-xs tracking-widest rounded-full hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#241B3A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isSignUp ? "Manifest Character" : "Enter Portal"} <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Google authentication bypass and Instant local bypass */}
      <div className="mt-5 space-y-3">
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[#9A8FB8] text-[9px] font-monument uppercase tracking-[0.3em]">OR</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-11 frost text-[#C7BBE2] font-display font-semibold uppercase text-[10px] tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-4 h-4"
            referrerPolicy="no-referrer"
          />
          Enter via Google Core SSO
        </button>

        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={loading}
          className="w-full h-11 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-display font-semibold uppercase text-[10px] tracking-widest rounded-full hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          <Sparkles className="w-4 h-4 text-[#241B3A]" />
          Offline Demo Portal (Instant Play)
        </button>
        <span className="block text-[9px] text-[#9A8FB8] font-display text-center">
          ⚡ Bypasses Firebase Auth restrictions & saves all progress locally
        </span>
      </div>

      {/* Switch mode */}
      <div className="mt-6 text-xs font-display text-[#9A8FB8]">
        {isSignUp ? "Already initialized a hero?" : "Manifest your destiny in this fitness realm?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorText("");
          }}
          className="text-[#C9B8F0] hover:text-[#C7B5EC] font-semibold underline cursor-pointer hover:scale-105 transition-transform"
          style={{ minHeight: "44px", padding: "4px" }}
        >
          {isSignUp ? "Ascend Existing Hero" : "Awaken Starter Hero"}
        </button>
      </div>
    </div>
  );
}
