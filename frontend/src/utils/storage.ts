export type StoredUser = {
  id: number;
  name: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  current_activity_level?: string;
  fitness_level?: string;
  main_goal?: string;
  preferred_workout_duration?: number;
  equipment?: string[];
  preferred_sports?: string[];
  motivation_reason?: string;
};

export type OnboardingProfile = {
  mainGoal: string;
  secondaryGoals: string[];
  dailyTimeGoal: number;
  fitnessLevel: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
  activityLevel: string;
  equipment: string[];
  sports: string[];
  motivationReason: string;
  reminderTime: string;
};

export const defaultOnboardingProfile: OnboardingProfile = {
  mainGoal: 'Build a daily sports habit',
  secondaryGoals: [],
  dailyTimeGoal: 5,
  fitnessLevel: 'Beginner',
  age: '',
  height: '',
  weight: '',
  gender: 'Prefer not to say',
  activityLevel: 'Light activity',
  equipment: ['No equipment'],
  sports: ['General fitness', 'Mobility and stretching'],
  motivationReason: 'I want to create discipline',
  reminderTime: 'Evening',
};

export const getStoredUser = (): StoredUser | null => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as StoredUser;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const getOnboardingProfile = (): OnboardingProfile => {
  const storedProfile = localStorage.getItem('onboardingProfile');
  if (!storedProfile) {
    return defaultOnboardingProfile;
  }

  try {
    return { ...defaultOnboardingProfile, ...(JSON.parse(storedProfile) as Partial<OnboardingProfile>) };
  } catch {
    return defaultOnboardingProfile;
  }
};

export const saveOnboardingProfile = (profile: OnboardingProfile) => {
  localStorage.setItem('onboardingProfile', JSON.stringify(profile));
};

export const createDemoSession = () => {
  const user: StoredUser = {
    id: 1,
    name: 'FitLingo Athlete',
    email: 'demo@sportlingo.app',
    fitness_level: 'Beginner',
    main_goal: 'Build a daily sports habit',
    preferred_workout_duration: 5,
    equipment: ['No equipment'],
    preferred_sports: ['General fitness', 'Mobility and stretching'],
  };

  localStorage.setItem('token', 'demo-token');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('demoProgress', JSON.stringify({ totalXP: 0, streak: 0, workouts: 0, minutes: 0 }));

  return user;
};

export const mergeUserWithOnboarding = (user: StoredUser, profile: OnboardingProfile): StoredUser => {
  const updatedUser: StoredUser = {
    ...user,
    age: Number(profile.age) || user.age,
    height: Number(profile.height) || user.height,
    weight: Number(profile.weight) || user.weight,
    gender: profile.gender,
    current_activity_level: profile.activityLevel,
    fitness_level: profile.fitnessLevel,
    main_goal: profile.mainGoal,
    preferred_workout_duration: profile.dailyTimeGoal,
    equipment: profile.equipment,
    preferred_sports: profile.sports,
    motivation_reason: profile.motivationReason,
  };

  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
};
