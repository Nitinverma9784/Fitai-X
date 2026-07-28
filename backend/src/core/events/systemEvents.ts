import { EventEmitter } from 'events';

export const systemEvents = new EventEmitter();

systemEvents.on('workout_completed', (data) => {
  console.log(`🎉 [Event] Workout Completed: ${data.title} (${data.userId})`);
});

systemEvents.on('recovery_updated', (data) => {
  console.log(`💚 [Event] Recovery Score Updated: ${data.score}% (${data.userId})`);
});
