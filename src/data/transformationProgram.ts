// 21-Day Transformation Program ("King Henry" Golden Body protocol)
// Three daily pillars: Workout (Dumbbell + Treadmill), Nutrition, Skincare.
// The program runs on a repeating 7-day training cycle mapped onto days 1..21.

export type PillarKey = "workout" | "nutrition" | "skincare";

export type WorkoutType = "weights" | "cardio" | "recovery" | "rest";

export interface DayPlan {
  day: number; // 1..21
  phase: string; // Week banner label
  phaseShort: string;
  workoutType: WorkoutType;
  workoutTitle: string;
  workoutDetail: string;
  nutritionTitle: string;
  nutritionDetail: string;
  skincareTitle: string;
  skincareDetail: string;
}

export const TOTAL_DAYS = 21;

// Discipline rule: King Henry protocol = stay consistent at 80-90%, never quit mid-way.
export const SUCCESS_THRESHOLD = 0.8; // 17 / 21 days

const NUTRITION_OPTIONS = [
  {
    title: "เช้า: ไข่ต้ม 3-4 ฟอง + ข้าวโอ๊ต + กาแฟดำ · เย็น: อกไก่ย่าง + สลัดชามใหญ่",
    detail:
      "เน้น High-Protein + Calorie Deficit · ตัดแป้งขัดขาวมื้อเย็น · ดื่มน้ำ 2.5–3 ลิตร · กินมื้อเย็นให้จบก่อน 19:00 น.",
  },
  {
    title: "เช้า: ขนมปังโฮลวีต + เนยถั่ว + อกไก่ · เย็น: ยำทูน่า (น้ำแร่) + ไข่ต้ม + ผักต้ม",
    detail:
      "เลือกโปรตีนไม่ติดมัน · บล็อคโคลี่/แครอทต้ม · เลี่ยงน้ำตาล · ดื่มน้ำ 2.5–3 ลิตรเพื่อลดบวมน้ำที่ใบหน้า",
  },
];

const SKINCARE_AM = {
  title: "เช้า: Cleanser → Moisturizer → Sunscreen (2 ข้อนิ้ว)",
  detail: "ล้างหน้าเจลอ่อนโยน · มอยส์เนื้อเจล/น้ำ · กันแดดสูตรคุมมันทุกวัน กันหน้าหมองคล้ำ",
};

const SKINCARE_PM = {
  title: "เย็น: เช็ดกันแดดออก → Cleanser → (Serum) → Moisturizer",
  detail:
    "หลังออกกำลังล้างเหงื่อทันที · Niacinamide/BHA 2–3 วัน/สัปดาห์ · ปิดท้ายด้วยมอยส์เจอไรเซอร์ก่อนนอน",
};

interface CycleSlot {
  workoutType: WorkoutType;
  workoutTitle: string;
  workoutDetail: string;
}

// Repeating 7-day training cycle (Mon..Sun style split).
const TRAINING_CYCLE: CycleSlot[] = [
  {
    workoutType: "weights",
    workoutTitle: "เวทเทรนนิ่ง · Full Body Power",
    workoutDetail: "ดัมเบล Full Body 40–45 นาที · ยกขึ้นเร็ว ผ่อนลงช้า เน้นฟอร์มและการเกร็งกล้ามเนื้อ",
  },
  {
    workoutType: "cardio",
    workoutTitle: "คาร์ดิโอรีดไขมัน · Zone 2",
    workoutDetail: "วิ่งลู่ Zone 2 (ยังพูดเป็นประโยคได้) 45–60 นาที · ดึงไขมันสะสมที่หน้าและหน้าท้องมาใช้",
  },
  {
    workoutType: "weights",
    workoutTitle: "เวทเทรนนิ่ง · Push / Pull",
    workoutDetail: "ดัมเบลแบ่งส่วนบน 40–45 นาที · เพิ่มแรงต้านเมื่อยกได้ครบเซ็ตสบาย",
  },
  {
    workoutType: "cardio",
    workoutTitle: "คาร์ดิโอรีดไขมัน · Zone 2",
    workoutDetail: "วิ่งลู่หรือเดินชัน Zone 2 45–60 นาที · คุมหัวใจให้อยู่ในโซนเผาผลาญไขมัน",
  },
  {
    workoutType: "weights",
    workoutTitle: "เวทเทรนนิ่ง · Full Body Forge",
    workoutDetail: "ดัมเบล Full Body 40–45 นาที · โฟกัสกล้ามมัดใหญ่ เพิ่มระบบเผาผลาญ",
  },
  {
    workoutType: "recovery",
    workoutTitle: "Active Recovery",
    workoutDetail: "ยืดเหยียดกล้ามเนื้อ หรือเดินเร็วบนลู่เบาๆ 30 นาที ให้ร่างกายฟื้นตัว",
  },
  {
    workoutType: "rest",
    workoutTitle: "Rest Day · พักผ่อน",
    workoutDetail: "พักเต็มที่และนอนให้พอ กล้ามเนื้อเติบโตตอนพัก · ยังคุมอาหารและสกินแคร์ตามปกติ",
  },
];

export function getDayPlan(day: number): DayPlan {
  const idx = (day - 1) % TRAINING_CYCLE.length;
  const slot = TRAINING_CYCLE[idx];

  const phase =
    day <= 7
      ? "สัปดาห์ที่ 1 · ปรับตัว & สร้างวินัย"
      : day <= 14
      ? "สัปดาห์ที่ 2 · เร่งเครื่องเผาผลาญ"
      : "สัปดาห์ที่ 3 · ปั้นร่างทอง";
  const phaseShort = day <= 7 ? "WEEK 1" : day <= 14 ? "WEEK 2" : "WEEK 3";

  const nutrition = NUTRITION_OPTIONS[(day - 1) % NUTRITION_OPTIONS.length];

  return {
    day,
    phase,
    phaseShort,
    workoutType: slot.workoutType,
    workoutTitle: slot.workoutTitle,
    workoutDetail: slot.workoutDetail,
    nutritionTitle: nutrition.title,
    nutritionDetail: nutrition.detail,
    skincareTitle: `${SKINCARE_AM.title} · ${SKINCARE_PM.title}`,
    skincareDetail: `${SKINCARE_AM.detail} — ${SKINCARE_PM.detail}`,
  };
}

export const FULL_PROGRAM: DayPlan[] = Array.from({ length: TOTAL_DAYS }, (_, i) =>
  getDayPlan(i + 1)
);
