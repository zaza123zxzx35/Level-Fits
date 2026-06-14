import React, { useState, useCallback, useRef } from "react";

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
const ALPHABET_DATA = [
  { letter: "A", word: "Apple",     emoji: "🍎", thai: "แอปเปิ้ล",   color: "#ef4444" },
  { letter: "B", word: "Bear",      emoji: "🐻", thai: "หมี",         color: "#f97316" },
  { letter: "C", word: "Cat",       emoji: "🐱", thai: "แมว",         color: "#eab308" },
  { letter: "D", word: "Dog",       emoji: "🐶", thai: "สุนัข",       color: "#22c55e" },
  { letter: "E", word: "Elephant",  emoji: "🐘", thai: "ช้าง",        color: "#14b8a6" },
  { letter: "F", word: "Fish",      emoji: "🐟", thai: "ปลา",         color: "#3b82f6" },
  { letter: "G", word: "Grapes",    emoji: "🍇", thai: "องุ่น",       color: "#8b5cf6" },
  { letter: "H", word: "Hat",       emoji: "🎩", thai: "หมวก",        color: "#ec4899" },
  { letter: "I", word: "Ice Cream", emoji: "🍦", thai: "ไอศกรีม",    color: "#f43f5e" },
  { letter: "J", word: "Juice",     emoji: "🧃", thai: "น้ำผลไม้",   color: "#f97316" },
  { letter: "K", word: "Kite",      emoji: "🪁", thai: "ว่าว",        color: "#84cc16" },
  { letter: "L", word: "Lion",      emoji: "🦁", thai: "สิงโต",      color: "#eab308" },
  { letter: "M", word: "Monkey",    emoji: "🐒", thai: "ลิง",         color: "#f97316" },
  { letter: "N", word: "Nest",      emoji: "🪺", thai: "รัง",         color: "#22c55e" },
  { letter: "O", word: "Orange",    emoji: "🍊", thai: "ส้ม",         color: "#f97316" },
  { letter: "P", word: "Penguin",   emoji: "🐧", thai: "นกเพนกวิน",  color: "#06b6d4" },
  { letter: "Q", word: "Queen",     emoji: "👸", thai: "ราชินี",      color: "#a855f7" },
  { letter: "R", word: "Rainbow",   emoji: "🌈", thai: "รุ้ง",        color: "#ec4899" },
  { letter: "S", word: "Sun",       emoji: "☀️", thai: "ดวงอาทิตย์", color: "#eab308" },
  { letter: "T", word: "Tiger",     emoji: "🐯", thai: "เสือ",        color: "#f97316" },
  { letter: "U", word: "Umbrella",  emoji: "☂️", thai: "ร่ม",         color: "#6366f1" },
  { letter: "V", word: "Violin",    emoji: "🎻", thai: "ไวโอลิน",    color: "#8b5cf6" },
  { letter: "W", word: "Watermelon",emoji: "🍉", thai: "แตงโม",      color: "#22c55e" },
  { letter: "X", word: "Xylophone", emoji: "🎵", thai: "ระนาด",      color: "#ec4899" },
  { letter: "Y", word: "Yacht",     emoji: "⛵", thai: "เรือใบ",      color: "#3b82f6" },
  { letter: "Z", word: "Zebra",     emoji: "🦓", thai: "ม้าลาย",     color: "#8b5cf6" },
];

const VOCAB: Record<string, { word: string; emoji: string; thai: string; color: string }[]> = {
  Animals: [
    { word: "Cat",      emoji: "🐱", thai: "แมว",       color: "#f97316" },
    { word: "Dog",      emoji: "🐶", thai: "สุนัข",     color: "#eab308" },
    { word: "Bird",     emoji: "🐦", thai: "นก",         color: "#22c55e" },
    { word: "Fish",     emoji: "🐟", thai: "ปลา",       color: "#3b82f6" },
    { word: "Rabbit",   emoji: "🐰", thai: "กระต่าย",   color: "#ec4899" },
    { word: "Tiger",    emoji: "🐯", thai: "เสือ",       color: "#f97316" },
    { word: "Elephant", emoji: "🐘", thai: "ช้าง",       color: "#8b5cf6" },
    { word: "Monkey",   emoji: "🐒", thai: "ลิง",        color: "#f59e0b" },
  ],
  Colors: [
    { word: "Red",    emoji: "🔴", thai: "สีแดง",     color: "#ef4444" },
    { word: "Blue",   emoji: "🔵", thai: "สีน้ำเงิน", color: "#3b82f6" },
    { word: "Green",  emoji: "🟢", thai: "สีเขียว",   color: "#22c55e" },
    { word: "Yellow", emoji: "🟡", thai: "สีเหลือง",  color: "#eab308" },
    { word: "Orange", emoji: "🟠", thai: "สีส้ม",     color: "#f97316" },
    { word: "Pink",   emoji: "🩷", thai: "สีชมพู",    color: "#ec4899" },
    { word: "Purple", emoji: "🟣", thai: "สีม่วง",    color: "#a855f7" },
    { word: "White",  emoji: "⬜", thai: "สีขาว",     color: "#94a3b8" },
  ],
  Food: [
    { word: "Apple",  emoji: "🍎", thai: "แอปเปิ้ล", color: "#ef4444" },
    { word: "Banana", emoji: "🍌", thai: "กล้วย",     color: "#eab308" },
    { word: "Rice",   emoji: "🍚", thai: "ข้าว",      color: "#94a3b8" },
    { word: "Egg",    emoji: "🥚", thai: "ไข่",        color: "#f59e0b" },
    { word: "Milk",   emoji: "🥛", thai: "นม",         color: "#e2e8f0" },
    { word: "Bread",  emoji: "🍞", thai: "ขนมปัง",    color: "#d97706" },
    { word: "Cake",   emoji: "🎂", thai: "เค้ก",       color: "#ec4899" },
    { word: "Pizza",  emoji: "🍕", thai: "พิซซ่า",    color: "#f97316" },
  ],
  Numbers: [
    { word: "One",   emoji: "1️⃣", thai: "หนึ่ง",  color: "#ef4444" },
    { word: "Two",   emoji: "2️⃣", thai: "สอง",     color: "#f97316" },
    { word: "Three", emoji: "3️⃣", thai: "สาม",     color: "#eab308" },
    { word: "Four",  emoji: "4️⃣", thai: "สี่",      color: "#22c55e" },
    { word: "Five",  emoji: "5️⃣", thai: "ห้า",      color: "#06b6d4" },
    { word: "Six",   emoji: "6️⃣", thai: "หก",       color: "#3b82f6" },
    { word: "Seven", emoji: "7️⃣", thai: "เจ็ด",     color: "#8b5cf6" },
    { word: "Eight", emoji: "8️⃣", thai: "แปด",      color: "#ec4899" },
  ],
};

const QUIZ_QUESTIONS = [
  { emoji:"🐱", prompt:"What animal is this?", choices:["Cat","Dog","Fish","Bird"],          answer:"Cat"      },
  { emoji:"🍎", prompt:"What fruit is this?",   choices:["Banana","Apple","Orange","Mango"],  answer:"Apple"    },
  { emoji:"🔴", prompt:"What color is this?",   choices:["Blue","Green","Red","Yellow"],      answer:"Red"      },
  { emoji:"🐶", prompt:"What animal is this?",  choices:["Cat","Dog","Fish","Bird"],           answer:"Dog"      },
  { emoji:"🍌", prompt:"What fruit is this?",   choices:["Apple","Orange","Mango","Banana"],  answer:"Banana"   },
  { emoji:"🔵", prompt:"What color is this?",   choices:["Red","Blue","Green","Purple"],      answer:"Blue"     },
  { emoji:"🐘", prompt:"What animal is this?",  choices:["Horse","Lion","Elephant","Tiger"],  answer:"Elephant" },
  { emoji:"☀️", prompt:"What do you see?",      choices:["Moon","Star","Cloud","Sun"],        answer:"Sun"      },
  { emoji:"🌈", prompt:"What is this?",         choices:["Cloud","Sky","Rain","Rainbow"],     answer:"Rainbow"  },
  { emoji:"2️⃣", prompt:"What number is this?", choices:["One","Three","Two","Four"],         answer:"Two"      },
];

/* ════════════════════════════════════════════════
   HELPER COMPONENTS
════════════════════════════════════════════════ */
function StarBackground() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    dur: (Math.random() * 3 + 2).toFixed(1),
    delay: (Math.random() * 4).toFixed(1),
  }));
  return (
    <div className="star-bg">
      {stars.map(s => (
        <div
          key={s.id}
          className="star-dot"
          style={{ left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size, "--dur":`${s.dur}s`, "--delay":`${s.delay}s` } as React.CSSProperties}
        />
      ))}
      {[
        { color:"rgba(124,58,237,.12)", size:350, top:"5%",  left:"80%", anim:"18s" },
        { color:"rgba(236,72,153,.10)", size:280, top:"55%", left:"5%",  anim:"22s" },
        { color:"rgba(59,130,246,.10)", size:200, top:"75%", left:"70%", anim:"15s" },
      ].map((orb,i) => (
        <div key={i} className="absolute rounded-full" style={{ background:orb.color, width:orb.size, height:orb.size, top:orb.top, left:orb.left, filter:"blur(60px)", animation:`float ${orb.anim} ease-in-out infinite`, animationDelay:`${i*2}s` }} />
      ))}
    </div>
  );
}

function ConfettiBlast({ trigger }: { trigger: number }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (trigger > 0) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2600);
      return () => clearTimeout(t);
    }
  }, [trigger]);
  if (!visible) return null;
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ["#f472b6","#fb923c","#facc15","#4ade80","#60a5fa","#a78bfa"][i % 6],
    left: 25 + Math.random() * 50,
    delay: Math.random() * .7,
    dur: 1.6 + Math.random() * .8,
    rot: Math.random() * 360,
  }));
  return (
    <>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{ left:`${p.left}%`, background:p.color, animationDuration:`${p.dur}s`, animationDelay:`${p.delay}s`, transform:`rotate(${p.rot}deg)` }} />
      ))}
    </>
  );
}

function SectionTitle({ emoji, title, sub }: { emoji:string; title:string; sub:string }) {
  return (
    <div className="text-center mb-8">
      <div className="text-6xl mb-3 anim-float">{emoji}</div>
      <h2 className="font-fredoka text-4xl md:text-5xl gradient-text mb-2">{title}</h2>
      <p className="text-purple-300 text-lg font-semibold">{sub}</p>
    </div>
  );
}

function SoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

/* ════════════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════════════ */
function HomePage({ onStart }: { onStart: () => void }) {
  const features = [
    { emoji:"🔤", label:"A-Z Alphabet", sub:"เรียนตัวอักษร",  color:"from-violet-600 to-purple-700" },
    { emoji:"📚", label:"Vocabulary",   sub:"คำศัพท์น่ารู้",   color:"from-pink-500 to-rose-600"   },
    { emoji:"🎮", label:"Fun Quiz",     sub:"ทดสอบความรู้",    color:"from-orange-400 to-amber-500" },
    { emoji:"⭐", label:"My Stars",     sub:"ดาวของฉัน",       color:"from-emerald-500 to-teal-600" },
  ];
  return (
    <div className="section-enter min-h-screen flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="text-center mb-10 relative">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-purple-500/30 anim-spin-slow"
          style={{ width:220, height:220, marginTop:-30 }}
        />
        <div className="text-[110px] leading-none mb-2 anim-float" style={{ filter:"drop-shadow(0 0 30px rgba(167,139,250,.8))" }}>🦉</div>
        <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-4 py-1 mb-4">
          <span className="anim-wave inline-block">👋</span>
          <span className="text-purple-200 font-bold text-sm">สวัสดี! Hello!</span>
        </div>
        <h1 className="font-fredoka text-6xl md:text-7xl lg:text-8xl mb-3">
          <span className="gradient-text">KiddieLingo</span>
        </h1>
        <p className="text-xl md:text-2xl text-purple-200 font-bold mb-2">
          เรียนภาษาอังกฤษสนุกๆ ✨
        </p>
        <p className="text-purple-300/80 text-base md:text-lg max-w-md mx-auto leading-relaxed">
          สำหรับเด็กประถม ป.1 – ป.3<br/>
          <span className="text-purple-400 text-sm">For Primary School Students</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full mb-10">
        {features.map((f, i) => (
          <div
            key={f.label}
            className="glass rounded-2xl p-5 text-center cursor-pointer hover:scale-105 transition-all duration-300 group"
            style={{ animationDelay:`${i*.1}s` }}
            onClick={onStart}
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform`} style={{ boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
              {f.emoji}
            </div>
            <div className="text-white font-bold text-sm md:text-base">{f.label}</div>
            <div className="text-purple-300 text-xs mt-1">{f.sub}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="font-fredoka text-2xl text-white px-10 py-4 rounded-2xl hover:scale-105 transition-transform duration-300"
        style={{ background:"linear-gradient(135deg, #7c3aed, #ec4899, #f97316)", backgroundSize:"200% 200%", animation:"gradient-pan 3s ease infinite, pulse-glow 2.5s ease-in-out infinite", boxShadow:"0 8px 40px rgba(124,58,237,.6)" }}
      >
        Let's Start Learning! 🚀
      </button>

      <div className="fixed top-20 left-8  text-3xl anim-float2 opacity-40 pointer-events-none select-none">✨</div>
      <div className="fixed top-32 right-10 text-4xl anim-float  opacity-30 pointer-events-none select-none" style={{animationDelay:"1s"}}>⭐</div>
      <div className="fixed bottom-28 left-10 text-3xl anim-float2 opacity-35 pointer-events-none select-none" style={{animationDelay:"2s"}}>🌟</div>
      <div className="fixed top-1/2 right-6  text-2xl anim-float  opacity-25 pointer-events-none select-none" style={{animationDelay:".5s"}}>💫</div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ALPHABET PAGE
════════════════════════════════════════════════ */
function AlphabetPage({ onEarnStar }: { onEarnStar: () => void }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [learned, setLearned] = useState<Set<string>>(new Set());

  const toggle = (letter: string) => {
    setFlipped(prev => {
      const next = new Set(prev);
      if (next.has(letter)) { next.delete(letter); }
      else {
        next.add(letter);
        if (!learned.has(letter)) {
          setLearned(l => new Set(l).add(letter));
          onEarnStar();
        }
      }
      return next;
    });
  };

  return (
    <div className="section-enter px-4 py-8 max-w-5xl mx-auto">
      <SectionTitle emoji="🔤" title="The Alphabet" sub="แตะการ์ดเพื่อเรียนรู้คำศัพท์ A–Z!" />

      <div className="glass rounded-2xl p-4 mb-8 max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-purple-300 font-bold text-sm">ความก้าวหน้า / Progress</span>
          <span className="text-white font-bold">{learned.size}/26</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full progress-fill" style={{ width:`${(learned.size/26)*100}%`, background:"linear-gradient(90deg,#7c3aed,#ec4899)" }} />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {ALPHABET_DATA.map((item, i) => (
          <div key={item.letter} className="flip-card" style={{ height:120, animationDelay:`${i*.03}s` }} onClick={() => toggle(item.letter)}>
            <div className={`flip-card-inner ${flipped.has(item.letter) ? "flipped" : ""}`}>
              <div className="flip-card-front glass border-2" style={{ borderColor:learned.has(item.letter)?item.color:"rgba(255,255,255,.1)", boxShadow:learned.has(item.letter)?`0 0 20px ${item.color}55`:"none" }}>
                <div className="font-fredoka text-5xl font-bold" style={{ color:item.color, textShadow:`0 0 20px ${item.color}88` }}>{item.letter}</div>
                {learned.has(item.letter) && <div className="absolute top-2 right-2 text-sm">✅</div>}
              </div>
              <div className="flip-card-back" style={{ background:`linear-gradient(135deg,${item.color}ee,${item.color}88)` }}>
                <div className="text-3xl mb-1">{item.emoji}</div>
                <div className="text-white font-bold text-xs text-center px-1 leading-tight">{item.word}</div>
                <div className="text-white/80 text-[10px] mt-0.5">{item.thai}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {learned.size === 26 && (
        <div className="text-center mt-8 glass rounded-3xl p-8 border-2 border-yellow-400/30" style={{ boxShadow:"0 0 50px rgba(251,191,36,.2)" }}>
          <div className="text-6xl mb-3">🏆</div>
          <div className="font-fredoka text-3xl gradient-text">เก่งมาก! Excellent!</div>
          <div className="text-purple-300 mt-2">คุณเรียน A–Z ครบหมดแล้ว! You learned all 26 letters!</div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   VOCABULARY PAGE
════════════════════════════════════════════════ */
function VocabPage({ onEarnStar }: { onEarnStar: () => void }) {
  const categories = ["Animals","Colors","Food","Numbers"] as const;
  const catEmoji: Record<string,string> = { Animals:"🐾", Colors:"🎨", Food:"🍎", Numbers:"🔢" };
  const [active, setActive] = useState("Animals");
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string|null>(null);

  const markKnown = (key: string) => {
    if (!known.has(key)) {
      setKnown(prev => new Set(prev).add(key));
      onEarnStar();
    }
  };
  const playWord = (key: string) => {
    setPlaying(key);
    setTimeout(() => setPlaying(null), 700);
  };

  return (
    <div className="section-enter px-4 py-8 max-w-5xl mx-auto">
      <SectionTitle emoji="📚" title="Vocabulary" sub="คำศัพท์น่ารู้ — แตะเพื่อเรียนรู้และฝึกออกเสียง!" />

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105"
            style={active===cat
              ? { background:"linear-gradient(135deg,#7c3aed,#ec4899)", color:"white", boxShadow:"0 4px 20px rgba(124,58,237,.5)", transform:"scale(1.05)" }
              : { background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#c4b5fd" }}
          >
            <span>{catEmoji[cat]}</span>{cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {VOCAB[active].map((item, i) => {
          const key = `${active}-${item.word}`;
          const isKnown = known.has(key);
          const isPlaying = playing === key;
          return (
            <div
              key={item.word}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer group transition-all duration-300 hover:scale-105 relative overflow-hidden"
              style={{ border:`2px solid ${isKnown?item.color+"88":"rgba(255,255,255,.08)"}`, boxShadow:isKnown?`0 0 25px ${item.color}33`:"none", animationDelay:`${i*.06}s` }}
              onClick={() => { playWord(key); markKnown(key); }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" style={{ background:item.color }} />
              <div className={`text-5xl transition-transform duration-300 ${isPlaying?"scale-125":"group-hover:scale-110"}`}>{item.emoji}</div>
              <div className="font-fredoka text-xl text-white text-center">{item.word}</div>
              <div className="text-purple-300 text-sm">{item.thai}</div>
              <button
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 text-xs text-purple-200 transition-all mt-1"
                onClick={e => { e.stopPropagation(); playWord(key); }}
              >
                <SoundIcon /> ออกเสียง
              </button>
              {isKnown && (
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background:item.color }}>✓</div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 rounded-2xl border-2 animate-ping opacity-30" style={{ borderColor:item.color }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center mt-6 text-purple-300 font-bold">รู้จักแล้ว {known.size} คำ 🌟</div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   QUIZ PAGE
════════════════════════════════════════════════ */
function QuizPage({ onEarnStar }: { onEarnStar: () => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [history, setHistory] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[qIndex];

  const handleAnswer = (choice: string) => {
    if (selected !== null) return;
    setSelected(choice);
    const ok = choice === q.answer;
    setHistory(h => [...h, ok]);
    if (ok) { setScore(s => s+1); setConfetti(c => c+1); onEarnStar(); }
    setTimeout(() => {
      if (qIndex+1 >= QUIZ_QUESTIONS.length) setDone(true);
      else { setQIndex(qi => qi+1); setSelected(null); }
    }, 1400);
  };

  const restart = () => { setDone(false); setQIndex(0); setSelected(null); setScore(0); setHistory([]); };

  const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
  const grade = pct>=90?{text:"Excellent! 🏆",color:"#fbbf24"}
              : pct>=70?{text:"Very Good! 🌟",color:"#a78bfa"}
              : pct>=50?{text:"Good Job! 👍",color:"#34d399"}
              :         {text:"Keep Trying! 💪",color:"#f97316"};

  if (done) return (
    <div className="section-enter px-4 py-8 max-w-lg mx-auto flex flex-col items-center text-center">
      <ConfettiBlast trigger={confetti} />
      <div className="text-8xl mb-4 anim-float">{pct>=70?"🏆":"📝"}</div>
      <h2 className="font-fredoka text-4xl mb-2" style={{ color:grade.color }}>{grade.text}</h2>
      <p className="text-purple-300 text-lg mb-6">คุณได้ {score}/{QUIZ_QUESTIONS.length} คะแนน</p>
      <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center mb-8 text-white font-bold" style={{ background:`conic-gradient(${grade.color} ${pct*3.6}deg,rgba(255,255,255,.08) 0deg)`, boxShadow:`0 0 50px ${grade.color}44` }}>
        <div className="font-fredoka text-5xl">{pct}%</div>
        <div className="text-sm opacity-80">Score</div>
      </div>
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        {history.map((ok,i) => (
          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${ok?"bg-emerald-500":"bg-red-500"}`}>{ok?"✓":"✗"}</div>
        ))}
      </div>
      <button onClick={restart} className="font-fredoka text-xl text-white px-10 py-3 rounded-2xl hover:scale-105 transition-transform" style={{ background:"linear-gradient(135deg,#7c3aed,#ec4899)" }}>
        เล่นอีกครั้ง! Play Again 🔄
      </button>
    </div>
  );

  return (
    <div className="section-enter px-4 py-8 max-w-lg mx-auto">
      <SectionTitle emoji="🎮" title="Fun Quiz" sub="ทดสอบความรู้ของคุณ! Test your knowledge!" />
      <ConfettiBlast trigger={confetti} />

      <div className="flex justify-center gap-2 mb-6">
        {QUIZ_QUESTIONS.map((_,i) => (
          <div key={i} className="w-3 h-3 rounded-full transition-all duration-300" style={{ background:i<qIndex?"#10b981":i===qIndex?"#a78bfa":"rgba(255,255,255,.2)", boxShadow:i===qIndex?"0 0 10px #a78bfa":"none", transform:i===qIndex?"scale(1.3)":"scale(1)" }} />
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="glass rounded-xl px-4 py-2 text-sm font-bold text-yellow-300">⭐ {score} stars</div>
        <div className="glass rounded-xl px-4 py-2 text-sm font-bold text-purple-300">{qIndex+1}/{QUIZ_QUESTIONS.length}</div>
      </div>

      <div key={qIndex} className="glass rounded-3xl p-8 text-center mb-6 anim-bounce-in" style={{ border:"2px solid rgba(167,139,250,.2)", boxShadow:"0 0 40px rgba(124,58,237,.2)" }}>
        <div className="text-8xl mb-4" style={{ filter:"drop-shadow(0 0 20px rgba(167,139,250,.5))" }}>{q.emoji}</div>
        <p className="text-purple-200 font-bold text-xl">{q.prompt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.choices.map(choice => {
          const isSelected = selected===choice;
          const isAnswer   = choice===q.answer;
          const revealed   = selected!==null;
          let extra = "";
          if (revealed && isAnswer)              extra = " correct";
          else if (revealed && isSelected)       extra = " wrong anim-shake";
          return (
            <button
              key={choice}
              disabled={selected!==null}
              onClick={() => handleAnswer(choice)}
              className={`quiz-opt${extra} glass rounded-2xl p-4 font-fredoka text-xl text-white border-2 transition-all duration-300`}
              style={{ borderColor:"rgba(167,139,250,.2)" }}
            >
              {choice}
              {revealed && isAnswer  && <span className="ml-2">✓</span>}
              {revealed && isSelected && !isAnswer && <span className="ml-2">✗</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={`text-center mt-5 font-fredoka text-2xl anim-bounce-in ${selected===q.answer?"text-emerald-400":"text-red-400"}`}>
          {selected===q.answer ? "🎉 ถูกต้อง! Correct!" : `❌ คำตอบที่ถูกคือ: ${q.answer}`}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PROGRESS PAGE
════════════════════════════════════════════════ */
function ProgressPage({ stars, alphabetDone, vocabDone }: { stars:number; alphabetDone:number; vocabDone:number }) {
  const badges = [
    { emoji:"🌟", name:"First Star",  earned:stars>=1,          desc:"ได้ดาวแรกแล้ว!" },
    { emoji:"🔤", name:"ABC Hero",    earned:alphabetDone>=10,  desc:"เรียน 10 ตัวอักษร" },
    { emoji:"📚", name:"Word Master", earned:vocabDone>=5,      desc:"รู้จัก 5 คำศัพท์" },
    { emoji:"🌈", name:"Colorful",    earned:stars>=10,         desc:"ได้ 10 ดาว" },
    { emoji:"🏆", name:"Champion",    earned:stars>=30,         desc:"ได้ 30 ดาว" },
    { emoji:"🦉", name:"Wise Owl",    earned:alphabetDone>=26,  desc:"เรียน A–Z ครบ!" },
  ];

  return (
    <div className="section-enter px-4 py-8 max-w-2xl mx-auto">
      <SectionTitle emoji="⭐" title="My Stars" sub="ความก้าวหน้าของฉัน / My Progress" />

      <div className="glass rounded-3xl p-8 text-center mb-8" style={{ border:"2px solid rgba(251,191,36,.3)", boxShadow:"0 0 50px rgba(251,191,36,.15)" }}>
        <div className="font-fredoka text-8xl text-yellow-300 mb-1" style={{ textShadow:"0 0 30px rgba(251,191,36,.8)" }}>{stars}</div>
        <div className="text-yellow-200 font-bold text-xl">ดาวทั้งหมด ⭐</div>
        <div className="text-purple-300 text-sm mt-1">Total Stars Earned</div>
      </div>

      <div className="space-y-4 mb-8">
        {[
          { label:"ตัวอักษร A–Z",  emoji:"🔤", value:alphabetDone,            max:26, color:"#a78bfa" },
          { label:"คำศัพท์",        emoji:"📚", value:vocabDone,               max:32, color:"#f472b6" },
          { label:"ดาวสะสม",        emoji:"⭐", value:Math.min(stars,50),      max:50, color:"#fbbf24" },
        ].map(bar => (
          <div key={bar.label} className="glass rounded-2xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-white font-bold text-sm">{bar.emoji} {bar.label}</span>
              <span className="text-purple-300 font-bold text-sm">{bar.value}/{bar.max}</span>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full progress-fill" style={{ width:`${Math.min((bar.value/bar.max)*100,100)}%`, background:`linear-gradient(90deg,${bar.color},${bar.color}88)`, boxShadow:`0 0 10px ${bar.color}66` }} />
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-fredoka text-2xl text-center text-purple-300 mb-4">🏅 Badges & Achievements</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map(b => (
          <div key={b.name} className="glass rounded-2xl p-4 text-center transition-all duration-300" style={{ border:`2px solid ${b.earned?"rgba(251,191,36,.5)":"rgba(255,255,255,.05)"}`, boxShadow:b.earned?"0 0 25px rgba(251,191,36,.2)":"none", opacity:b.earned?1:.45 }}>
            <div className={`text-4xl mb-2 ${b.earned?"anim-float":""}`}>{b.emoji}</div>
            <div className={`font-bold text-sm ${b.earned?"text-yellow-300":"text-purple-400"}`}>{b.name}</div>
            <div className="text-purple-400 text-xs mt-1">{b.desc}</div>
            {b.earned && <div className="text-yellow-400 text-xs mt-1 font-bold">✅ ได้รับแล้ว!</div>}
          </div>
        ))}
      </div>

      <div className="text-center mt-8 glass rounded-2xl p-5">
        <div className="text-4xl mb-2">{stars>=30?"🏆":stars>=15?"🌟":stars>=5?"👍":"💪"}</div>
        <div className="font-fredoka text-xl text-white">
          {stars>=30?"เก่งมาก! You're a Champion!":stars>=15?"ดีมากเลย! Great Progress!":stars>=5?"เดินหน้าต่อไป! Keep Going!":"เริ่มต้นเลย! Let's Begin!"}
        </div>
        <div className="text-purple-300 text-sm mt-1">
          {stars>=30?"คุณทำได้ยอดเยี่ยมมาก! 🎊":`อีก ${Math.max(0,30-stars)} ดาว ถึงจะได้รับรางวัล Champion! 🏆`}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════ */
type Tab = "home"|"alphabet"|"vocab"|"quiz"|"progress";

const NAV = [
  { id:"home"     as Tab, emoji:"🏠", label:"Home"  },
  { id:"alphabet" as Tab, emoji:"🔤", label:"A-Z"   },
  { id:"vocab"    as Tab, emoji:"📚", label:"Words" },
  { id:"quiz"     as Tab, emoji:"🎮", label:"Quiz"  },
  { id:"progress" as Tab, emoji:"⭐", label:"Stars" },
];

export default function App() {
  const [tab, setTab]               = useState<Tab>("home");
  const [stars, setStars]           = useState(0);
  const [alphabetDone, setAlphabetDone] = useState(0);
  const [vocabDone, setVocabDone]   = useState(0);
  const [bursts, setBursts]         = useState<{id:number; x:number; y:number}[]>([]);
  const nextId = useRef(0);

  const earnStar = useCallback(() => {
    setStars(s => s+1);
    const id = ++nextId.current;
    const x = 50 + (Math.random()-0.5)*40;
    const y = 40 + (Math.random()-0.5)*30;
    setBursts(b => [...b, { id, x, y }]);
    setTimeout(() => setBursts(b => b.filter(s => s.id!==id)), 1000);
  }, []);

  return (
    <div className="bg-animated min-h-screen relative">
      <StarBackground />

      {/* Star burst FX */}
      {bursts.map(b => (
        <div key={b.id} className="star-burst" style={{ left:`${b.x}%`, top:`${b.y}%` }}>⭐</div>
      ))}

      {/* ── TOP NAVBAR ── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setTab("home")} className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform anim-float">🦉</span>
            <span className="font-fredoka text-xl gradient-text hidden sm:inline">KiddieLingo</span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`nav-item flex flex-col items-center px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${tab===item.id?"text-white":"text-purple-400 hover:text-purple-200"}`}
                style={tab===item.id?{background:"linear-gradient(135deg,rgba(124,58,237,.4),rgba(236,72,153,.2))"}:{}}
              >
                <span className="text-xl mb-0.5">{item.emoji}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Star counter */}
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => setTab("progress")} style={{ boxShadow:stars>0?"0 0 20px rgba(251,191,36,.3)":"none" }}>
            <span className="text-xl">⭐</span>
            <span className="font-fredoka text-xl text-yellow-300">{stars}</span>
          </div>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="relative z-10 pb-24 md:pb-8">
        {tab==="home"     && <HomePage     onStart={() => setTab("alphabet")} />}
        {tab==="alphabet" && <AlphabetPage onEarnStar={() => { earnStar(); setAlphabetDone(d => d+1); }} />}
        {tab==="vocab"    && <VocabPage    onEarnStar={() => { earnStar(); setVocabDone(d => d+1); }} />}
        {tab==="quiz"     && <QuizPage     onEarnStar={earnStar} />}
        {tab==="progress" && <ProgressPage stars={stars} alphabetDone={alphabetDone} vocabDone={vocabDone} />}
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background:"rgba(10,6,24,.92)", backdropFilter:"blur(16px)", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <div className="flex justify-around items-center px-2 py-2">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`nav-item flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 ${tab===item.id?"text-white":"text-purple-500"}`}
              style={tab===item.id?{background:"rgba(124,58,237,.25)"}:{}}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
