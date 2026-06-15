import React, { useState, useEffect, useRef } from "react";
import { UserProfile, TransformationState, TransformationDayDone } from "../types";
import { getDayPlan, TOTAL_DAYS, SUCCESS_THRESHOLD } from "../data/transformationProgram";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { sfx } from "../utils/audio";
import { HunterHero } from "./HunterHero";
import {
  Dumbbell,
  Salad,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Trophy,
  Camera,
  ImagePlus,
  Moon,
  Wind,
  Footprints,
  Info,
} from "lucide-react";

interface TransformationViewProps {
  currentUser: UserProfile;
  onReward?: (xp: number, statPoints: number) => void;
  onLockChange?: (locked: boolean) => void;
}

const DAY_XP_REWARD = 250;
const DAY_STAT_REWARD = 1;
const FINAL_XP_REWARD = 2000;
const FINAL_STAT_REWARD = 10;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysSince(start: string) {
  const s = new Date(start + "T00:00:00").getTime();
  const t = new Date(todayStr() + "T00:00:00").getTime();
  return Math.floor((t - s) / 86400000);
}

const EMPTY_DAY: TransformationDayDone = { workout: false, nutrition: false, skincare: false };

// Downscale an uploaded image to a small JPEG data URL so it fits in storage.
function downscaleImage(file: File, maxSize = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TransformationView({ currentUser, onReward, onLockChange }: TransformationViewProps) {
  const [state, setState] = useState<TransformationState>({
    startDate: null,
    completions: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  };
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const isGuest = currentUser.uid.startsWith("guest_");
  const storageKey = `transformation_${currentUser.uid}`;
  const heroKey = `heroImage_${currentUser.uid}`;

  // Custom hero image is kept on-device only (never committed / never uploaded to the cloud)
  useEffect(() => {
    try {
      setHeroImage(localStorage.getItem(heroKey));
    } catch (e) {}
  }, [currentUser.uid]);

  const handleHeroPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await downscaleImage(file, 900);
      localStorage.setItem(heroKey, dataUrl);
      setHeroImage(dataUrl);
      sfx.playClick();
    } catch (err) {
      console.error("hero photo error", err);
    } finally {
      e.target.value = "";
    }
  };

  // Load persisted state
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (isGuest) {
          const raw = localStorage.getItem(storageKey);
          if (raw && !cancelled) setState(JSON.parse(raw));
        } else {
          const ref = doc(db, `users/${currentUser.uid}/soloLeveling`, "transformation");
          const snap = await getDoc(ref);
          if (snap.exists() && !cancelled) setState(snap.data() as TransformationState);
        }
      } catch (e) {
        console.error("Failed to load transformation state", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser.uid]);

  const persist = async (next: TransformationState) => {
    setState(next);
    try {
      if (isGuest) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } else {
        const ref = doc(db, `users/${currentUser.uid}/soloLeveling`, "transformation");
        await setDoc(ref, next);
      }
    } catch (e) {
      console.error("Failed to save transformation state", e);
    }
  };

  // Derived progress
  const started = !!state.startDate;
  const rawDay = started ? daysSince(state.startDate as string) + 1 : 0;
  const currentDay = started ? Math.min(Math.max(rawDay, 1), TOTAL_DAYS) : 0;
  const programOver = started && rawDay > TOTAL_DAYS;

  const dayDone = (d: number): TransformationDayDone => state.completions[d] || EMPTY_DAY;
  const isDayComplete = (d: number) => {
    const c = dayDone(d);
    return c.workout && c.nutrition && c.skincare;
  };
  const isDayPassed = (d: number) => dayDone(d).workout;

  const completedDays = Object.keys(state.completions).filter((k) => isDayComplete(Number(k))).length;
  const passedDays = Object.keys(state.completions).filter((k) => isDayPassed(Number(k))).length;

  const missedDays =
    started && currentDay > 1
      ? Array.from({ length: Math.min(currentDay - 1, TOTAL_DAYS) }, (_, i) => i + 1).filter(
          (d) => !isDayPassed(d)
        ).length
      : 0;

  const dayStatus = (d: number): "past" | "active" | "locked" => {
    if (!started) return "locked";
    if (d < currentDay) return "past";
    if (d === currentDay) return "active";
    return "locked";
  };

  const todayCleared = started && !programOver && isDayComplete(currentDay);

  const hardLock = !!state.disciplineLock && started && !programOver && !isDayPassed(currentDay);

  useEffect(() => {
    onLockChange?.(hardLock);
  }, [hardLock, onLockChange]);

  const toggleDisciplineLock = async () => {
    sfx.playClick();
    await persist({ ...state, disciplineLock: !state.disciplineLock });
  };

  const handleClaimFinal = async () => {
    if (!programOver || state.finalClaimed) return;
    onReward?.(FINAL_XP_REWARD, FINAL_STAT_REWARD);
    await persist({ ...state, finalClaimed: true });
    showNotice("Monarch Awakened");
    try {
      const sp = new SpeechSynthesisUtterance(
        "Twenty one days survived. You have arisen. The golden body is yours."
      );
      sp.pitch = 0.4;
      sp.rate = 0.85;
      window.speechSynthesis.speak(sp);
    } catch (e) {}
  };

  const handleStart = async () => {
    sfx.playClick();
    await persist({ startDate: todayStr(), completions: { 1: { ...EMPTY_DAY } } });
    setSelectedDay(1);
    try {
      const sp = new SpeechSynthesisUtterance("Protocol initiated. Twenty one day awakening begins now.");
      sp.pitch = 0.45;
      window.speechSynthesis.speak(sp);
    } catch (e) {}
  };

  const togglePillar = async (pillar: keyof TransformationDayDone) => {
    if (dayStatus(selectedDay) !== "active") return;
    const prev = dayDone(selectedDay);
    const nextDayDone = { ...prev, [pillar]: !prev[pillar] };
    const willComplete =
      nextDayDone.workout && nextDayDone.nutrition && nextDayDone.skincare && !isDayComplete(selectedDay);

    sfx.playClick();
    await persist({
      ...state,
      completions: { ...state.completions, [selectedDay]: nextDayDone },
    });

    if (willComplete) {
      onReward?.(DAY_XP_REWARD, DAY_STAT_REWARD);
      showNotice(`Daily Quest Cleared · +${DAY_XP_REWARD} XP`);
      try {
        const sp = new SpeechSynthesisUtterance("Daily gate cleared. The next gate is now open.");
        sp.pitch = 0.55;
        window.speechSynthesis.speak(sp);
      } catch (e) {}
    }
  };

  const handlePhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    which: "beforePhoto" | "afterPhoto"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await downscaleImage(file);
      await persist({ ...state, [which]: dataUrl });
    } catch (err) {
      console.error("photo error", err);
    } finally {
      e.target.value = "";
    }
  };

  const handleReset = async () => {
    if (!window.confirm("รีเซ็ตโปรแกรม 21 วันใหม่ทั้งหมด? ความคืบหน้าและรูปจะถูกล้าง")) return;
    await persist({ startDate: null, completions: {} });
    setSelectedDay(1);
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-[#9A8FB8] font-display text-base tracking-widest">
        Syncing protocol…
      </div>
    );
  }

  // ---- Pre-start landing (AWAKEN hero) ----
  if (!started) {
    return (
      <div className="space-y-6">
        <SLStyles />

        {/* AWAKEN hero — character art (top) fading into text + CTA (bottom) */}
        <div className="relative -mx-4 -mt-6 h-[460px] overflow-hidden">
          {/* hero art: custom image if provided, else original SVG hunter */}
          {heroImage ? (
            <img src={heroImage} alt="hero" className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <HunterHero className="absolute inset-0 w-full h-full" />
          )}

          {/* gradient fade to dark at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1B1528]/40 to-[#0A0E1A] pointer-events-none" />

          {/* change-hero button */}
          <button
            onClick={() => heroInputRef.current?.click()}
            className="absolute top-3 right-3 z-20 frost rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-[#C7BBE2] cursor-pointer"
          >
            <ImagePlus className="w-3 h-3" /> เปลี่ยนรูป
          </button>
          <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroPhoto} />

          {/* text + CTA */}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
            <p className="font-monument text-[11px] tracking-[0.45em] text-[#C9B8F0]/80 uppercase mb-2">Awaken</p>
            <h2 className="font-display text-[42px] leading-[0.95] text-[#EDE6FA] font-semibold drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              YOUR
              <br />
              <span className="text-[#C9B8F0]">AWAKENING</span>
              <br />
              BEGINS NOW
            </h2>
            <p className="text-[13px] text-[#C7BBE2] mt-3 leading-relaxed font-light">
              เดินตามเส้นทางของคุณ · ลงมือทำ · พิชิต · ปั้นร่างทองใน 21 วัน
            </p>
            <button
              onClick={handleStart}
              className="w-full mt-5 py-3.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold text-base rounded-full transition-colors cursor-pointer shadow-[0_8px_30px_rgba(185,163,227,0.35)]"
              style={{ minHeight: "52px" }}
            >
              Get Started
            </button>
          </div>
        </div>

        {/* What you'll do */}
        <div className="grid grid-cols-3 gap-3 px-1">
          <FeatureCard icon={<Dumbbell className="w-4 h-4" />} label="ดัมเบล + ลู่วิ่ง" />
          <FeatureCard icon={<Salad className="w-4 h-4" />} label="High-Protein" />
          <FeatureCard icon={<Sparkles className="w-4 h-4" />} label="ผิวใสออร่า" />
        </div>

        <div className="frost p-4 rounded-2xl">
          <p className="font-display text-lg text-[#EDE6FA] tracking-wide">กฎเหล็ก</p>
          <p className="text-[12px] text-[#9A8FB8] mt-1 leading-relaxed">
            รักษาวินัยให้ได้ 80–90% ไม่ต้องสมบูรณ์แบบ แต่ <span className="text-rose-300/90">ห้ามหยุดกลางคัน</span> ·
            ถ่ายรูปกระจกวันนี้เก็บไว้ อีก 3 สัปดาห์มาดูความเปลี่ยนแปลง
          </p>
        </div>
      </div>
    );
  }

  // ---- Active program ----
  const plan = getDayPlan(selectedDay);
  const selStatus = dayStatus(selectedDay);
  const selDone = dayDone(selectedDay);
  const progressPct = Math.round((passedDays / TOTAL_DAYS) * 100);
  const successReached = passedDays >= Math.ceil(TOTAL_DAYS * SUCCESS_THRESHOLD);
  const doneCount = (selDone.workout ? 1 : 0) + (selDone.nutrition ? 1 : 0) + (selDone.skincare ? 1 : 0);

  return (
    <div className="space-y-6">
      <SLStyles />
      {notice && <SystemNotice message={notice} />}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="font-monument text-[10px] tracking-[0.4em] text-[#C9B8F0]/60 uppercase">Awaken</p>
          <h2 className="font-display text-3xl text-[#EDE6FA] font-semibold leading-none mt-1">
            {programOver ? "Protocol Complete" : `Day ${currentDay}`}
            <span className="text-[#9A8FB8] text-xl"> / 21</span>
          </h2>
        </div>
        <div className="text-right">
          <span className="font-display text-3xl text-[#C9B8F0] font-semibold block leading-none">
            {progressPct}%
          </span>
          <span className="text-[10px] text-[#9A8FB8] tracking-wide">{passedDays}/21 cleared</span>
        </div>
      </div>

      {/* Progress bar + phase */}
      <div className="frost p-5 rounded-2xl">
        <p className="font-display text-lg text-[#EDE6FA] tracking-wide">
          {programOver ? "ครบ 21 วันแล้ว" : getDayPlan(currentDay).phase}
        </p>
        <div className="h-2 w-full bg-[#15101F] rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-[#7C5FC0] to-[#C9B8F0] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-[11px]">
          <span className="text-[#C9B8F0]">✓ {completedDays} วันครบ 3 เสา</span>
          <span className="text-rose-300/80">✕ {missedDays} วันที่พลาด</span>
        </div>
      </div>

      {/* Soft Gate status */}
      {!programOver && (
        <div className="frost px-4 py-3 rounded-2xl flex items-center gap-3">
          {todayCleared ? (
            <Check className="w-4 h-4 text-[#C9B8F0] shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-[#9A8FB8] shrink-0" />
          )}
          <p className="text-[12px] text-[#C7BBE2] leading-snug">
            {todayCleared
              ? `เคลียร์วัน ${currentDay} ครบแล้ว · ประตูวัน ${Math.min(currentDay + 1, TOTAL_DAYS)} เปิดพรุ่งนี้`
              : `ประตูวันถัดไปถูกล็อก — เคลียร์ 3 เสาของวัน ${currentDay} เพื่อปลดล็อก`}
          </p>
        </div>
      )}

      {/* Discipline Lock toggle */}
      {!programOver && (
        <button
          onClick={toggleDisciplineLock}
          className="w-full frost flex items-center gap-3 px-4 py-3 rounded-2xl text-left cursor-pointer"
        >
          <div className={`shrink-0 ${state.disciplineLock ? "text-rose-300" : "text-[#9A8FB8]"}`}>
            {state.disciplineLock ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-[#EDE6FA]">
              Discipline Lock · {state.disciplineLock ? "เปิด" : "ปิด"}
            </p>
            <p className="text-[11px] text-[#9A8FB8] mt-0.5 leading-snug">
              เปิดแล้วเข้าหน้าอื่นไม่ได้จนกว่าจะออกกำลังกายวันนี้เสร็จ
            </p>
          </div>
          <div
            className={`w-9 h-5 rounded-full shrink-0 relative transition-colors ${
              state.disciplineLock ? "bg-rose-500/80" : "bg-white/15"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                state.disciplineLock ? "left-4" : "left-0.5"
              }`}
            />
          </div>
        </button>
      )}

      {/* 21-day path */}
      <div>
        <p className="font-monument text-[11px] tracking-[0.35em] text-[#C9B8F0]/60 uppercase mb-3 px-1">
          The Path
        </p>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const st = dayStatus(d);
            const complete = isDayComplete(d);
            const missed = st === "past" && !isDayPassed(d);
            const isSel = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => {
                  sfx.playClick();
                  setSelectedDay(d);
                }}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center font-display text-sm font-semibold transition-all cursor-pointer ${
                  isSel ? "ring-1 ring-[#C9B8F0] scale-[1.06]" : ""
                } ${
                  complete
                    ? "bg-[#3A2F58] border-[#C9B8F0]/40 text-[#C9B8F0]"
                    : missed
                    ? "bg-[#3A2230] border-rose-500/30 text-rose-300/80"
                    : st === "active"
                    ? "bg-[#4A3B70] border-[#C9B8F0]/70 text-[#EDE6FA] shadow-[0_0_18px_rgba(124,95,192,0.45)]"
                    : st === "past"
                    ? "bg-white/[0.06] border-white/10 text-[#9A8FB8]"
                    : "bg-black/20 border-white/5 text-[#5A5270]"
                }`}
                style={{ minHeight: "40px" }}
              >
                {st === "locked" ? <Lock className="w-3 h-3" /> : complete ? <Check className="w-4 h-4" /> : d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quest Info panel (selected day) */}
      <div className="frost rounded-2xl p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg border border-[#C9B8F0]/40 flex items-center justify-center text-[#C9B8F0]">
              <Info className="w-3.5 h-3.5" />
            </span>
            <span className="font-monument text-sm tracking-[0.25em] text-[#EDE6FA] uppercase">Quest Info</span>
          </div>
          <span className="font-display text-base text-[#9A8FB8]">Day {selectedDay}</span>
        </div>

        <p className="text-center text-[12px] text-[#C7BBE2] mb-4">
          [Daily Quest: <span className="text-[#EDE6FA] font-medium">{plan.phase}</span>]
        </p>

        <p className="font-display text-2xl text-[#EDE6FA] text-center underline decoration-[#C9B8F0]/40 underline-offset-8 mb-5">
          Goal
        </p>

        {selStatus === "locked" ? (
          <div className="text-center py-6 text-[#9A8FB8] text-sm flex flex-col items-center gap-2">
            <Lock className="w-6 h-6" />
            ประตูยังปิด · ปลดล็อกเมื่อถึงวันที่ {selectedDay}
          </div>
        ) : (
          <div className="space-y-2.5" key={selectedDay}>
            <PillarRow
              icon={
                plan.workoutType === "rest" ? (
                  <Moon className="w-4 h-4" />
                ) : plan.workoutType === "recovery" ? (
                  <Wind className="w-4 h-4" />
                ) : plan.workoutType === "cardio" ? (
                  <Footprints className="w-4 h-4" />
                ) : (
                  <Dumbbell className="w-4 h-4" />
                )
              }
              title={plan.workoutTitle}
              detail={plan.workoutDetail}
              checked={selDone.workout}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("workout")}
              delay={0}
            />
            <PillarRow
              icon={<Salad className="w-4 h-4" />}
              title={plan.nutritionTitle}
              detail={plan.nutritionDetail}
              checked={selDone.nutrition}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("nutrition")}
              delay={80}
            />
            <PillarRow
              icon={<Sparkles className="w-4 h-4" />}
              title={plan.skincareTitle}
              detail={plan.skincareDetail}
              checked={selDone.skincare}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("skincare")}
              delay={160}
            />

            <p className="text-center text-[11px] text-[#9A8FB8] pt-2 leading-relaxed">
              {selStatus === "past"
                ? "วันที่ผ่านไปล็อกไว้ — เดินหน้าต่อที่วันปัจจุบัน"
                : `[ เคลียร์แล้ว ${doneCount} / 3 ]`}
            </p>
            {selStatus === "active" && (
              <p className="text-center text-[10px] text-rose-300/70 leading-relaxed">
                WARNING: ไม่ทำภารกิจรายวันให้ครบ จะมีบทลงโทษตามมา
              </p>
            )}
          </div>
        )}
      </div>

      {/* Before / After */}
      <div>
        <p className="font-monument text-[11px] tracking-[0.35em] text-[#C9B8F0]/60 uppercase mb-3 px-1">
          Before / After
        </p>
        <div className="grid grid-cols-2 gap-3">
          <PhotoSlot label="Day 0" photo={state.beforePhoto} onClick={() => beforeInputRef.current?.click()} />
          <PhotoSlot
            label="Day 21"
            photo={state.afterPhoto}
            locked={!programOver && passedDays < TOTAL_DAYS}
            onClick={() => {
              if (programOver || passedDays >= TOTAL_DAYS) afterInputRef.current?.click();
            }}
          />
        </div>
        <input ref={beforeInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e, "beforePhoto")} />
        <input ref={afterInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e, "afterPhoto")} />
      </div>

      {/* Final reveal */}
      {programOver && (
        <div className="frost rounded-2xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#B9A3E3]/15 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
              <div className="absolute w-20 h-20 border border-[#C9B8F0]/30 rounded-full animate-[spin_18s_linear_infinite]" />
              <div className="w-11 h-11 rounded-full bg-[#1E1730] border border-[#C9B8F0]/40 flex items-center justify-center shadow-[0_0_25px_rgba(185,163,227,0.4)]">
                <Trophy className="w-5 h-5 text-[#C9B8F0]" />
              </div>
            </div>
            <p className="font-monument text-[10px] tracking-[0.4em] text-[#C9B8F0]/60 uppercase mb-1">Final Gate</p>
            <h3 className="font-display text-2xl text-[#EDE6FA] font-semibold">
              {successReached ? "ร่างทองปลดล็อก" : "ครบ 21 วันแล้ว"}
            </h3>
            <p className="text-[12px] text-[#9A8FB8] mt-1">
              สำเร็จ {passedDays}/21 วัน ({progressPct}%){successReached ? " · ผ่านเกณฑ์วินัย 80%+" : ""}
            </p>

            {state.finalClaimed ? (
              <p className="mt-4 text-[12px] text-[#C9B8F0]">รับรางวัลแล้ว · +{FINAL_XP_REWARD} XP · +{FINAL_STAT_REWARD} Stat</p>
            ) : (
              <button
                onClick={handleClaimFinal}
                className="w-full mt-5 py-3.5 bg-[#B9A3E3] hover:bg-[#C7B5EC] text-[#241B3A] font-semibold rounded-full transition-colors cursor-pointer shadow-[0_8px_30px_rgba(185,163,227,0.3)]"
                style={{ minHeight: "52px" }}
              >
                รับรางวัล · +{FINAL_XP_REWARD} XP
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleReset}
        className="w-full py-2.5 text-[11px] tracking-widest uppercase text-[#6B6388] hover:text-rose-300/80 transition-colors cursor-pointer"
        style={{ minHeight: "40px" }}
      >
        Reset Protocol
      </button>
    </div>
  );
}

function SLStyles() {
  return (
    <style>{`
      .frost {
        background: rgba(42, 34, 64, 0.45);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(201, 184, 240, 0.12);
      }
      @keyframes slFlash {
        0% { opacity: 0; transform: translateY(-14px) scale(0.96); }
        12% { opacity: 1; transform: translateY(0) scale(1); }
        85% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-8px) scale(0.98); }
      }
      @keyframes slRise { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    `}</style>
  );
}

function SystemNotice({ message }: { message: string }) {
  return (
    <div className="fixed inset-x-0 top-6 z-[200] flex justify-center px-4 pointer-events-none">
      <div
        className="frost w-full max-w-xs rounded-2xl px-5 py-3.5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        style={{ animation: "slFlash 2.6s ease-in-out forwards" }}
      >
        <p className="font-monument text-[9px] tracking-[0.4em] text-[#C9B8F0]/60 uppercase mb-1">Notification</p>
        <p className="font-display text-lg text-[#EDE6FA]">{message}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="frost rounded-2xl py-4 flex flex-col items-center gap-2 text-[#C9B8F0]">
      {icon}
      <span className="text-[10px] text-[#C7BBE2] text-center px-1">{label}</span>
    </div>
  );
}

interface PillarRowProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
  checked: boolean;
  editable: boolean;
  onToggle: () => void;
  delay?: number;
}

function PillarRow({ icon, title, detail, checked, editable, onToggle, delay = 0 }: PillarRowProps) {
  return (
    <button
      onClick={onToggle}
      disabled={!editable}
      style={{ animation: `slRise 0.4s ease-out both`, animationDelay: `${delay}ms` }}
      className={`w-full text-left flex gap-3 p-3.5 rounded-xl border transition-all ${
        checked ? "bg-[#3A2F58]/60 border-[#C9B8F0]/40" : "bg-white/[0.04] border-white/10"
      } ${editable ? "cursor-pointer hover:bg-white/[0.07] active:scale-[0.99]" : "cursor-default opacity-90"}`}
    >
      <div
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border flex items-center justify-center ${
          checked ? "text-[#C9B8F0] border-[#C9B8F0]/60 bg-[#C9B8F0]/10" : "text-[#9A8FB8] border-white/15"
        }`}
      >
        {checked ? <Check className="w-4 h-4" /> : icon}
      </div>
      <div className="min-w-0">
        <p className={`text-[13px] leading-snug ${checked ? "text-[#C9B8F0]" : "text-[#EDE6FA]"}`}>{title}</p>
        <p className="text-[11px] text-[#9A8FB8] mt-1 leading-relaxed">{detail}</p>
      </div>
    </button>
  );
}

function PhotoSlot({
  label,
  photo,
  onClick,
  locked,
}: {
  label: string;
  photo?: string | null;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`aspect-[3/4] rounded-2xl border flex flex-col items-center justify-center overflow-hidden relative ${
        locked ? "border-white/5 bg-black/20 cursor-not-allowed" : "frost hover:border-[#C9B8F0]/30 cursor-pointer"
      }`}
    >
      {photo ? (
        <img src={photo} alt={label} className="w-full h-full object-cover" />
      ) : locked ? (
        <>
          <Lock className="w-5 h-5 text-[#5A5270] mb-1" />
          <span className="text-[10px] text-[#5A5270] px-2 text-center">ปลดล็อกเมื่อจบ 21 วัน</span>
        </>
      ) : (
        <>
          <Camera className="w-5 h-5 text-[#9A8FB8] mb-1" />
          <span className="text-[10px] text-[#9A8FB8]">แตะเพื่อเพิ่มรูป</span>
        </>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] font-monument tracking-[0.2em] text-[#C7BBE2] py-1 text-center uppercase">
        {label}
      </span>
    </button>
  );
}
