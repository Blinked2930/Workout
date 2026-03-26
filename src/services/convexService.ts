import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Custom hook for main categories
export const useMainCategories = () => {
  return useQuery(api.exercises.getMainCategories);
};

export const useCreateMainCategory = () => {
  return useMutation(api.exercises.createMainCategory);
};

// Custom hook for sub categories
export const useSubCategories = (mainCategoryId?: string) => {
  return useQuery(api.exercises.getSubCategories, mainCategoryId ? { mainCategoryId } : {});
};

export const useCreateSubCategory = () => {
  return useMutation(api.exercises.createSubCategory);
};

// Custom hook for exercises
export const useExercises = (subCategoryId?: string, search?: string) => {
  return useQuery(api.exercises.getExercises, { subCategoryId, search });
};

export const useCreateExercise = () => {
  return useMutation(api.exercises.createExercise);
};

export const useExercise = (exerciseId: string) => {
  return useQuery(api.exercises.getExercise, { exerciseId });
};

// Custom hook for lifts
export const useLifts = (exerciseId?: string, startDate?: number, endDate?: number) => {
  return useQuery(api.lifts.getLifts, { exerciseId, startDate, endDate });
};

export const useCreateLift = () => {
  return useMutation(api.lifts.createLift);
};

export const useUpdateLift = () => {
  return useMutation(api.lifts.updateLift);
};

export const useDeleteLift = () => {
  return useMutation(api.lifts.deleteLift);
};

// Custom hook for cardio sessions
export const useCardioSessions = (activityType?: string, startDate?: number, endDate?: number) => {
  return useQuery(api.cardio.getCardioSessions, { activityType, startDate, endDate });
};

export const useCreateCardioSession = () => {
  return useMutation(api.cardio.createCardioSession);
};

// Custom hook for time goals
export const useTimeGoals = () => {
  return useQuery(api.cardio.getTimeGoals);
};

export const useUpdateTimeGoal = () => {
  return useMutation(api.cardio.updateTimeGoal);
};

// User management
export const useCurrentUser = () => {
  return useQuery(api.users.getCurrentUser);
};

export const useCreateUser = () => {
  return useMutation(api.users.createUser);
};
