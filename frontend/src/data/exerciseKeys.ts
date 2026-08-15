import { exerciseLibrary } from './exerciseLibrary';

// Map both English and Hebrew display names back to the stable exercise id so
// legacy mission snapshots (stored before ids existed) still resolve media/demos.
const nameToId: Record<string, string> = {};
exerciseLibrary.forEach((entry) => {
  nameToId[entry.en.name] = entry.id;
  nameToId[entry.he.name] = entry.id;
});

export const exerciseNameToId = nameToId;

export const getExerciseKey = (exercise: { exerciseId?: string; name: string }): string =>
  exercise.exerciseId || nameToId[exercise.name] || exercise.name;
