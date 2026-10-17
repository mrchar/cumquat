import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useTransitionVisible } from '../../index';
import { withScope } from '../helpers';

describe('useTransitionVisible', () => {
  it('关闭态初始不挂载', () => {
    const isOpen = ref(false);
    const ctx = withScope(() => useTransitionVisible(isOpen));
    expect(ctx.rendered.value).toBe(false);
    expect(ctx.visible.value).toBe(false);
  });

  it('打开时先挂载，下一帧可见', async () => {
    const isOpen = ref(false);
    const ctx = withScope(() => useTransitionVisible(isOpen));
    isOpen.value = true;
    expect(ctx.rendered.value).toBe(true);
    await nextTick();
    expect(ctx.visible.value).toBe(true);
  });

  it('关闭时不可见，after-leave 后卸载', async () => {
    const isOpen = ref(true);
    const ctx = withScope(() => useTransitionVisible(isOpen));
    await nextTick();
    isOpen.value = false;
    expect(ctx.visible.value).toBe(false);
    ctx.onAfterLeave();
    expect(ctx.rendered.value).toBe(false);
  });
});
