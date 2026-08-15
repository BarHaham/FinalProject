import { Exercise } from './sportLingoData';
import { getExerciseKey } from './exerciseKeys';

type ExerciseMedia = {
  mediaType: 'gif';
  mediaUrl: string;
  source: 'ExerciseDB' | 'Pixabay';
  sourceExerciseName: string;
  credit: string;
};

// Keyed by the stable exercise id from the shared exercise library, so media
// works for AI-generated (including Hebrew) content and legacy snapshots alike.
export const exerciseMedia: Record<string, ExerciseMedia> = {
  'standing-hip-openers': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/J9zIWig.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'walking high knees lunge',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'glute-bridge': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/u0cNiij.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'low glute bridge on floor',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'reverse-lunge': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/IZVHb27.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'walking lunge',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'forearm-plank': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/VBAWRPG.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'weighted front plank',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'calf-raise': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/0jp9Rlz.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'one leg floor calf raise',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'incline-pushup': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/1YB40kg.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'incline close-grip push-up',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'chair-triceps-dip': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/05Cf2v8.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'impossible dips',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'child-pose-reach': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/01qpYSe.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'upward facing dog',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
};

export const enrichExercisesWithMedia = (exercises: Exercise[]) => (
  exercises.map((exercise) => {
    const media = exerciseMedia[getExerciseKey(exercise)];
    if (!media) return exercise;

    return {
      ...exercise,
      mediaType: media.mediaType,
      mediaUrl: media.mediaUrl,
      mediaCredit: media.credit,
      instructorCue: `${exercise.instructorCue || exercise.instructions} Demo source: ${media.sourceExerciseName} (${media.source}).`,
    };
  })
);
