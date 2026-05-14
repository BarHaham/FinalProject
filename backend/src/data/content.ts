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

const exercise = (
  name: string,
  duration: string,
  instructions: string,
  target: string,
  alternative: string,
  instructorCue: string,
  musclesWorked: string[],
  safetyNote = 'Move with control and keep the range pain-free.'
): Exercise => ({
  name,
  duration,
  instructions,
  safetyNote,
  target,
  alternative,
  mediaType: 'none',
  mediaUrl: '',
  instructorCue,
  musclesWorked,
});

const warmup = {
  march: exercise(
    'Jumping Jacks',
    '45 seconds',
    'Jump your feet out while raising your arms overhead, then return to center with soft landings.',
    'Warm-up',
    'Step jacks',
    'Show upbeat full-body movement with arms overhead and controlled landings.',
    ['Shoulders', 'Hips', 'Calves', 'Core'],
    'Keep your knees soft and switch to step jacks if jumping feels uncomfortable.'
  ),
  armCircles: exercise(
    'Arm Circles',
    '40 seconds',
    'Reach your arms out and draw small circles, then switch direction halfway.',
    'Shoulders',
    'Shoulder rolls',
    'Keep the ribs down and neck relaxed while the arms move.',
    ['Shoulders', 'Upper back']
  ),
  hipOpeners: exercise(
    'Standing Hip Openers',
    '45 seconds',
    'Lift one knee, rotate it gently outward, return to center, and switch sides.',
    'Hips',
    'Small knee lifts',
    'Move slowly and avoid leaning backward.',
    ['Hips', 'Glutes', 'Core']
  ),
};

const legsGlutes = {
  chairSquat: exercise(
    'Chair Squat',
    '8 reps',
    'Sit your hips back toward a chair, keep your chest lifted, then stand by pressing through your heels.',
    'Legs + glutes',
    'Half squat',
    'Show knees tracking over toes and hips moving back first.',
    ['Quads', 'Glutes', 'Core']
  ),
  gluteBridge: exercise(
    'Glute Bridge',
    '12 reps',
    'Lie on your back, feet flat, squeeze your glutes, and lift your hips until your body forms a straight line.',
    'Glutes',
    'Small hip lift',
    'Pause at the top without arching the lower back.',
    ['Glutes', 'Hamstrings', 'Core']
  ),
  reverseLunge: exercise(
    'Reverse Lunge',
    '6 reps each side',
    'Step one foot back, bend both knees, then push through the front heel to return.',
    'Legs',
    'Supported split squat',
    'Keep the front knee stable and the torso tall.',
    ['Quads', 'Glutes', 'Hamstrings']
  ),
  calfRaise: exercise(
    'Calf Raise',
    '15 reps',
    'Rise onto the balls of your feet, pause briefly, then lower with control.',
    'Calves',
    'Seated calf raise',
    'Use a wall for balance and avoid bouncing.',
    ['Calves', 'Ankles']
  ),
  wallSit: exercise(
    'Wall Sit',
    '25 seconds',
    'Lean against a wall, slide down to a comfortable squat, and hold steady.',
    'Leg endurance',
    'Higher wall sit',
    'Keep the knees comfortable and breathe throughout.',
    ['Quads', 'Glutes', 'Core']
  ),
};

const core = {
  deadBug: exercise(
    'Dead Bug',
    '8 reps each side',
    'Lie on your back, brace your core, and slowly lower the opposite arm and leg.',
    'Core control',
    'Heel taps',
    'Keep the lower back gently connected to the floor.',
    ['Abs', 'Deep core']
  ),
  plank: exercise(
    'Forearm Plank',
    '20 seconds',
    'Place elbows under shoulders, step feet back, and hold a straight line from head to heels.',
    'Abs',
    'Knee plank',
    'Show a straight body line and calm breathing.',
    ['Abs', 'Shoulders', 'Glutes']
  ),
  birdDog: exercise(
    'Bird Dog',
    '8 reps each side',
    'From hands and knees, reach opposite arm and leg long, pause, then switch.',
    'Core stability',
    'Arm-only bird dog',
    'Keep hips level as the arm and leg extend.',
    ['Abs', 'Glutes', 'Back']
  ),
  crunchReach: exercise(
    'Crunch Reach',
    '10 reps',
    'Lie on your back, knees bent, reach your hands toward your knees, and lower slowly.',
    'Upper abs',
    'Small curl-up',
    'Lift from the ribs, not by pulling the neck.',
    ['Abs']
  ),
  sidePlank: exercise(
    'Side Plank',
    '15 seconds each side',
    'Stack your elbow under your shoulder and lift your hips into a straight side line.',
    'Side abs',
    'Bent-knee side plank',
    'Keep hips lifted and shoulder away from ear.',
    ['Obliques', 'Shoulders', 'Glutes']
  ),
};

const upperBody = {
  wallPushup: exercise(
    'Wall Push-up',
    '10 reps',
    'Place hands on a wall, keep your body straight, bend your elbows, then press away.',
    'Chest + arms',
    'Wall lean hold',
    'Show elbows moving back at a comfortable angle.',
    ['Chest', 'Triceps', 'Shoulders']
  ),
  inclinePushup: exercise(
    'Incline Push-up',
    '8 reps',
    'Place hands on a stable surface, keep a strong plank line, lower with control, and press up.',
    'Upper body',
    'Wall push-up',
    'Keep the body moving as one unit.',
    ['Chest', 'Triceps', 'Core']
  ),
  tricepsDip: exercise(
    'Chair Triceps Dip',
    '8 reps',
    'Hold a sturdy chair, bend your elbows slightly, then press back up.',
    'Arms',
    'Close-grip wall push-up',
    'Keep shoulders down and use a small range at first.',
    ['Triceps', 'Shoulders'],
    'Use a stable chair and stop if shoulders feel uncomfortable.'
  ),
  shoulderTap: exercise(
    'High Plank Shoulder Tap',
    '10 taps',
    'Hold a high plank and tap the opposite shoulder while keeping your hips steady.',
    'Arms + core',
    'Knee plank shoulder tap',
    'Move slowly so the hips barely shift.',
    ['Shoulders', 'Abs', 'Triceps']
  ),
};

const mobility = {
  catCow: exercise(
    'Cat-Cow',
    '45 seconds',
    'On hands and knees, round your back gently, then lift your chest and tailbone.',
    'Spine mobility',
    'Seated cat-cow',
    'Move one vertebra at a time and breathe slowly.',
    ['Back', 'Core']
  ),
  childPoseReach: exercise(
    'Child Pose Reach',
    '40 seconds',
    'Sit hips back, reach hands forward, then walk both hands to each side.',
    'Back + shoulders',
    'Seated forward reach',
    'Let the breath soften the stretch.',
    ['Lats', 'Back', 'Shoulders']
  ),
  hamstringSweep: exercise(
    'Hamstring Sweep',
    '8 reps each side',
    'Place one heel forward, hinge slightly, and sweep your hands toward your toes.',
    'Hamstrings',
    'Standing toe taps',
    'Keep the front knee soft, not locked.',
    ['Hamstrings', 'Calves']
  ),
  quadStretch: exercise(
    'Standing Quad Stretch',
    '25 seconds each side',
    'Hold one ankle behind you, bring knees close, and gently squeeze the glute.',
    'Front thighs',
    'Side-lying quad stretch',
    'Use a wall for balance and keep the knee pointing down.',
    ['Quads', 'Hip flexors']
  ),
};

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
    warmup.march,
    warmup.armCircles,
    legsGlutes.chairSquat,
    core.deadBug,
    upperBody.wallPushup,
    legsGlutes.gluteBridge,
    mobility.childPoseReach,
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
    exercises: [core.deadBug, core.crunchReach, core.plank, core.birdDog],
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
    exercises: [legsGlutes.gluteBridge, legsGlutes.chairSquat, legsGlutes.reverseLunge, legsGlutes.calfRaise],
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
    exercises: [upperBody.wallPushup, upperBody.inclinePushup, upperBody.shoulderTap, mobility.childPoseReach],
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
    exercises: [mobility.catCow, mobility.childPoseReach, mobility.hamstringSweep, mobility.quadStretch],
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
    exercises: [warmup.march, warmup.armCircles, warmup.hipOpeners],
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
    exercises: [core.deadBug, mobility.catCow, mobility.childPoseReach],
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
    exercises: [warmup.hipOpeners, legsGlutes.gluteBridge, legsGlutes.calfRaise],
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
    exercises: [warmup.march, legsGlutes.chairSquat, legsGlutes.wallSit, mobility.hamstringSweep],
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
    exercises: [legsGlutes.gluteBridge, legsGlutes.reverseLunge, legsGlutes.calfRaise, mobility.quadStretch],
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
    exercises: [core.deadBug, core.birdDog, mobility.catCow],
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
    exercises: [core.deadBug, core.plank, core.sidePlank, mobility.childPoseReach],
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
    exercises: [core.crunchReach, core.birdDog, core.plank, core.sidePlank],
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
    exercises: [warmup.armCircles, upperBody.wallPushup, mobility.childPoseReach],
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
    exercises: [upperBody.wallPushup, upperBody.inclinePushup, upperBody.tricepsDip, mobility.childPoseReach],
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
    exercises: [upperBody.inclinePushup, upperBody.shoulderTap, core.plank, core.deadBug],
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
    exercises: [mobility.catCow, mobility.childPoseReach, warmup.hipOpeners],
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
    exercises: [mobility.hamstringSweep, mobility.quadStretch, legsGlutes.calfRaise],
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
    exercises: [legsGlutes.chairSquat, legsGlutes.gluteBridge, core.plank, upperBody.wallPushup, mobility.childPoseReach],
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
