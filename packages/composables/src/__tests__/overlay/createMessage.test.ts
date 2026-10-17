import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMessage, message } from '../../index';

describe('createMessage', () => {
  let api: ReturnType<typeof createMessage>;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMessage({ duration: 500, max: 10 });
  });
  afterEach(() => {
    api.clear();
    vi.useRealTimers();
  });

  it('类型方法写入对应类型，默认 info', () => {
    api.push('普通消息');
    api.success('成功消息');
    api.error('错误消息');
    expect(api.items.value.map((i) => i.type)).toEqual(['info', 'success', 'error']);
  });

  it('error 默认 5000ms，loading 常驻', () => {
    api.error('e');
    api.loading('l');
    const [errorItem, loadingItem] = api.items.value;
    expect(errorItem.duration).toBe(5000);
    expect(loadingItem.duration).toBe(0);
    expect(loadingItem.closable).toBe(true);
    vi.advanceTimersByTime(100000);
    expect(api.items.value.some((i) => i.content === 'l')).toBe(true);
    expect(api.items.value.some((i) => i.content === 'e')).toBe(false);
  });

  it('remove / clear', () => {
    const id = api.info('x');
    api.remove(id);
    expect(api.items.value).toHaveLength(0);
    api.info('a');
    api.info('b');
    api.clear();
    expect(api.items.value).toHaveLength(0);
  });

  it('全局单例可用', () => {
    expect(Array.isArray(message.items.value)).toBe(true);
    expect(typeof message.success).toBe('function');
  });
});
