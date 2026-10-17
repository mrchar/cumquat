import { describe, expect, it } from 'vitest';
import { useScrollLock } from '../../index';
import { withScope } from '../helpers';

describe('useScrollLock', () => {
  it('锁定时设置 body overflow，解锁恢复', () => {
    const ctx = withScope(() => useScrollLock());
    expect(ctx.isLocked.value).toBe(false);
    ctx.lock();
    expect(document.body.style.overflow).toBe('hidden');
    expect(ctx.isLocked.value).toBe(true);
    ctx.unlock();
    expect(document.body.style.overflow).toBe('');
    expect(ctx.isLocked.value).toBe(false);
  });

  it('多实例引用计数，全部解锁才恢复', () => {
    const a = withScope(() => useScrollLock());
    const b = withScope(() => useScrollLock());
    a.lock();
    b.lock();
    a.unlock();
    expect(document.body.style.overflow).toBe('hidden');
    b.unlock();
    expect(document.body.style.overflow).toBe('');
  });

  it('作用域销毁自动释放', () => {
    const ctx = withScope(() => useScrollLock());
    ctx.lock();
    ctx.$stop();
    expect(document.body.style.overflow).toBe('');
  });
});
