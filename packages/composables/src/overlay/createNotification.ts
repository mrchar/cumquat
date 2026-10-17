import { computed } from 'vue';
import type { Ref } from 'vue';
import { useToastQueue } from '../behavior/useToastQueue';
import type { ToastType } from '../behavior/useToastQueue';

export interface NotificationMeta {
  title: string;
  description?: string;
  /** 动作文案等渲染数据 */
  action?: unknown;
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface NotificationEntry {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  meta?: NotificationMeta;
}

export interface NotificationApi {
  items: Ref<Array<NotificationEntry>>;
  open: (type: ToastType, title: string, description?: string, duration?: number) => number;
  success: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  remove: (id: number) => void;
  clear: () => void;
}

/**
 * 创建命令式通知服务。消息体携带标题 / 描述 / 动作数据，
 * 角落堆叠方向由渲染组件按 placement 分组。
 */
export function createNotification(
  options: {
    duration?: number;
    max?: number;
  } = {},
): NotificationApi {
  const { duration = 4500, max = 7 } = options;
  const queue = useToastQueue<NotificationMeta>({ duration, max });

  const open = (type: ToastType, title: string, description?: string, time?: number): number => {
    const item = queue.push(type, title, {
      title,
      duration: time,
      meta: { title, description },
    });
    return item.id;
  };

  const items = computed<NotificationEntry[]>(() =>
    queue.items.value.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.meta.title,
      description: item.meta.description,
      duration: item.duration,
      meta: item.meta,
    })),
  );

  return {
    items,
    open,
    success: (title, description) => open('success', title, description),
    warning: (title, description) => open('warning', title, description),
    info: (title, description) => open('info', title, description),
    error: (title, description) => open('error', title, description, 5000),
    remove: queue.remove,
    clear: queue.clear,
  };
}

/** 全局默认单例 */
export const notification = createNotification();
