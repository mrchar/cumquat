import { computed, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { isClient } from '../internal/dom';

let centerId = 0;

export type NotificationCenterType = 'info' | 'success' | 'warning' | 'danger';

/** 消息盒子条目：供列表回看、已读标记与未读计数 */
export interface NotificationCenterItem {
  id: number;
  type: NotificationCenterType;
  title: string;
  description?: string;
  /** 业务附带数据（跳转参数、原始推送体等） */
  data?: unknown;
  /** 创建时间戳（ms） */
  time: number;
  read: boolean;
}

/** 接收一条异步通知的最小输入 */
export interface NotificationCenterInput {
  title: string;
  description?: string;
  type?: NotificationCenterType;
  data?: unknown;
  /** 覆盖创建时间，默认当前时间 */
  time?: number;
  /** 覆盖初始已读状态，默认未读 */
  read?: boolean;
}

export interface UseNotificationCenterOptions {
  /** 初始消息（如从持久化恢复） */
  initialItems?: NotificationCenterItem[];
  /** 最多保留条数，超出丢弃最早的，默认 100 */
  max?: number;
  /** 新消息入列回调（提示音、桌面通知等） */
  onPush?: (item: NotificationCenterItem) => void;
  /** 传入 localStorage key 时自动读写，重启后恢复消息与未读状态 */
  storageKey?: string;
}

export interface UseNotificationCenterReturn {
  /** 消息列表，最新在前 */
  items: Ref<NotificationCenterItem[]>;
  /** 未读条数 */
  unreadCount: ComputedRef<number>;
  /** 是否存在未读 */
  hasUnread: ComputedRef<boolean>;
  /** 接收一条服务端推送：入列到最前并触发 onPush */
  push: (input: NotificationCenterInput) => NotificationCenterItem;
  /** 单条标记已读 */
  markRead: (id: number) => void;
  /** 全部标记已读 */
  markAllRead: () => void;
  /** 删除单条 */
  remove: (id: number) => void;
  /** 清空全部 */
  clear: () => void;
}

function isItem(value: unknown): value is NotificationCenterItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<NotificationCenterItem>;
  return typeof item.id === 'number' && typeof item.title === 'string' && typeof item.time === 'number';
}

function readStorage(key: string): NotificationCenterItem[] {
  if (!isClient) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

/**
 * 消息盒子：接收服务端异步通知（WebSocket / SSE / 轮询均可直接调 push），
 * 维护未读计数、已读与删除。只管理数据，渲染由 NotificationCenter 组件承担。
 */
export function useNotificationCenter(
  options: UseNotificationCenterOptions = {},
): UseNotificationCenterReturn {
  const max = options.max ?? 100;
  const initial = options.initialItems
    ? [...options.initialItems]
    : options.storageKey
      ? readStorage(options.storageKey)
      : [];

  const items = ref<NotificationCenterItem[]>(initial) as Ref<NotificationCenterItem[]>;

  const unreadCount = computed(() => items.value.filter((item) => !item.read).length);
  const hasUnread = computed(() => unreadCount.value > 0);

  const push = (input: NotificationCenterInput): NotificationCenterItem => {
    const item: NotificationCenterItem = {
      id: ++centerId,
      type: input.type ?? 'info',
      title: input.title,
      description: input.description,
      data: input.data,
      time: input.time ?? Date.now(),
      read: input.read ?? false,
    };
    items.value = [item, ...items.value].slice(0, max);
    options.onPush?.(item);
    return item;
  };

  const markRead = (id: number) => {
    if (!items.value.some((item) => item.id === id && !item.read)) return;
    items.value = items.value.map((item) => (item.id === id ? { ...item, read: true } : item));
  };

  const markAllRead = () => {
    if (!hasUnread.value) return;
    items.value = items.value.map((item) => (item.read ? item : { ...item, read: true }));
  };

  const remove = (id: number) => {
    items.value = items.value.filter((item) => item.id !== id);
  };

  const clear = () => {
    items.value = [];
  };

  if (options.storageKey) {
    const key = options.storageKey;
    watch(
      items,
      (list) => {
        if (!isClient) return;
        try {
          localStorage.setItem(key, JSON.stringify(list));
        } catch {
          // 隐私模式或配额不足时忽略，内存状态仍可用
        }
      },
      { deep: false },
    );
  }

  return { items, unreadCount, hasUnread, push, markRead, markAllRead, remove, clear };
}
