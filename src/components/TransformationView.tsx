import React, { useState, useEffect, useRef } from "react";
import { UserProfile, TransformationState, TransformationDayDone } from "../types";
import { getDayPlan, TOTAL_DAYS, SUCCESS_THRESHOLD } from "../data/transformationProgram";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { sfx } from "../utils/audio";
import {
  Dumbbell,
  Salad,
  Sparkles,
  Lock,
  Check,
  Flame,
  Trophy,
  Camera,
  ShieldAlert,
  Moon,
  Wind,
  Footprints,
} from "lucide-react";

interface TransformationViewProps {
  currentUser: UserProfile;
}

const PILLAR_META: { key: keyof TransformationDayDone; label: string; color: string }[] = [
  { key: "workout", label: "ออกกำลังกาย", color: "text-amber-400" },
  { key: "nutrition", label: "โภชนาการ", color: "text-emerald-400" },
  { key: "skincare", label: "สกินแคร์", color: "text-cyan-400" },
];

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

export function TransformationView({ currentUser }: TransformationViewProps) {
  const [state, setState] = useState<TransformationState>({
    startDate: null,
    completions: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const isGuest = currentUser.uid.startsWith("guest_");
  const storageKey = `transformation_${currentUser.uid}`;

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

  // Derived progress numbers
  const started = !!state.startDate;
  const rawDay = started ? daysSince(state.startDate as string) + 1 : 0;
  const currentDay = started ? Math.min(Math.max(rawDay, 1), TOTAL_DAYS) : 0;
  const programOver = started && rawDay > TOTAL_DAYS;

  const dayDone = (d: number): TransformationDayDone => state.completions[d] || EMPTY_DAY;
  const isDayComplete = (d: number) => {
    const c = dayDone(d);
    return c.workout && c.nutrition && c.skincare;
  };
  const isDayPassed = (d: number) => dayDone(d).workout; // core pillar cleared

  const completedDays = Object.keys(state.completions).filter((k) => isDayComplete(Number(k)))
    .length;
  const passedDays = Object.keys(state.completions).filter((k) => isDayPassed(Number(k))).length;

  // A day is "missed" if it's in the past and the core pillar was never cleared
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

  // Soft Gate: the next day stays locked until today's tasks are cleared
  const todayCleared = started && !programOver && isDayComplete(currentDay);

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
    if (dayStatus(selectedDay) !== "active") return; // only today is editable (no backfilling)
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
      try {
        sfx.playQuestComplete();
      } catch (e) {}
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
      <div className="text-center py-16 text-gray-400 font-mono text-xs">Syncing protocol...</div>
    );
  }

  // ---- Pre-start landing ----
  if (!started) {
    return (
      <div className="space-y-6">
        <SectionHeader />
        <div className="p-6 bg-gradient-to-br from-[#1A0B2E] via-[#0A0D1A] to-[#041E26] border-2 border-[#7B2FBE]/40 rounded-2xl text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00D4FF]/40 bg-[#060A1A] flex items-center justify-center shadow-[0_0_25px_rgba(0,212,255,0.35)]">
              <Sparkles className="w-7 h-7 text-[#00D4FF] animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-white">โปรโตคอลร่างทอง 21 วัน</h3>
            <p className="text-xs text-gray-400 font-mono mt-2 leading-relaxed">
              วินัย · ความสม่ำเสมอ · เรียบง่ายแต่ได้ผลจริง
              <br />
              เคลียร์ 3 เสาทุกวัน: ออกกำลังกาย · โภชนาการ · สกินแคร์
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-slate-950/60 border border-amber-500/20 rounded-lg">
                <Dumbbell className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                ดัมเบล + ลู่วิ่ง
              </div>
              <div className="p-2 bg-slate-950/60 border border-emerald-500/20 rounded-lg">
                <Salad className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                High-Protein
              </div>
              <div className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                ผิวใสออร่า
              </div>
            </div>

            <div className="mt-5 p-3 bg-[#07131D] border border-[#00D4FF]/15 rounded-xl text-left">
              <p className="text-[11px] text-gray-300 font-mono leading-relaxed">
                <span className="text-[#00D4FF] font-black">กฎเหล็ก:</span> รักษาวินัยให้ได้ 80–90%
                ไม่ต้องสมบูรณ์แบบ แต่ <span className="text-rose-400 font-bold">ห้ามหยุดกลางคัน</span>
              </p>
            </div>

            <button
              onClick={handleStart}
              className="w-full mt-5 py-3 bg-gradient-to-r from-purple-800 to-[#00C8FF] text-white font-black uppercase text-sm tracking-wider rounded-xl hover:scale-[1.02] transition-transform cursor-pointer shadow-[0_0_20px_rgba(123,47,190,0.4)]"
              style={{ minHeight: "48px" }}
            >
              เริ่ม Day 1 — Arise
            </button>
            <p className="text-[9px] text-gray-500 font-mono mt-3">
              ทริค: ถ่ายรูปตัวเองในกระจกวันนี้เก็บไว้ อีก 3 สัปดาห์มาดูความเปลี่ยนแปลง
            </p>
          </div>
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

  return (
    <div className="space-y-6">
      <SectionHeader />

      {/* Progress overview */}
      <div className="p-5 bg-gradient-to-br from-[#12041E] to-[#0A0D1A] border-2 border-[#7B2FBE]/30 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[9px] text-[#7B2FBE] font-mono uppercase tracking-widest font-black block">
              {programOver ? "PROTOCOL COMPLETE" : `${getDayPlan(currentDay).phaseShort} · DAY ${currentDay}/21`}
            </span>
            <h3 className="text-lg font-black text-white">
              {programOver ? "ครบ 21 วันแล้ว!" : getDayPlan(currentDay).phase}
            </h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-2xl font-black text-[#00C8FF] block">{progressPct}%</span>
            <span className="text-[9px] text-gray-500 uppercase">{passedDays}/21 วันสำเร็จ</span>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-950 rounded-full border border-purple-500/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-800 via-[#00C8FF] to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 flex gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded text-emerald-400">
            <Check className="w-3 h-3" /> {completedDays} วันครบ 3 เสา
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-rose-950/40 border border-rose-500/20 rounded text-rose-400">
            <ShieldAlert className="w-3 h-3" /> {missedDays} วันที่พลาด
          </span>
        </div>
      </div>

      {/* Soft Gate banner */}
      {!programOver && (
        <div
          className={`p-3 rounded-xl border font-mono text-[11px] flex items-center gap-2 ${
            todayCleared
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-amber-950/40 border-amber-500/30 text-amber-300"
          }`}
        >
          {todayCleared ? (
            <>
              <Check className="w-4 h-4 shrink-0" />
              <span>
                เคลียร์ภารกิจวัน {currentDay} ครบแล้ว! ประตูวัน {Math.min(currentDay + 1, TOTAL_DAYS)} จะเปิดพรุ่งนี้
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                Soft Gate: ประตูวันถัดไปถูกล็อก — เคลียร์ 3 เสาของวัน {currentDay} ให้ครบเพื่อปลดล็อก
              </span>
            </>
          )}
        </div>
      )}

      {/* 21-day path grid */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-black text-gray-300 font-mono uppercase tracking-widest mb-4">
          เส้นทาง 21 วัน
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const st = dayStatus(d);
            const complete = isDayComplete(d);
            const passed = isDayPassed(d);
            const missed = st === "past" && !passed;
            const isSel = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => {
                  sfx.playClick();
                  setSelectedDay(d);
                }}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center font-mono font-black text-xs transition-all cursor-pointer relative ${
                  isSel ? "ring-2 ring-[#00D4FF] scale-105" : ""
                } ${
                  complete
                    ? "bg-emerald-900/50 border-emerald-500/50 text-emerald-300"
                    : missed
                    ? "bg-rose-950/50 border-rose-600/40 text-rose-400"
                    : st === "active"
                    ? "bg-purple-900/50 border-[#7B2FBE] text-yellow-300 animate-pulse"
                    : st === "past"
                    ? "bg-slate-800/60 border-slate-700 text-gray-300"
                    : "bg-slate-950/60 border-slate-800 text-gray-600"
                }`}
                style={{ minHeight: "40px" }}
              >
                {st === "locked" ? (
                  <Lock className="w-3 h-3" />
                ) : complete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  d
                )}
                {st === "active" && <span className="text-[7px] uppercase">now</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-mono text-gray-500 uppercase">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/60 inline-block" />ครบ</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#7B2FBE] inline-block" />วันนี้</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-600/60 inline-block" />พลาด</span>
          <span className="flex items-center gap-1"><Lock className="w-2 h-2" />ล็อก</span>
        </div>
      </div>

      {/* Selected day detail */}
      <div className="p-5 bg-gradient-to-br from-[#0A0D1A] to-[#0F0A1E] border border-purple-500/25 rounded-2xl">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-black text-white">Day {selectedDay}</h4>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#7B2FBE] bg-purple-950/40 px-2 py-0.5 border border-[#7B2FBE]/20 rounded">
            {plan.phaseShort}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 font-mono mb-4">{plan.phase}</p>

        {selStatus === "locked" && (
          <div className="text-center py-8 text-gray-500 font-mono text-xs flex flex-col items-center gap-2">
            <Lock className="w-6 h-6" />
            ประตูยังปิดอยู่ · จะปลดล็อกเมื่อถึงวันที่ {selectedDay}
          </div>
        )}

        {selStatus !== "locked" && (
          <div className="space-y-3">
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
              accent="amber"
              title={plan.workoutTitle}
              detail={plan.workoutDetail}
              checked={selDone.workout}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("workout")}
            />
            <PillarRow
              icon={<Salad className="w-4 h-4" />}
              accent="emerald"
              title={plan.nutritionTitle}
              detail={plan.nutritionDetail}
              checked={selDone.nutrition}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("nutrition")}
            />
            <PillarRow
              icon={<Sparkles className="w-4 h-4" />}
              accent="cyan"
              title={plan.skincareTitle}
              detail={plan.skincareDetail}
              checked={selDone.skincare}
              editable={selStatus === "active"}
              onToggle={() => togglePillar("skincare")}
            />
            {selStatus === "past" && (
              <p className="text-[9px] text-gray-500 font-mono text-center pt-1">
                วันที่ผ่านไปแล้วล็อกไว้ — เดินหน้าต่อที่วันปัจจุบัน (ไม่ย้อนเช็คได้แบบ Duolingo)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Before / After photos */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-black text-gray-300 font-mono uppercase tracking-widest flex items-center gap-2 mb-4">
          <Camera className="w-3.5 h-3.5 text-[#00C8FF]" /> Before / After
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <PhotoSlot
            label="Day 0 · Before"
            photo={state.beforePhoto}
            onClick={() => beforeInputRef.current?.click()}
          />
          <PhotoSlot
            label="Day 21 · After"
            photo={state.afterPhoto}
            locked={!programOver && passedDays < TOTAL_DAYS}
            onClick={() => {
              if (programOver || passedDays >= TOTAL_DAYS) afterInputRef.current?.click();
            }}
          />
        </div>
        <input
          ref={beforeInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhoto(e, "beforePhoto")}
        />
        <input
          ref={afterInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhoto(e, "afterPhoto")}
        />
        <p className="text-[9px] text-gray-500 font-mono mt-3 text-center">
          รูปเก็บไว้ในเครื่อง/บัญชีของคุณเท่านั้น เพื่อเทียบผลส่วนตัว
        </p>
      </div>

      {/* Completion / success banner */}
      {programOver && (
        <div className="p-5 bg-gradient-to-br from-[#1A1206] to-[#0A0D1A] border-2 border-yellow-500/40 rounded-2xl text-center shadow-2xl">
          <Trophy className="w-10 h-10 mx-auto text-yellow-400 mb-2 animate-bounce" />
          <h3 className="text-lg font-black text-white">
            {successReached ? "ภารกิจสำเร็จ! ร่างทองปลดล็อก" : "ครบ 21 วันแล้ว"}
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-1">
            ทำสำเร็จ {passedDays}/21 วัน ({progressPct}%)
            {successReached ? " — ผ่านเกณฑ์วินัย 80%+ 🔥" : " — รอบหน้าดันให้ถึง 80%+ นะ"}
          </p>
        </div>
      )}

      <button
        onClick={handleReset}
        className="w-full py-2 text-[10px] font-mono uppercase tracking-wider text-gray-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
        style={{ minHeight: "40px" }}
      >
        รีเซ็ตโปรแกรม
      </button>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between border-b border-[#7B2FBE]/30 pb-3 font-mono">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-amber-500" />
        <h2 className="text-xs font-black text-amber-400 tracking-widest uppercase">
          21-DAY TRANSFORMATION
        </h2>
      </div>
      <span className="text-[9px] text-[#7B2FBE] font-bold tracking-widest uppercase bg-purple-950/40 px-2 py-0.5 border border-[#7B2FBE]/20 rounded h-5 flex items-center">
        GOLDEN BODY
      </span>
    </div>
  );
}

const ACCENT_MAP: Record<string, { border: string; bg: string; text: string }> = {
  amber: { border: "border-amber-500/30", bg: "bg-amber-950/20", text: "text-amber-400" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-950/20", text: "text-emerald-400" },
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-950/20", text: "text-cyan-400" },
};

interface PillarRowProps {
  icon: React.ReactNode;
  accent: "amber" | "emerald" | "cyan";
  title: string;
  detail: string;
  checked: boolean;
  editable: boolean;
  onToggle: () => void;
}

function PillarRow({ icon, accent, title, detail, checked, editable, onToggle }: PillarRowProps) {
  const a = ACCENT_MAP[accent];
  return (
    <button
      onClick={onToggle}
      disabled={!editable}
      className={`w-full text-left flex gap-3 p-3 rounded-xl border transition-all ${a.bg} ${a.border} ${
        editable ? "cursor-pointer hover:brightness-125 active:scale-[0.99]" : "cursor-default opacity-90"
      } ${checked ? "ring-1 ring-inset ring-current " + a.text : ""}`}
    >
      <div
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border flex items-center justify-center ${
          checked ? `${a.text} border-current` : "text-gray-600 border-slate-700"
        }`}
      >
        {checked ? <Check className="w-4 h-4" /> : icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold ${checked ? a.text : "text-gray-200"} font-sans leading-snug`}>
          {title}
        </p>
        <p className="text-[10px] text-gray-500 font-mono mt-0.5 leading-relaxed">{detail}</p>
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
      className={`aspect-[3/4] rounded-xl border border-dashed flex flex-col items-center justify-center overflow-hidden relative ${
        locked
          ? "border-slate-800 bg-slate-950/40 cursor-not-allowed"
          : "border-slate-700 bg-slate-950/60 hover:border-[#00D4FF]/40 cursor-pointer"
      }`}
    >
      {photo ? (
        <img src={photo} alt={label} className="w-full h-full object-cover" />
      ) : locked ? (
        <>
          <Lock className="w-5 h-5 text-gray-600 mb-1" />
          <span className="text-[9px] text-gray-600 font-mono px-2 text-center">ปลดล็อกเมื่อจบ 21 วัน</span>
        </>
      ) : (
        <>
          <Camera className="w-5 h-5 text-gray-500 mb-1" />
          <span className="text-[9px] text-gray-500 font-mono">แตะเพื่อเพิ่มรูป</span>
        </>
      )}
      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-mono text-gray-300 py-0.5 text-center uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}
