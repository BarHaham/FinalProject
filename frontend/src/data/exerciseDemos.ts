export type ExerciseDemo = {
  labels: [string, string, string];
  cues: [string, string, string];
  focus: string;
};

export const exerciseDemos: Record<string, ExerciseDemo> = {
  'Chair Squat': {
    labels: ['Stand', 'Sit back', 'Drive up'],
    cues: ['Chest tall', 'Hips back', 'Press heels'],
    focus: 'Legs + glutes',
  },
  'Glute Bridge': {
    labels: ['Set', 'Lift', 'Squeeze'],
    cues: ['Feet flat', 'Hips rise', 'Glutes tight'],
    focus: 'Glutes',
  },
  'Reverse Lunge': {
    labels: ['Stand', 'Step back', 'Return'],
    cues: ['Tall torso', 'Back knee down', 'Front heel drives'],
    focus: 'Legs',
  },
  'Calf Raise': {
    labels: ['Stand', 'Rise', 'Lower'],
    cues: ['Use balance', 'Up on toes', 'Control down'],
    focus: 'Calves',
  },
  'Wall Sit': {
    labels: ['Lean', 'Slide', 'Hold'],
    cues: ['Back on wall', 'Knees comfy', 'Breathe'],
    focus: 'Leg endurance',
  },
  'Dead Bug': {
    labels: ['Brace', 'Reach', 'Switch'],
    cues: ['Back flat', 'Opposite arm/leg', 'Slow return'],
    focus: 'Core control',
  },
  'Forearm Plank': {
    labels: ['Elbows', 'Step back', 'Hold'],
    cues: ['Under shoulders', 'Long body', 'Brace core'],
    focus: 'Abs',
  },
  'Bird Dog': {
    labels: ['All fours', 'Reach', 'Switch'],
    cues: ['Hips level', 'Opposite limbs', 'Slow control'],
    focus: 'Core stability',
  },
  'Crunch Reach': {
    labels: ['Set', 'Curl', 'Lower'],
    cues: ['Knees bent', 'Reach forward', 'Neck relaxed'],
    focus: 'Upper abs',
  },
  'Side Plank': {
    labels: ['Stack', 'Lift', 'Hold'],
    cues: ['Elbow under shoulder', 'Hips up', 'Long line'],
    focus: 'Side abs',
  },
  'Wall Push-up': {
    labels: ['Set hands', 'Bend', 'Press'],
    cues: ['Body straight', 'Elbows back', 'Push away'],
    focus: 'Chest + arms',
  },
  'Incline Push-up': {
    labels: ['Plank', 'Lower', 'Press'],
    cues: ['Hands stable', 'Body moves together', 'Strong finish'],
    focus: 'Upper body',
  },
  'Chair Triceps Dip': {
    labels: ['Set', 'Dip', 'Press'],
    cues: ['Chair stable', 'Small bend', 'Shoulders down'],
    focus: 'Arms',
  },
  'High Plank Shoulder Tap': {
    labels: ['Plank', 'Tap', 'Switch'],
    cues: ['Hands under shoulders', 'Tap opposite side', 'Hips steady'],
    focus: 'Arms + core',
  },
  'Cat-Cow': {
    labels: ['Neutral', 'Round', 'Open'],
    cues: ['Hands and knees', 'Round back', 'Lift chest'],
    focus: 'Spine mobility',
  },
  'Child Pose Reach': {
    labels: ['Sit back', 'Reach', 'Side reach'],
    cues: ['Hips to heels', 'Arms long', 'Walk hands over'],
    focus: 'Back + shoulders',
  },
  'Hamstring Sweep': {
    labels: ['Heel out', 'Hinge', 'Sweep'],
    cues: ['Toe up', 'Soft knee', 'Hands forward'],
    focus: 'Hamstrings',
  },
  'Standing Quad Stretch': {
    labels: ['Balance', 'Hold ankle', 'Tall hold'],
    cues: ['Use wall', 'Knees close', 'Glute gentle'],
    focus: 'Front thighs',
  },
};

export const getExerciseDemo = (name: string) => exerciseDemos[name];
