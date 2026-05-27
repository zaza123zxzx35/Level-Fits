export type CharacterClass = "Warrior" | "Mage" | "Assassin";

export interface CharacterStats {
  STR: number; // Strength
  AGI: number; // Agility
  END: number; // Endurance
  VIT: number; // Vitality
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  characterClass: CharacterClass;
  level: number;
  xp: number; // Current experience progress in this level (e.g. 0 to 1000)
  stats: CharacterStats;
  streak: number;
  lastWorkoutDate: string | null; // "YYYY-MM-DD"
  createdAt: string;
  badges: string[];
  equippedTitle?: string;
  shadows?: string[];
  debuffActive?: boolean;
  debuffReason?: string;
  punishmentQuestActive?: boolean;
  punishmentQuestProgress?: number; // Out of 100 reps

}

export type WorkoutCategory = "Strength" | "Cardio" | "Flexibility" | "Endurance";

export interface WorkoutLog {
  id: string;
  userId: string;
  exerciseName: string;
  category: WorkoutCategory;
  sets: number;
  reps: number;
  duration: number; // in minutes
  intensity: number; // 1-5
  xpGained: number;
  loggedAt: string; // ISO string
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: WorkoutCategory | "Streak" | "Any";
  targetValue: number;
  currentValue: number;
  completed: boolean;
  xpReward: number;
  badgeReward?: string;
  createdAt: string;
}

export interface FriendRelation {
  id: string;
  userId: string;
  friendUid: string;
  friendUsername: string;
  friendClass: CharacterClass;
  friendLevel: number;
  friendXp: number;
  addedAt: string;
}

export interface NotificationSetting {
  id: string;
  time: string; // "HH:MM"
  enabled: boolean;
}
