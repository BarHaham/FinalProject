import { exerciseNameToId } from './exerciseKeys';

export type ExerciseDemo = {
  labels: [string, string, string];
  cues: [string, string, string];
  focus: string;
};

// Keyed by the stable exercise id from the shared exercise library.
export const exerciseDemos: Record<string, ExerciseDemo> = {
  'chair-squat': {
    labels: ['Stand', 'Sit back', 'Drive up'],
    cues: ['Chest tall', 'Hips back', 'Press heels'],
    focus: 'Legs + glutes',
  },
  'glute-bridge': {
    labels: ['Set', 'Lift', 'Squeeze'],
    cues: ['Feet flat', 'Hips rise', 'Glutes tight'],
    focus: 'Glutes',
  },
  'reverse-lunge': {
    labels: ['Stand', 'Step back', 'Return'],
    cues: ['Tall torso', 'Back knee down', 'Front heel drives'],
    focus: 'Legs',
  },
  'calf-raise': {
    labels: ['Stand', 'Rise', 'Lower'],
    cues: ['Use balance', 'Up on toes', 'Control down'],
    focus: 'Calves',
  },
  'wall-sit': {
    labels: ['Lean', 'Slide', 'Hold'],
    cues: ['Back on wall', 'Knees comfy', 'Breathe'],
    focus: 'Leg endurance',
  },
  'dead-bug': {
    labels: ['Brace', 'Reach', 'Switch'],
    cues: ['Back flat', 'Opposite arm/leg', 'Slow return'],
    focus: 'Core control',
  },
  'forearm-plank': {
    labels: ['Elbows', 'Step back', 'Hold'],
    cues: ['Under shoulders', 'Long body', 'Brace core'],
    focus: 'Abs',
  },
  'bird-dog': {
    labels: ['All fours', 'Reach', 'Switch'],
    cues: ['Hips level', 'Opposite limbs', 'Slow control'],
    focus: 'Core stability',
  },
  'crunch-reach': {
    labels: ['Set', 'Curl', 'Lower'],
    cues: ['Knees bent', 'Reach forward', 'Neck relaxed'],
    focus: 'Upper abs',
  },
  'side-plank': {
    labels: ['Stack', 'Lift', 'Hold'],
    cues: ['Elbow under shoulder', 'Hips up', 'Long line'],
    focus: 'Side abs',
  },
  'wall-pushup': {
    labels: ['Set hands', 'Bend', 'Press'],
    cues: ['Body straight', 'Elbows back', 'Push away'],
    focus: 'Chest + arms',
  },
  'incline-pushup': {
    labels: ['Plank', 'Lower', 'Press'],
    cues: ['Hands stable', 'Body moves together', 'Strong finish'],
    focus: 'Upper body',
  },
  'chair-triceps-dip': {
    labels: ['Set', 'Dip', 'Press'],
    cues: ['Chair stable', 'Small bend', 'Shoulders down'],
    focus: 'Arms',
  },
  'high-plank-shoulder-tap': {
    labels: ['Plank', 'Tap', 'Switch'],
    cues: ['Hands under shoulders', 'Tap opposite side', 'Hips steady'],
    focus: 'Arms + core',
  },
  'cat-cow': {
    labels: ['Neutral', 'Round', 'Open'],
    cues: ['Hands and knees', 'Round back', 'Lift chest'],
    focus: 'Spine mobility',
  },
  'child-pose-reach': {
    labels: ['Sit back', 'Reach', 'Side reach'],
    cues: ['Hips to heels', 'Arms long', 'Walk hands over'],
    focus: 'Back + shoulders',
  },
  'hamstring-sweep': {
    labels: ['Heel out', 'Hinge', 'Sweep'],
    cues: ['Toe up', 'Soft knee', 'Hands forward'],
    focus: 'Hamstrings',
  },
  'standing-quad-stretch': {
    labels: ['Balance', 'Hold ankle', 'Tall hold'],
    cues: ['Use wall', 'Knees close', 'Glute gentle'],
    focus: 'Front thighs',
  },
  // Generic three-step demos for the expanded library, grouped by movement family.
  'bodyweight-squat': {
    labels: ['Stand', 'Sit down', 'Drive up'],
    cues: ['Feet shoulder-width', 'Hips back and down', 'Press heels'],
    focus: 'Legs + glutes',
  },
  'pushup': {
    labels: ['Plank', 'Lower', 'Press'],
    cues: ['Tight body line', 'Chest near floor', 'Push the floor away'],
    focus: 'Chest + arms',
  },
  'knee-pushup': {
    labels: ['Knees down', 'Lower', 'Press'],
    cues: ['Straight hip line', 'Elbows 45 degrees', 'Smooth push'],
    focus: 'Chest + arms',
  },
  'mountain-climbers': {
    labels: ['Plank', 'Drive knee', 'Switch'],
    cues: ['Hips level', 'Knee to chest', 'Quick light feet'],
    focus: 'Cardio + core',
  },
  'high-knees': {
    labels: ['Stand tall', 'Drive up', 'Quick switch'],
    cues: ['Knees to hip height', 'Pump the arms', 'Light landings'],
    focus: 'Cardio',
  },
  'burpees': {
    labels: ['Squat down', 'Plank back', 'Jump up'],
    cues: ['Hands to floor', 'Solid plank', 'Reach tall'],
    focus: 'Full body',
  },
};

export const getExerciseDemo = (key: string) =>
  exerciseDemos[key] || exerciseDemos[exerciseNameToId[key]];
