import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNotification, notification } from '../../index';

describe('createNotification', () => {
  let api: ReturnType<typeof createNotification>;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createNotification();
  });
  afterEach(() => {
    api.clear();
    vi.useRealTimers();
  });

  it('open 携带标题与描述', () => {
    const id = api.open('success', '标题', '描述内容');
    const item = api.items.value[0];
    expect(item.id).toBe(id);
    expect(item.type).toBe('success');
    expect(item.title).toBe('标题');
    expect(item.description).toBe('描述内容');
  });

  it('语义方法与 error 5000ms 默认时长', () => {
    api.info('i');
    api.warning('w');
    api.error('e');
    expect(api.items.value.map((i) => i.type)).toEqual(['info', 'warning', 'error']);
    expect(api.items.value[2].duration).toBe(5000);
  });

  it('默认时长后自动关闭', () => {
    api.success('t');
    expect(api.items.value).toHaveLength(1);
    vi.advanceTimersByTime(4500);
    expect(api.items.value).toHaveLength(0);
  });

  it('全局单例可用', () => {
    expect(typeof notification.success).toBe('function');
  });
});
