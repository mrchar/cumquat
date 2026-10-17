import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastQueue } from '../../index';
import { withScope } from '../helpers';

describe('useToastQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('入队、计数与字段默认值', () => {
    const queue = withScope(() => useToastQueue());
    const item = queue.push('success', '保存成功');
    expect(queue.count.value).toBe(1);
    expect(item.type).toBe('success');
    expect(item.duration).toBe(3000);
    expect(item.closable).toBe(true);
  });

  it('相同 type+content 去重，dedupe=false 可重复', () => {
    const queue = withScope(() => useToastQueue());
    const a = queue.push('info', '相同内容');
    const b = queue.push('info', '相同内容');
    expect(b.id).toBe(a.id);
    expect(queue.count.value).toBe(1);

    const queue2 = withScope(() => useToastQueue({ dedupe: false }));
    queue2.push('info', 'x');
    queue2.push('info', 'x');
    expect(queue2.count.value).toBe(2);
  });

  it('超过 max 挤出最早项', () => {
    const queue = withScope(() => useToastQueue({ max: 2, duration: 0 }));
    const first = queue.push('info', '1', { duration: 0 });
    queue.push('info', '2', { duration: 0 });
    queue.push('info', '3', { duration: 0 });
    expect(queue.count.value).toBe(2);
    expect(queue.items.value.map((i) => i.content)).toEqual(['2', '3']);
    queue.remove(first.id);
    expect(queue.count.value).toBe(2);
  });

  it('到时自动关闭', () => {
    const queue = withScope(() => useToastQueue({ duration: 500 }));
    queue.push('info', 'x');
    vi.advanceTimersByTime(499);
    expect(queue.count.value).toBe(1);
    vi.advanceTimersByTime(1);
    expect(queue.count.value).toBe(0);
  });

  it('常驻项（duration<=0）不自动关闭', () => {
    const queue = withScope(() => useToastQueue());
    queue.push('loading', '处理中', { duration: 0 });
    vi.advanceTimersByTime(100000);
    expect(queue.count.value).toBe(1);
  });

  it('pause/resume 按剩余时长计时', () => {
    const queue = withScope(() => useToastQueue({ duration: 1000 }));
    const item = queue.push('info', 'x');
    vi.advanceTimersByTime(400);
    queue.pause(item.id);
    vi.advanceTimersByTime(10000);
    expect(queue.count.value).toBe(1);
    queue.resume(item.id);
    vi.advanceTimersByTime(599);
    expect(queue.count.value).toBe(1);
    vi.advanceTimersByTime(2);
    expect(queue.count.value).toBe(0);
  });

  it('clear 清空全部并取消计时', () => {
    const queue = withScope(() => useToastQueue({ duration: 100 }));
    queue.push('info', '1');
    queue.push('info', '2');
    queue.clear();
    expect(queue.count.value).toBe(0);
    vi.advanceTimersByTime(500);
    expect(queue.count.value).toBe(0);
  });
});
