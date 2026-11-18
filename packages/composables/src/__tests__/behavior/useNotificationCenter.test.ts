import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useNotificationCenter } from '../../index';
import { withScope } from '../helpers';

describe('useNotificationCenter', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('push 最新在前，默认未读并触发 onPush', () => {
    const onPush = vi.fn();
    const center = withScope(() => useNotificationCenter({ onPush }));
    center.push({ title: '第一条' });
    center.push({ title: '第二条', description: '详情', type: 'success', data: { id: 2 } });

    expect(center.items.value.map((item) => item.title)).toEqual(['第二条', '第一条']);
    expect(center.items.value[0]).toMatchObject({
      type: 'success',
      description: '详情',
      data: { id: 2 },
      read: false,
    });
    expect(center.items.value[0].id).not.toBe(center.items.value[1].id);
    expect(center.unreadCount.value).toBe(2);
    expect(center.hasUnread.value).toBe(true);
    expect(onPush).toHaveBeenCalledTimes(2);
  });

  it('markRead / markAllRead / remove / clear 维护未读计数', () => {
    const center = withScope(() => useNotificationCenter());
    const first = center.push({ title: 'a' });
    center.push({ title: 'b' });

    center.markRead(first.id);
    expect(center.unreadCount.value).toBe(1);
    expect(center.items.value.find((item) => item.id === first.id)?.read).toBe(true);

    center.markAllRead();
    expect(center.unreadCount.value).toBe(0);
    expect(center.hasUnread.value).toBe(false);

    center.remove(first.id);
    expect(center.items.value.map((item) => item.title)).toEqual(['b']);

    center.clear();
    expect(center.items.value).toHaveLength(0);
  });

  it('超过 max 丢弃最早项', () => {
    const center = withScope(() => useNotificationCenter({ max: 2 }));
    center.push({ title: '1' });
    center.push({ title: '2' });
    center.push({ title: '3' });
    expect(center.items.value.map((item) => item.title)).toEqual(['3', '2']);
  });

  it('initialItems 作为初始列表', () => {
    const center = withScope(() =>
      useNotificationCenter({
        initialItems: [{ id: 1, type: 'info', title: '旧消息', time: 1, read: true }],
      }),
    );
    expect(center.items.value).toHaveLength(1);
    expect(center.unreadCount.value).toBe(0);
  });

  it('storageKey 自动持久化并可恢复', async () => {
    const first = withScope(() =>
      useNotificationCenter({ storageKey: 'cumquat-center' }),
    );
    const item = first.push({ title: '持久化消息' });
    await nextTick();
    expect(JSON.parse(localStorage.getItem('cumquat-center') ?? '[]')).toEqual([
      expect.objectContaining({ id: item.id, title: '持久化消息', read: false }),
    ]);

    const restored = withScope(() =>
      useNotificationCenter({ storageKey: 'cumquat-center' }),
    );
    expect(restored.items.value).toHaveLength(1);
    expect(restored.items.value[0].title).toBe('持久化消息');
    expect(restored.unreadCount.value).toBe(1);
  });
});
