import { computed, ref } from 'vue';
import type { Ref } from 'vue';

let toastId = 0;

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface ToastItem<T = unknown> {
  id: number;
  type: ToastType;
  content: string;
  title?: string;
  duration: number;
  /** 自定义载荷（动作文案、图标等渲染所需数据） */
  meta?: T;
  /** 悬停暂停期间剩余时长，关闭后为 0 */
  remaining: number;
  /** 是否常驻（duration <= 0），需手动关闭 */
  closable: boolean;
}

export interface UseToastQueueOptions {
  /** 默认自动关闭时长，默认 3000ms；<=0 表示常驻 */
  duration?: number;
  /** 同时存在的最大条数，超出挤出最早项，默认 5 */
  max?: number;
  /** 去重：相同 type+content 时不重复入队，默认 true */
  dedupe?: boolean;
}

export interface PushToastOptions<T = unknown> {
  duration?: number;
  title?: string;
  meta?: T;
  closable?: boolean;
}

export interface UseToastQueueReturn<T = unknown> {
  items: Ref<Array<ToastItem<T>>>;
  count: Ref<number>;
  push: (type: ToastType, content: string, options?: PushToastOptions<T>) => ToastItem<T>;
  remove: (id: number) => void;
  clear: () => void;
  /** 悬停暂停计时（不清零剩余时长） */
  pause: (id: number) => void;
  /** 恢复计时 */
  resume: (id: number) => void;
}

/**
 * 命令式浮层队列：堆叠管理、去重、自动关闭、悬停暂停、手动销毁。
 * 只管理数据与计时，不渲染任何 DOM——渲染由 Message/Notification 组件承担。
 *
 * @internal 消费方：createMessage、createNotification
 */
export function useToastQueue<T = unknown>(
  options: UseToastQueueOptions = {},
): UseToastQueueReturn<T> {
  const { duration: defaultDuration = 3000, max = 5, dedupe = true } = options;
  const items = ref<ToastItem<T>[]>([]) as Ref<Array<ToastItem<T>>>;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const startedAt = new Map<number, number>();

  const clearTimer = (id: number) => {
    const timer = timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(id);
    }
  };

  const remove = (id: number) => {
    clearTimer(id);
    startedAt.delete(id);
    items.value = items.value.filter((item) => item.id !== id);
  };

  const schedule = (item: ToastItem<T>, wait = item.duration) => {
    if (wait <= 0) return;
    startedAt.set(item.id, Date.now());
    item.remaining = wait;
    timers.set(
      item.id,
      setTimeout(() => remove(item.id), wait),
    );
  };

  const push = (
    type: ToastType,
    content: string,
    pushOptions: PushToastOptions<T> = {},
  ): ToastItem<T> => {
    const duration = pushOptions.duration ?? defaultDuration;

    if (dedupe) {
      const existed = items.value.find((item) => item.type === type && item.content === content);
      if (existed) return existed;
    }

    const item: ToastItem<T> = {
      id: ++toastId,
      type,
      content,
      title: pushOptions.title,
      duration,
      meta: pushOptions.meta,
      remaining: duration,
      closable: pushOptions.closable ?? true,
    };

    items.value = [...items.value, item];
    schedule(item);

    if (items.value.length > max) {
      const overflow = items.value.slice(0, items.value.length - max);
      overflow.forEach((old) => remove(old.id));
    }

    return item;
  };

  const clear = () => {
    Array.from(timers.keys()).forEach(clearTimer);
    items.value = [];
  };

  const pause = (id: number) => {
    const item = items.value.find((entry) => entry.id === id);
    const started = startedAt.get(id);
    if (!item || started === undefined) return;
    item.remaining = Math.max(0, item.remaining - (Date.now() - started));
    clearTimer(id);
    startedAt.delete(id);
  };

  const resume = (id: number) => {
    const item = items.value.find((entry) => entry.id === id);
    if (!item || timers.has(id)) return;
    schedule(item, item.remaining);
  };

  const count = computed(() => items.value.length);

  return { items, count, push, remove, clear, pause, resume };
}
