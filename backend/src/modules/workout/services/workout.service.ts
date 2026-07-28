import { workoutRepository } from '../repositories/workout.repository';
import { userService } from '../../user/services/user.service';

export class WorkoutService {
  async saveWorkout(userId: number = 1, workoutData: any): Promise<any> {
    return workoutRepository.saveWorkout(userId, workoutData);
  }

  async getLatestWorkout(userId: number = 1): Promise<any> {
    return workoutRepository.getLatestWorkout(userId);
  }

  async getWorkoutHistory(userId: number = 1, limit: number = 20): Promise<any[]> {
    return workoutRepository.getWorkoutHistory(userId, limit);
  }

  async updateExerciseSets(exerciseId: number | string, completedSets: number): Promise<any> {
    return workoutRepository.updateExerciseSets(exerciseId, completedSets);
  }

  async toggleExerciseCompletion(exerciseId: number | string, isCompleted: boolean): Promise<any> {
    return workoutRepository.toggleExerciseCompletion(exerciseId, isCompleted);
  }

  async getTodayWorkout(userId: number = 1): Promise<any> {
    return workoutRepository.getTodayWorkout(userId);
  }

  async markMissedWorkoutsBeforeToday(userId: number = 1): Promise<void> {
    return workoutRepository.markMissedWorkoutsBeforeToday(userId);
  }

  async markWorkoutComplete(workoutId: number, feedback: { energy: number; soreness: number; mood: number; notes?: string }): Promise<any> {
    const completedWorkout = await workoutRepository.markWorkoutComplete(workoutId, feedback);
    if (completedWorkout?.user_id) {
      await userService.addXp(completedWorkout.user_id, 20);
    }
    return completedWorkout;
  }

  async markWorkoutMissed(workoutId: number): Promise<any> {
    return workoutRepository.markWorkoutMissed(workoutId);
  }

  async getWorkoutStreak(userId: number = 1, days: number = 7): Promise<any[]> {
    return workoutRepository.getWorkoutStreak(userId, days);
  }
}

export const workoutService = new WorkoutService();
