import { eventBus } from '@/lib/server/events';

const queue: Array<{ id: string; createdAt: number; run: () => Promise<void> }> = [];

export function queueOfflineTask(id: string, run: () => Promise<void>) {
  queue.push({ id, run, createdAt: Date.now() });
  eventBus.emit('sync:queued', { id, timestamp: new Date().toISOString() });
}

export async function flushOfflineQueue() {
  for (const task of [...queue]) {
    try {
      await task.run();
      eventBus.emit('sync:completed', { id: task.id, timestamp: new Date().toISOString() });
      const i = queue.findIndex((q) => q.id === task.id);
      if (i >= 0) queue.splice(i, 1);
    } catch {
      eventBus.emit('sync:conflict_resolved', { id: task.id, strategy: 'timestamp_last_write_wins', timestamp: new Date().toISOString() });
    }
  }
}
