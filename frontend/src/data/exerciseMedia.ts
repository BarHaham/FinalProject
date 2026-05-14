import { Exercise } from './sportLingoData';

type ExerciseMedia = {
  mediaType: 'gif';
  mediaUrl: string;
  source: 'ExerciseDB' | 'Pixabay';
  sourceExerciseName: string;
  credit: string;
};

export const exerciseMedia: Record<string, ExerciseMedia> = {
  'Standing Hip Openers': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/J9zIWig.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'walking high knees lunge',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Glute Bridge': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/u0cNiij.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'low glute bridge on floor',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Reverse Lunge': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/IZVHb27.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'walking lunge',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Forearm Plank': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/VBAWRPG.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'weighted front plank',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Calf Raise': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/0jp9Rlz.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'one leg floor calf raise',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Incline Push-up': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/1YB40kg.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'incline close-grip push-up',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Chair Triceps Dip': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/05Cf2v8.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'impossible dips',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
  'Child Pose Reach': {
    mediaType: 'gif',
    mediaUrl: 'https://static.exercisedb.dev/media/01qpYSe.gif',
    source: 'ExerciseDB',
    sourceExerciseName: 'upward facing dog',
    credit: 'Demo GIF provided by ExerciseDB / AscendAPI free tier.',
  },
};

export const enrichExercisesWithMedia = (exercises: Exercise[]) => (
  exercises.map((exercise) => {
    const media = exerciseMedia[exercise.name];
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
