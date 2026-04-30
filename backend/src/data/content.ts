export type Exercise = {
  name: string;
  duration: string;
  instructions: string;
  safetyNote: string;
  target: string;
  alternative: string;
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

export const beginnerDailyMission: MissionTemplate = {
  title: 'Beginner Cardio Boost',
  description: 'A friendly five-minute session for cardio, legs, and showing up today.',
  durationMinutes: 5,
  difficultyLevel: 'Beginner',
  focusArea: 'Cardio + legs',
  xpReward: 20,
  missionType: 'Daily mission',
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

export const practiceSessions: MissionTemplate[] = [
  {
    ...beginnerDailyMission,
    title: 'Quick Cardio',
    description: 'A three-minute energy boost with low-impact movement.',
    durationMinutes: 3,
    focusArea: 'Energy',
    xpReward: 10,
    missionType: 'Practice',
  },
  {
    ...beginnerDailyMission,
    title: 'Recovery Reset',
    description: 'Gentle breathing and stretching for a lighter day.',
    durationMinutes: 2,
    focusArea: 'Recovery',
    xpReward: 8,
    missionType: 'Practice',
  },
  {
    ...beginnerDailyMission,
    title: 'Core Basics',
    description: 'Short beginner core practice focused on control.',
    durationMinutes: 6,
    focusArea: 'Core',
    xpReward: 15,
    missionType: 'Practice',
  },
];

export const pathLessonSeeds: PathLessonSeed[] = [
  {
    lessonName: 'Show Up Session',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Workout',
    xpReward: 10,
    estimatedDurationMinutes: 1,
    difficulty: 'Easy',
    exercises: [beginnerDailyMission.exercises[0]],
  },
  {
    lessonName: 'Beginner Cardio Boost',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 2,
    lessonType: 'Daily mission',
    xpReward: 20,
    estimatedDurationMinutes: 5,
    difficulty: 'Beginner',
    exercises: beginnerDailyMission.exercises,
  },
  {
    lessonName: 'Basic Mobility Reset',
    sectionNumber: 1,
    unitNumber: 1,
    lessonNumber: 3,
    lessonType: 'Mobility',
    xpReward: 20,
    estimatedDurationMinutes: 5,
    difficulty: 'Beginner',
    exercises: [beginnerDailyMission.exercises[0], beginnerDailyMission.exercises[4]],
  },
  {
    lessonName: 'Core Basics',
    sectionNumber: 2,
    unitNumber: 1,
    lessonNumber: 1,
    lessonType: 'Strength',
    xpReward: 25,
    estimatedDurationMinutes: 7,
    difficulty: 'Beginner',
    exercises: beginnerDailyMission.exercises,
  },
];

export const achievementCatalog = [
  { name: 'First Workout Completed', type: 'milestone' },
  { name: '3-Day Streak', type: 'streak' },
  { name: '7-Day Streak', type: 'streak' },
  { name: 'Cardio Starter', type: 'focus' },
  { name: 'No Equipment Hero', type: 'equipment' },
  { name: '100 XP Earned', type: 'xp' },
];
