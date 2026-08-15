import { exerciseLibrary } from './exerciseLibrary';
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
  // ---- warmup ----
  'jumping-jacks': {
    labels: ['Stand', 'Jump wide', 'Snap back'],
    cues: ['Arms by sides', 'Arms overhead', 'Soft landing'],
    focus: 'Warm-up',
  },
  'arm-circles': {
    labels: ['Reach out', 'Small circles', 'Reverse'],
    cues: ['Shoulder height', 'Grow the circles', 'Switch direction'],
    focus: 'Shoulders',
  },
  'standing-hip-openers': {
    labels: ['Lift knee', 'Open out', 'Return'],
    cues: ['To hip height', 'Rotate outward', 'Slow and tall'],
    focus: 'Hips',
  },
  'march-in-place': {
    labels: ['Stand tall', 'Lift knee', 'Swing arms'],
    cues: ['Chest up', 'To hip height', 'Natural rhythm'],
    focus: 'Warm-up',
  },
  'torso-twists': {
    labels: ['Arms up', 'Twist right', 'Twist left'],
    cues: ['Elbows bent', 'Ribs rotate', 'Hips stay forward'],
    focus: 'Spine + core',
  },
  'leg-swings': {
    labels: ['Hold wall', 'Swing forward', 'Swing back'],
    cues: ['Stand tall', 'Smooth arc', 'Grow the range'],
    focus: 'Hips',
  },
  'high-knee-march': {
    labels: ['March', 'Knee high', 'Switch'],
    cues: ['Tall posture', 'Above hip height', 'Controlled tempo'],
    focus: 'Warm-up',
  },
  'shoulder-rolls': {
    labels: ['Lift', 'Roll back', 'Drop'],
    cues: ['Shoulders to ears', 'Big slow circle', 'Relax down'],
    focus: 'Shoulders',
  },
  'ankle-circles': {
    labels: ['Lift foot', 'Circle toes', 'Reverse'],
    cues: ['Balance tall', 'Slow and smooth', 'Switch direction'],
    focus: 'Ankles',
  },
  'inchworm-walkout': {
    labels: ['Hinge down', 'Walk out', 'Walk back'],
    cues: ['Hands to floor', 'To high plank', 'Legs stay long'],
    focus: 'Full-body warm-up',
  },
  'butt-kicks': {
    labels: ['Jog', 'Heel to glute', 'Quick switch'],
    cues: ['Light feet', 'Kick behind', 'Relaxed rhythm'],
    focus: 'Warm-up',
  },
  'worlds-greatest-stretch': {
    labels: ['Long lunge', 'Hands inside', 'Rotate up'],
    cues: ['Big step forward', 'Both hands down', 'Open the chest'],
    focus: 'Hips + spine',
  },

  // ---- legs & glutes ----
  'sumo-squat': {
    labels: ['Wide stance', 'Sit down', 'Press up'],
    cues: ['Toes out', 'Knees track out', 'Squeeze glutes'],
    focus: 'Glutes + inner thighs',
  },
  'forward-lunge': {
    labels: ['Step forward', 'Lower', 'Push back'],
    cues: ['Long step', 'Back knee down', 'Front heel drives'],
    focus: 'Legs',
  },
  'side-lunge': {
    labels: ['Step wide', 'Sit to side', 'Push center'],
    cues: ['One leg straight', 'Hips back', 'Heels down'],
    focus: 'Inner thighs',
  },
  'single-leg-glute-bridge': {
    labels: ['Bridge up', 'Extend leg', 'Lift + lower'],
    cues: ['Feet flat first', 'One leg long', 'Hips stay level'],
    focus: 'Glutes',
  },
  'bulgarian-split-squat': {
    labels: ['Foot on chair', 'Lower down', 'Drive up'],
    cues: ['Back foot rested', 'Knee drops straight', 'Front heel pushes'],
    focus: 'Legs + glutes',
  },
  'jump-squat': {
    labels: ['Squat', 'Explode up', 'Land soft'],
    cues: ['Load the legs', 'Jump tall', 'Quiet bent knees'],
    focus: 'Leg power',
  },
  'curtsy-lunge': {
    labels: ['Stand', 'Cross behind', 'Return'],
    cues: ['Hips forward', 'Diagonal step back', 'Push to center'],
    focus: 'Glutes',
  },
  'goblet-squat': {
    labels: ['Hug weight', 'Squat', 'Stand'],
    cues: ['Dumbbell at chest', 'Elbows inside knees', 'Chest stays tall'],
    focus: 'Legs + glutes',
  },
  'dumbbell-romanian-deadlift': {
    labels: ['Weights front', 'Hinge', 'Squeeze up'],
    cues: ['Flat back', 'Slide down thighs', 'Glutes finish'],
    focus: 'Hamstrings',
  },
  'banded-lateral-walk': {
    labels: ['Band on', 'Quarter squat', 'Step wide'],
    cues: ['Above knees', 'Stay low', 'Keep band tight'],
    focus: 'Glutes + hips',
  },

  // ---- core ----
  'bicycle-crunch': {
    labels: ['Lie back', 'Elbow to knee', 'Pedal switch'],
    cues: ['Hands by head', 'Rotate from ribs', 'Slow and smooth'],
    focus: 'Abs + obliques',
  },
  'russian-twist': {
    labels: ['Sit + lean', 'Twist right', 'Twist left'],
    cues: ['Spine tall', 'Chest stays up', 'Shoulders rotate'],
    focus: 'Obliques',
  },
  'leg-raises': {
    labels: ['Legs up', 'Lower slow', 'Stop + lift'],
    cues: ['To the ceiling', 'Back stays down', 'No arching'],
    focus: 'Lower abs',
  },
  'flutter-kicks': {
    labels: ['Legs hover', 'Small kicks', 'Keep pulsing'],
    cues: ['Lift slightly', 'Quick and small', 'Back heavy on floor'],
    focus: 'Lower abs',
  },
  'plank-up-down': {
    labels: ['Forearm plank', 'Press up', 'Lower down'],
    cues: ['Strong base', 'One arm at a time', 'Hips barely move'],
    focus: 'Core + arms',
  },
  'hollow-body-hold': {
    labels: ['Lie flat', 'Press back down', 'Lift + hold'],
    cues: ['Arms and legs long', 'Lower back glued', 'Breathe steady'],
    focus: 'Deep core',
  },
  'reverse-crunch': {
    labels: ['Knees bent', 'Curl to chest', 'Lower slow'],
    cues: ['Hands by sides', 'Hips lift slightly', 'No momentum'],
    focus: 'Lower abs',
  },
  'standing-knee-to-elbow': {
    labels: ['Stand tall', 'Knee up', 'Elbow meets'],
    cues: ['Hands by head', 'Opposite sides', 'Exhale at the top'],
    focus: 'Abs standing',
  },
  'high-plank-hold': {
    labels: ['Hands down', 'Step back', 'Hold line'],
    cues: ['Under shoulders', 'Body one line', 'Push floor away'],
    focus: 'Abs + shoulders',
  },
  'side-plank-hip-dip': {
    labels: ['Side plank', 'Dip hip', 'Lift back'],
    cues: ['Elbow under shoulder', 'Toward the floor', 'Small and controlled'],
    focus: 'Obliques',
  },
  'v-up': {
    labels: ['Lie long', 'Fold up', 'Lower slow'],
    cues: ['Arms overhead', 'Hands meet feet', 'Control down'],
    focus: 'Full abs',
  },

  // ---- upper body ----
  'pike-pushup': {
    labels: ['Hips high', 'Head down', 'Press up'],
    cues: ['Downward-dog shape', 'Between the hands', 'Shoulders push'],
    focus: 'Shoulders',
  },
  'diamond-pushup': {
    labels: ['Diamond hands', 'Lower', 'Press'],
    cues: ['Under the chest', 'Elbows brush ribs', 'Strong lockout'],
    focus: 'Triceps',
  },
  'superman-hold': {
    labels: ['Lie face down', 'Lift + reach', 'Hold'],
    cues: ['Arms and legs long', 'Gentle arch', 'Reach, not height'],
    focus: 'Back strength',
  },
  'prone-y-t-raise': {
    labels: ['Lie face down', 'Y raise', 'T raise'],
    cues: ['Thumbs up', 'Arms overhead', 'Arms out wide'],
    focus: 'Upper back',
  },
  'dumbbell-shoulder-press': {
    labels: ['Weights up', 'Press high', 'Lower slow'],
    cues: ['At shoulders', 'Arms straight', 'Ribs stay down'],
    focus: 'Shoulders',
  },
  'dumbbell-row': {
    labels: ['Hinge', 'Pull to hip', 'Lower'],
    cues: ['Flat back', 'Elbow leads', 'Squeeze the blade'],
    focus: 'Back',
  },
  'dumbbell-bicep-curl': {
    labels: ['Weights down', 'Curl up', 'Lower slow'],
    cues: ['Elbows on ribs', 'To shoulders', 'No swinging'],
    focus: 'Arms',
  },
  'band-pull-apart': {
    labels: ['Band front', 'Pull apart', 'Return slow'],
    cues: ['Shoulder height', 'To the chest', 'Blades squeeze'],
    focus: 'Upper back',
  },

  // ---- cardio ----
  'skater-hops': {
    labels: ['Load', 'Leap side', 'Stick landing'],
    cues: ['Bend the knees', 'Swing arms across', 'Hold one beat'],
    focus: 'Cardio + legs',
  },
  'half-burpees': {
    labels: ['Hands down', 'Feet back', 'Stand tall'],
    cues: ['Squat first', 'Solid plank', 'No jump needed'],
    focus: 'Cardio',
  },
  'jumping-lunges': {
    labels: ['Lunge', 'Jump switch', 'Land soft'],
    cues: ['Both knees bent', 'Swap legs mid-air', 'Knee over toes'],
    focus: 'Leg power',
  },
  'fast-feet': {
    labels: ['Low stance', 'Run in place', 'Stay light'],
    cues: ['Slight squat', 'Tiny fast steps', 'Like hot sand'],
    focus: 'Agility',
  },
  'shadow-boxing': {
    labels: ['Guard up', 'Punch', 'Move feet'],
    cues: ['Boxing stance', 'Exhale each punch', 'Stay bouncy'],
    focus: 'Cardio',
  },
  'step-touch': {
    labels: ['Step wide', 'Touch together', 'Switch sides'],
    cues: ['Steady rhythm', 'Bring feet together', 'Add arm swing'],
    focus: 'Light cardio',
  },
  'jog-in-place': {
    labels: ['Start easy', 'Light steps', 'Keep rhythm'],
    cues: ['Shoulders relaxed', 'Land on forefoot', 'Smooth breathing'],
    focus: 'Light cardio',
  },
  'lateral-shuffles': {
    labels: ['Athletic stance', 'Shuffle side', 'Touch + back'],
    cues: ['Stay low', 'Feet never cross', 'Quick steps'],
    focus: 'Agility',
  },
  'sprint-intervals': {
    labels: ['Warm up', 'Sprint', 'Walk back'],
    cues: ['Build speed first', 'Drive the arms', 'Recover fully'],
    focus: 'Cardio power',
  },

  // ---- full body ----
  'squat-to-press': {
    labels: ['Weights racked', 'Squat', 'Stand + press'],
    cues: ['At shoulders', 'Hips back', 'Legs power the press'],
    focus: 'Full body',
  },
  'squat-reach': {
    labels: ['Squat low', 'Touch down', 'Reach high'],
    cues: ['Hips back', 'Hands to floor', 'Grow tall'],
    focus: 'Full body',
  },
  'bear-crawl': {
    labels: ['All fours', 'Knees hover', 'Crawl'],
    cues: ['Hands + feet', 'Back flat', 'Opposite limbs move'],
    focus: 'Full body',
  },
  'plank-to-squat': {
    labels: ['High plank', 'Hop feet in', 'Deep squat'],
    cues: ['Strong line', 'Outside the hands', 'Chest lifts'],
    focus: 'Full body',
  },
  'lunge-with-twist': {
    labels: ['Lunge forward', 'Rotate', 'Return'],
    cues: ['Stable base', 'Over the front leg', 'Switch sides'],
    focus: 'Legs + core',
  },
  'squat-thrust': {
    labels: ['Hands down', 'Kick back', 'Snap in + stand'],
    cues: ['Fast to floor', 'Crisp plank', 'Hips never sag'],
    focus: 'Full-body power',
  },
  'inchworm-pushup': {
    labels: ['Walk out', 'Push-up', 'Walk back'],
    cues: ['Hands to plank', 'One strong rep', 'Finish tall'],
    focus: 'Full body',
  },
  'good-morning-reach': {
    labels: ['Hands on head', 'Hinge', 'Stand + reach'],
    cues: ['Elbows wide', 'Flat back, hips back', 'Arms to the sky'],
    focus: 'Posterior chain',
  },
  'star-jumps': {
    labels: ['Small squat', 'Star jump', 'Land compact'],
    cues: ['Load down', 'Arms + legs wide', 'Quiet landing'],
    focus: 'Full-body power',
  },
  'crab-toe-touch': {
    labels: ['Crab position', 'Kick + touch', 'Switch'],
    cues: ['Hips lifted', 'Hand to opposite toes', 'Keep hips high'],
    focus: 'Core + mobility',
  },

  // ---- mobility ----
  'hip-flexor-stretch': {
    labels: ['Half kneel', 'Tuck tail', 'Shift forward'],
    cues: ['One knee down', 'Tailbone under', 'Feel the hip front'],
    focus: 'Hip flexors',
  },
  'figure-four-stretch': {
    labels: ['Lie back', 'Cross ankle', 'Pull thigh'],
    cues: ['Knees bent', 'Over opposite knee', 'Gentle pull in'],
    focus: 'Glutes + hips',
  },
  'thread-the-needle': {
    labels: ['All fours', 'Slide arm under', 'Unwind'],
    cues: ['Hips high', 'Shoulder to floor', 'Follow with eyes'],
    focus: 'Upper back',
  },
  'seated-spinal-twist': {
    labels: ['Sit tall', 'Hand behind', 'Rotate'],
    cues: ['Long spine', 'Light support', 'Deeper each exhale'],
    focus: 'Spine',
  },
  'downward-dog': {
    labels: ['Plank', 'Hips up + back', 'Heels down'],
    cues: ['Start strong', 'Inverted V', 'Bend knees freely'],
    focus: 'Back of body',
  },
  'cobra-stretch': {
    labels: ['Lie face down', 'Hands set', 'Chest up'],
    cues: ['Legs relaxed', 'Under shoulders', 'Hips stay down'],
    focus: 'Front body',
  },
  'butterfly-stretch': {
    labels: ['Soles together', 'Hold ankles', 'Knees sink'],
    cues: ['Sit tall', 'Gentle grip', 'Let gravity work'],
    focus: 'Inner thighs',
  },
  'neck-side-stretch': {
    labels: ['Sit tall', 'Ear to shoulder', 'Breathe + hold'],
    cues: ['Shoulders heavy', 'Tilt gently', 'Never pull'],
    focus: 'Neck',
  },

  // ---- balance ----
  'single-leg-stand': {
    labels: ['Stand tall', 'Lift one foot', 'Hold steady'],
    cues: ['Fix your gaze', 'Hips level', 'Grip the floor'],
    focus: 'Balance',
  },
  'heel-to-toe-walk': {
    labels: ['Line up', 'Heel to toe', 'Slow steps'],
    cues: ['Straight line', 'Feet touching', 'Arms out if needed'],
    focus: 'Balance + gait',
  },
  'single-leg-reach': {
    labels: ['One leg', 'Hinge + reach', 'Stand tall'],
    cues: ['Balance first', 'Hands toward floor', 'Flat back'],
    focus: 'Balance',
  },
  'tree-pose': {
    labels: ['Foot to leg', 'Palms together', 'Hold'],
    cues: ['Calf or thigh', 'Press foot + leg', 'Never on the knee'],
    focus: 'Balance',
  },
  'single-leg-deadlift': {
    labels: ['One leg', 'Hinge long', 'Return'],
    cues: ['Soft knee', 'Body forms a T', 'Hips stay square'],
    focus: 'Balance + hamstrings',
  },
  'side-leg-raise': {
    labels: ['Stand tall', 'Leg out side', 'Lower slow'],
    cues: ['Torso vertical', 'Straight leg', 'No leaning'],
    focus: 'Hips',
  },
  'clock-taps': {
    labels: ['Balance', 'Tap the clock', 'Return center'],
    cues: ['One leg planted', "12, 3, 6 o'clock", 'Reset if you wobble'],
    focus: 'Dynamic balance',
  },
  'warrior-three': {
    labels: ['Stand tall', 'Hinge + extend', 'Hold the T'],
    cues: ['Arms reach ahead', 'Back leg long', 'One straight line'],
    focus: 'Balance + strength',
  },
};

export const getExerciseDemo = (key: string) =>
  exerciseDemos[key] || exerciseDemos[exerciseNameToId[key]];

// Coverage guarantee: every exercise in the shared library must have a demo
// entry. Warns in development so a new exercise can't silently ship without
// a visual demonstration.
if (process.env.NODE_ENV !== 'production') {
  const missing = exerciseLibrary.filter((entry) => !exerciseDemos[entry.id]).map((entry) => entry.id);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[exerciseDemos] Missing demo entries for: ${missing.join(', ')}`);
  }
}
