export type Exercise = {
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

export type Mission = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: string;
  focus: string;
  xpReward: number;
  type: string;
  equipment: string[];
  exercises: Exercise[];
};

export type LessonState = 'completed' | 'current' | 'locked';

export type PathLesson = {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  xpReward: number;
  difficulty: string;
  state: LessonState;
};

export type PathUnit = {
  title: string;
  summary: string;
  lessons: PathLesson[];
};

export type PracticeCategory = {
  title: string;
  focus: string;
  duration: string;
  xp: number;
  level: string;
};

const starterExercises: Exercise[] = [
  {
    name: 'Jumping Jacks',
    duration: '45 seconds',
    instructions: 'Jump your feet out while raising your arms overhead, then return to center with soft landings.',
    safetyNote: 'Keep your knees soft and switch to step jacks if jumping feels uncomfortable.',
    target: 'Warm-up',
    alternative: 'Step jacks',
    mediaType: 'none',
    mediaUrl: '',
    instructorCue: 'Show upbeat full-body movement with arms overhead and controlled landings.',
    musclesWorked: ['Shoulders', 'Hips', 'Calves', 'Core'],
  },
  {
    name: 'Chair Squat',
    duration: '8 reps',
    instructions: 'Sit your hips back toward a chair, keep your chest lifted, then stand by pressing through your heels.',
    safetyNote: 'Move with control and keep the range pain-free.',
    target: 'Legs + glutes',
    alternative: 'Half squat',
    mediaType: 'none',
    mediaUrl: '',
    instructorCue: 'Show knees tracking over toes and hips moving back first.',
    musclesWorked: ['Quads', 'Glutes', 'Core'],
  },
  {
    name: 'Dead Bug',
    duration: '8 reps each side',
    instructions: 'Lie on your back, brace your core, and slowly lower the opposite arm and leg.',
    safetyNote: 'Keep the lower back gently connected to the floor.',
    target: 'Core control',
    alternative: 'Heel taps',
    mediaType: 'none',
    mediaUrl: '',
    instructorCue: 'Keep the lower back gently connected to the floor.',
    musclesWorked: ['Abs', 'Deep core'],
  },
  {
    name: 'Wall Push-up',
    duration: '10 reps',
    instructions: 'Place hands on a wall, keep your body straight, bend your elbows, then press away.',
    safetyNote: 'Move with control and keep the range pain-free.',
    target: 'Chest + arms',
    alternative: 'Wall lean hold',
    mediaType: 'none',
    mediaUrl: '',
    instructorCue: 'Show elbows moving back at a comfortable angle.',
    musclesWorked: ['Chest', 'Triceps', 'Shoulders'],
  },
  {
    name: 'Glute Bridge',
    duration: '12 reps',
    instructions: 'Lie on your back, feet flat, squeeze your glutes, and lift your hips until your body forms a straight line.',
    safetyNote: 'Do not arch the lower back at the top.',
    target: 'Glutes',
    alternative: 'Small hip lift',
    mediaType: 'none',
    mediaUrl: '',
    instructorCue: 'Pause at the top without arching the lower back.',
    musclesWorked: ['Glutes', 'Hamstrings', 'Core'],
  },
];

export const dailyMission: Mission = {
  id: 'bodyweight-starter',
  title: 'Bodyweight Starter',
  description: 'A short full-body session focused on bodyweight basics: legs, glutes, core, and arms.',
  durationMinutes: 7,
  difficulty: 'Beginner',
  focus: 'Full body',
  xpReward: 25,
  type: 'Daily mission',
  equipment: ['No equipment'],
  exercises: starterExercises,
};

export const pathUnits: PathUnit[] = [
  {
    title: 'Unit 1: Start Moving',
    summary: 'Warm-up, breathing, and simple full-body wins.',
    lessons: [
      { id: 'show-up-warmup', title: 'Show Up Warm-up', type: 'Warm-up', durationMinutes: 3, xpReward: 10, difficulty: 'Easy', state: 'current' },
      { id: 'bodyweight-starter', title: 'Bodyweight Starter', type: 'Full body', durationMinutes: 7, xpReward: 25, difficulty: 'Beginner', state: 'locked' },
      { id: 'control-breathing', title: 'Control and Breathing', type: 'Technique', durationMinutes: 5, xpReward: 15, difficulty: 'Easy', state: 'locked' },
    ],
  },
  {
    title: 'Unit 2: Legs and Glutes',
    summary: 'Squats, bridges, lunges, and lower-body endurance.',
    lessons: [
      { id: 'glute-bridge-basics', title: 'Glute Bridge Basics', type: 'Glutes', durationMinutes: 6, xpReward: 20, difficulty: 'Beginner', state: 'locked' },
      { id: 'squat-foundations', title: 'Squat Foundations', type: 'Legs', durationMinutes: 8, xpReward: 25, difficulty: 'Beginner', state: 'locked' },
      { id: 'lunge-introduction', title: 'Lunge Introduction', type: 'Legs + glutes', durationMinutes: 9, xpReward: 30, difficulty: 'Beginner', state: 'locked' },
    ],
  },
  {
    title: 'Unit 3: Abs and Core',
    summary: 'Core control before intensity: dead bugs, planks, and side strength.',
    lessons: [
      { id: 'deep-core-basics', title: 'Deep Core Basics', type: 'Abs', durationMinutes: 6, xpReward: 20, difficulty: 'Beginner', state: 'locked' },
      { id: 'plank-builder', title: 'Plank Builder', type: 'Abs', durationMinutes: 7, xpReward: 25, difficulty: 'Beginner', state: 'locked' },
      { id: 'core-circuit', title: 'Core Circuit', type: 'Abs circuit', durationMinutes: 9, xpReward: 30, difficulty: 'Beginner', state: 'locked' },
    ],
  },
  {
    title: 'Unit 4: Arms and Upper Body',
    summary: 'Push-up progressions, triceps, shoulders, and plank stability.',
    lessons: [
      { id: 'wall-pushup-basics', title: 'Wall Push-up Basics', type: 'Arms', durationMinutes: 6, xpReward: 20, difficulty: 'Beginner', state: 'locked' },
      { id: 'incline-push-strength', title: 'Incline Push Strength', type: 'Upper body', durationMinutes: 8, xpReward: 25, difficulty: 'Beginner', state: 'locked' },
      { id: 'arms-core-combo', title: 'Arms and Core Combo', type: 'Arms + abs', durationMinutes: 9, xpReward: 30, difficulty: 'Beginner', state: 'locked' },
    ],
  },
  {
    title: 'Unit 5: Mobility and Review',
    summary: 'Stretch, recover, and review the full bodyweight foundation.',
    lessons: [
      { id: 'back-hip-reset', title: 'Back and Hip Reset', type: 'Mobility', durationMinutes: 5, xpReward: 15, difficulty: 'Gentle', state: 'locked' },
      { id: 'leg-stretch-flow', title: 'Leg Stretch Flow', type: 'Mobility', durationMinutes: 6, xpReward: 18, difficulty: 'Gentle', state: 'locked' },
      { id: 'full-body-review', title: 'Full Body Review', type: 'Review', durationMinutes: 10, xpReward: 35, difficulty: 'Beginner', state: 'locked' },
    ],
  },
];

export const practiceCategories: PracticeCategory[] = [
  { title: 'Core Quick Hit', focus: 'Abs', duration: '6 min', xp: 15, level: 'Beginner' },
  { title: 'Glutes and Legs', focus: 'Glutes + legs', duration: '8 min', xp: 20, level: 'Beginner' },
  { title: 'Arms Starter', focus: 'Arms + chest', duration: '7 min', xp: 18, level: 'Beginner' },
  { title: 'Mobility Reset', focus: 'Hips + back', duration: '5 min', xp: 12, level: 'Gentle' },
  { title: 'Plank Practice', focus: 'Abs + shoulders', duration: '5 min', xp: 15, level: 'Beginner' },
  { title: 'Low Impact Sweat', focus: 'Full body', duration: '7 min', xp: 18, level: 'Easy' },
];

export const achievements = [
  'First Workout Completed',
  '3-Day Streak',
  '7-Day Streak',
  'Core Starter',
  'Glute Builder',
  'No Equipment Hero',
  '100 XP Earned',
];

export const weeklyActivity = [
  { day: 'S', done: false },
  { day: 'M', done: false },
  { day: 'T', done: false },
  { day: 'W', done: false },
  { day: 'T', done: false },
  { day: 'F', done: false },
  { day: 'S', done: false },
];
