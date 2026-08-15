import { resolveExercise } from './exerciseLibrary';

export type Exercise = {
  exerciseId?: string;
  name: string;
  duration: string;
  instructions: string;
  safetyNote: string;
  target: string;
  alternative: string;
  mediaType?: 'gif' | 'video' | 'image' | 'none';
  mediaUrl?: string;
  mediaCredit?: string;
  instructorCue?: string;
  musclesWorked?: string[];
};

export type MissionTemplate = {
  title: string;
  description: string;
  durationMinutes: number;
  difficultyLevel: string;
  focusArea: string;
  xpReward: number;
  missionType: string;
  equipment: string[];
  exercises: Exercise[];
};

export type PathLessonSeed = {
  lessonName: string;
  sectionNumber: number;
  unitNumber: number;
  lessonNumber: number;
  lessonType: string;
  xpReward: number;
  estimatedDurationMinutes: number;
  difficulty: string;
  exercises: Exercise[];
};

// The static (fallback) content below is built from the shared exercise library
// so the whole app keys on stable exercise ids. English is used for the global
// seed path; AI-personalized plans are resolved per user language elsewhere.
const e = (id: string): Exercise => resolveExercise(id, 'en');

export const beginnerDailyMission: MissionTemplate = {
  title: 'Bodyweight Starter',
  description: 'A short full-body session focused on bodyweight basics: legs, glutes, core, and arms.',
  durationMinutes: 7,
  difficultyLevel: 'Beginner',
  focusArea: 'Full body',
  xpReward: 25,
  missionType: 'Daily mission',
  equipment: ['No equipment'],
  exercises: [
    e('jumping-jacks'),
    e('arm-circles'),
    e('chair-squat'),
    e('dead-bug'),
    e('wall-pushup'),
    e('glute-bridge'),
    e('child-pose-reach'),
  ],
};

export const practiceSessions: MissionTemplate[] = [
  {
    title: 'Core Quick Hit',
    description: 'A short abs-focused practice with controlled beginner movements.',
    durationMinutes: 6,
    difficultyLevel: 'Beginner',
    focusArea: 'Abs',
    xpReward: 15,
    missionType: 'Practice',
    equipment: ['No equipment'],
    exercises: [e('dead-bug'), e('crunch-reach'), e('forearm-plank'), e('bird-dog')],
  },
  {
    title: 'Glutes and Legs',
    description: 'Bodyweight lower-body work for glutes, thighs, and calves.',
    durationMinutes: 8,
    difficultyLevel: 'Beginner',
    focusArea: 'Glutes + legs',
    xpReward: 20,
    missionType: 'Practice',
    equipment: ['No equipment'],
    exercises: [e('glute-bridge'), e('chair-squat'), e('reverse-lunge'), e('calf-raise')],
  },
  {
    title: 'Arms Starter',
    description: 'Beginner upper-body practice using walls, planks, and controlled reps.',
    durationMinutes: 7,
    difficultyLevel: 'Beginner',
    focusArea: 'Arms + chest',
    xpReward: 18,
    missionType: 'Practice',
    equipment: ['No equipment'],
    exercises: [e('wall-pushup'), e('incline-pushup'), e('high-plank-shoulder-tap'), e('child-pose-reach')],
  },
  {
    title: 'Mobility Reset',
    description: 'A gentle reset for hips, back, shoulders, and legs.',
    durationMinutes: 5,
    difficultyLevel: 'Gentle',
    focusArea: 'Mobility',
    xpReward: 12,
    missionType: 'Practice',
    equipment: ['No equipment'],
    exercises: [e('cat-cow'), e('child-pose-reach'), e('hamstring-sweep'), e('standing-quad-stretch')],
  },
];

export const pathLessonSeeds: PathLessonSeed[] = [
  {
    lessonName: 'Show Up Warm-up',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Warm-up',
    xpReward: 10,
    estimatedDurationMinutes: 3,
    difficulty: 'Easy',
    exercises: [e('jumping-jacks'), e('arm-circles'), e('standing-hip-openers')],
  },
  {
    lessonName: 'Bodyweight Starter',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Full body',
    xpReward: 25,
    estimatedDurationMinutes: 7,
    difficulty: 'Beginner',
    exercises: beginnerDailyMission.exercises,
  },
  {
    lessonName: 'Control and Breathing',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Technique',
    xpReward: 15,
    estimatedDurationMinutes: 5,
    difficulty: 'Easy',
    exercises: [e('dead-bug'), e('cat-cow'), e('child-pose-reach')],
  },
  {
    lessonName: 'Glute Bridge Basics',
    sectionNumber: 2,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Glutes',
    xpReward: 20,
    estimatedDurationMinutes: 6,
    difficulty: 'Beginner',
    exercises: [e('standing-hip-openers'), e('glute-bridge'), e('calf-raise')],
  },
  {
    lessonName: 'Squat Foundations',
    sectionNumber: 2,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Legs',
    xpReward: 25,
    estimatedDurationMinutes: 8,
    difficulty: 'Beginner',
    exercises: [e('jumping-jacks'), e('chair-squat'), e('wall-sit'), e('hamstring-sweep')],
  },
  {
    lessonName: 'Lunge Introduction',
    sectionNumber: 2,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Legs + glutes',
    xpReward: 30,
    estimatedDurationMinutes: 9,
    difficulty: 'Beginner',
    exercises: [e('glute-bridge'), e('reverse-lunge'), e('calf-raise'), e('standing-quad-stretch')],
  },
  {
    lessonName: 'Deep Core Basics',
    sectionNumber: 3,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Abs',
    xpReward: 20,
    estimatedDurationMinutes: 6,
    difficulty: 'Beginner',
    exercises: [e('dead-bug'), e('bird-dog'), e('cat-cow')],
  },
  {
    lessonName: 'Plank Builder',
    sectionNumber: 3,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Abs',
    xpReward: 25,
    estimatedDurationMinutes: 7,
    difficulty: 'Beginner',
    exercises: [e('dead-bug'), e('forearm-plank'), e('side-plank'), e('child-pose-reach')],
  },
  {
    lessonName: 'Core Circuit',
    sectionNumber: 3,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Abs circuit',
    xpReward: 30,
    estimatedDurationMinutes: 9,
    difficulty: 'Beginner',
    exercises: [e('crunch-reach'), e('bird-dog'), e('forearm-plank'), e('side-plank')],
  },
  {
    lessonName: 'Wall Push-up Basics',
    sectionNumber: 4,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Arms',
    xpReward: 20,
    estimatedDurationMinutes: 6,
    difficulty: 'Beginner',
    exercises: [e('arm-circles'), e('wall-pushup'), e('child-pose-reach')],
  },
  {
    lessonName: 'Incline Push Strength',
    sectionNumber: 4,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Upper body',
    xpReward: 25,
    estimatedDurationMinutes: 8,
    difficulty: 'Beginner',
    exercises: [e('wall-pushup'), e('incline-pushup'), e('chair-triceps-dip'), e('child-pose-reach')],
  },
  {
    lessonName: 'Arms and Core Combo',
    sectionNumber: 4,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Arms + abs',
    xpReward: 30,
    estimatedDurationMinutes: 9,
    difficulty: 'Beginner',
    exercises: [e('incline-pushup'), e('high-plank-shoulder-tap'), e('forearm-plank'), e('dead-bug')],
  },
  {
    lessonName: 'Back and Hip Reset',
    sectionNumber: 5,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Mobility',
    xpReward: 15,
    estimatedDurationMinutes: 5,
    difficulty: 'Gentle',
    exercises: [e('cat-cow'), e('child-pose-reach'), e('standing-hip-openers')],
  },
  {
    lessonName: 'Leg Stretch Flow',
    sectionNumber: 5,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Mobility',
    xpReward: 18,
    estimatedDurationMinutes: 6,
    difficulty: 'Gentle',
    exercises: [e('hamstring-sweep'), e('standing-quad-stretch'), e('calf-raise')],
  },
  {
    lessonName: 'Full Body Review',
    sectionNumber: 5,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Review',
    xpReward: 35,
    estimatedDurationMinutes: 10,
    difficulty: 'Beginner',
    exercises: [e('chair-squat'), e('glute-bridge'), e('forearm-plank'), e('wall-pushup'), e('child-pose-reach')],
  },
];

export const achievementCatalog = [
  { name: 'First Workout Completed', type: 'milestone' },
  { name: '3-Day Streak', type: 'streak' },
  { name: '7-Day Streak', type: 'streak' },
  { name: 'Core Starter', type: 'focus' },
  { name: 'Glute Builder', type: 'focus' },
  { name: 'No Equipment Hero', type: 'equipment' },
  { name: '100 XP Earned', type: 'xp' },
];
