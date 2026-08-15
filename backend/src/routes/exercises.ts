import express from 'express';
import { exerciseLibrary, resolveExercise, ExerciseLanguage } from '../data/exerciseLibrary';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Full exercise catalog resolved to the requested language.
router.get('/', (req, res) => {
  const lang: ExerciseLanguage = req.query.lang === 'he' ? 'he' : 'en';
  const exercises = exerciseLibrary.map((entry) => ({
    ...resolveExercise(entry.id, lang),
    category: entry.category,
    difficulty: entry.difficulty,
    equipment: entry.equipment,
  }));
  res.json(exercises);
});

export default router;
