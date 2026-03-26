// src/types/database.ts
export interface MainCategory {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface SubCategory {
    id: string;
    name: string;
    mainCategoryId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Exercise {
    id: string;
    name: string;
    subCategoryId: string;
    exerciseType?: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';
    defaultRestTime?: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Lift {
    id: string;
    exerciseId: string;
    date: Date;
    weight: number;
    reps: number;
    rir?: number;
    notes?: string;
    isEachSide: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CardioSession {
    id: string;
    activityType: string;
    date: Date;
    time: number; // in minutes
    distance?: number; // in user's preferred unit
    rpe?: number; // 1-10 scale
    notes?: string;
    cardioType: 'zone2' | 'anaerobic';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface TimeGoal {
    id: 'zone2' | 'anaerobic';
    weeklyGoal: number; // in minutes
    currentWeekProgress: number; // in minutes
    lastUpdated: Date;
  }