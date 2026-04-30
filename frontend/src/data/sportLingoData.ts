export type Exercise = {
  name: string;
  duration: string;
  instructions: string;
  safetyNote: string;
  target: string;
  alternative: string;
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

export const dailyMission: Mission = {
  id: 'beginner-cardio-boost',
  title: 'Beginner Cardio Boost',
  description: 'A friendly five-minute session for cardio, legs, and showing up today.',
  durationMinutes: 5,
  difficulty: 'Beginner',
  focus: 'Cardio + legs',
  xpReward: 20,
  type: 'Daily mission',
  equipment: ['No equipment'],
  exercises: [
    {
      name: 'Arm Circles',
      duration: '45 seconds',
      instructions: 'Stand tall and move your arms in slow circles. Switch direction halfway.',
      safetyNote: 'Keep the movement gentle and relaxed.',
      target: 'Shoulders',
      alternative: 'Shoulder rolls',
    },
    {
      name: 'Step Jacks',
      duration: '60 seconds',
      instructions: 'Step one foot out at a time while raising your arms, then return to center.',
      safetyNote: 'Use this low-impact version if jumping feels uncomfortable.',
      target: 'Cardio',
      alternative: 'March in place',
    },
    {
      name: 'Chair Squats',
      duration: '60 seconds',
      instructions: 'Lower toward a chair, keep your chest lifted, and push through your heels.',
      safetyNote: 'Stop above any painful range of motion.',
      target: 'Legs',
      alternative: 'Half squats',
    },
    {
      name: 'Wall Push-ups',
      duration: '60 seconds',
      instructions: 'Place hands on a wall, keep a straight line, and bend your elbows slowly.',
      safetyNote: 'Step closer to the wall to make it easier.',
      target: 'Upper body',
      alternative: 'Incline push-ups',
    },
    {
      name: 'Calm Breathing',
      duration: '75 seconds',
      instructions: 'Breathe in through your nose for four counts and out slowly for six counts.',
      safetyNote: 'Return to normal breathing if you feel lightheaded.',
      target: 'Recovery',
      alternative: 'Gentle neck stretches',
    },
  ],
};

export const pathUnits: PathUnit[] = [
  {
    title: 'Unit 1: Start Moving',
    summary: 'Tiny wins that make the habit easy to repeat.',
    lessons: [
      {
        id: 'show-up',
        title: 'Show Up Session',
        type: 'Workout',
        durationMinutes: 1,
        xpReward: 10,
        difficulty: 'Easy',
        state: 'current',
      },
      {
        id: 'cardio-boost',
        title: 'Beginner Cardio Boost',
        type: 'Daily mission',
        durationMinutes: 5,
        xpReward: 20,
        difficulty: 'Beginner',
        state: 'locked',
      },
      {
        id: 'mobility-reset',
        title: 'Basic Mobility Reset',
        type: 'Mobility',
        durationMinutes: 5,
        xpReward: 20,
        difficulty: 'Beginner',
        state: 'locked',
      },
    ],
  },
  {
    title: 'Unit 2: Build Control',
    summary: 'Core, balance, and smooth technique.',
    lessons: [
      {
        id: 'core-basics',
        title: 'Core Basics',
        type: 'Strength',
        durationMinutes: 7,
        xpReward: 25,
        difficulty: 'Beginner',
        state: 'locked',
      },
      {
        id: 'balance-line',
        title: 'Balance Line',
        type: 'Balance',
        durationMinutes: 4,
        xpReward: 15,
        difficulty: 'Easy',
        state: 'locked',
      },
    ],
  },
];

export const practiceCategories: PracticeCategory[] = [
  { title: 'Quick Cardio', focus: 'Energy', duration: '3 min', xp: 10, level: 'Easy' },
  { title: 'Quick Strength', focus: 'Legs + upper body', duration: '5 min', xp: 15, level: 'Beginner' },
  { title: 'Stretching', focus: 'Mobility', duration: '4 min', xp: 10, level: 'Easy' },
  { title: 'Core Basics', focus: 'Stability', duration: '6 min', xp: 15, level: 'Beginner' },
  { title: 'Recovery Reset', focus: 'Breathing + stretch', duration: '2 min', xp: 8, level: 'Gentle' },
  { title: 'Sport Footwork', focus: 'Coordination', duration: '5 min', xp: 15, level: 'Beginner' },
];

export const achievements = [
  'First Workout Completed',
  '3-Day Streak',
  '7-Day Streak',
  'Cardio Starter',
  'No Equipment Hero',
  'Weekend Warrior',
];

export const weeklyActivity = [
  { day: 'M', done: true },
  { day: 'T', done: true },
  { day: 'W', done: false },
  { day: 'T', done: true },
  { day: 'F', done: false },
  { day: 'S', done: false },
  { day: 'S', done: false },
];
