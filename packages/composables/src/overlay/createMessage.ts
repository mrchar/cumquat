import type { Ref } from 'vue';
import { useToastQueue } from '../behavior/useToastQueue';
import type { PushToastOptions, ToastItem, ToastType } from '../behavior/useToastQueue';

export interface MessageOptions<T = unknown> extends PushToastOptions<T> {
  type?: ToastType;
}

export interface MessageApi {
  /** 当前消息列表（渲染组件直接消费） */
  items: Ref<Array<ToastItem>>;
  /** 入队并返回消息 id */
  push: (content: string, options?: MessageOptions) => number;
  success: (content: string, duration?: number) => number;
  warning: (content: string, duration?: number) => number;
  info: (content: string, duration?: number) => number;
  error: (content: string, duration?: number) => number;
  loading: (content: string, duration?: number) => number;
  remove: (id: number) => void;
  clear: () => void;
  pause: (id: number) => void;
  resume: (id: number) => void;
}

/**
 * 创建一套命令式消息服务。底层为共享响应式 toast 队列，
 * 渲染由 Message 组件承担；宿主也可在不引入组件的情况下调用。
 */
export function createMessage(
  options: {
    duration?: number;
    max?: number;
  } = {},
): MessageApi {
  const { duration = 3000, max = 5 } = options;
  const queue = useToastQueue<unknown>({ duration, max });

  const push = (content: string, pushOptions: MessageOptions = {}): number => {
    const item = queue.push(pushOptions.type ?? 'info', content, pushOptions);
    return item.id;
  };

  return {
    items: queue.items as Ref<Array<ToastItem>>,
    push,
    success: (content, time) => push(content, { type: 'success', duration: time }),
    warning: (content, time) => push(content, { type: 'warning', duration: time }),
    info: (content, time) => push(content, { type: 'info', duration: time }),
    error: (content, time) => push(content, { type: 'error', duration: time ?? 5000 }),
    loading: (content) => push(content, { type: 'loading', duration: 0 }),
    remove: queue.remove,
    clear: queue.clear,
    pause: queue.pause,
    resume: queue.resume,
  };
}

/** 全局默认单例：所有 Message 组件与宿主共享同一队列 */
export const message = createMessage();
