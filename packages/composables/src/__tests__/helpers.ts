import { effectScope } from 'vue';

/** 在 effectScope 中运行组合函数，返回结果与停止函数 */
export function withScope<T>(factory: () => T): T & { $stop: () => void } {
  const scope = effectScope(true);
  const result = (scope.run(factory) ?? {}) as T & { $stop: () => void };
  result.$stop = () => scope.stop();
  return result;
}

export function flushTimers(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function advanceTimers(ms: number): void {
  vi.useFakeTimers();
  vi.advanceTimersByTime(ms);
  vi.useRealTimers();
}
