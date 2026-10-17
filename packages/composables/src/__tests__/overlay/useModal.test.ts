import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useModal } from '../../index';
import { withScope } from '../helpers';

describe('useModal', () => {
  it('打开：锁定背景、分配层级、进入过渡挂载态', async () => {
    const onOpen = vi.fn();
    const ctx = withScope(() => useModal({ onOpen }));
    ctx.open();
    expect(ctx.isOpen.value).toBe(true);
    expect(onOpen).toHaveBeenCalled();
    await nextTick();
    expect(document.body.style.overflow).toBe('hidden');
    expect(ctx.zIndex.value).toBeGreaterThan(0);
    expect(ctx.rendered.value).toBe(true);
    expect(ctx.visible.value).toBe(true);

    ctx.close();
    await nextTick();
    expect(document.body.style.overflow).toBe('');
    ctx.onAfterLeave();
    expect(ctx.rendered.value).toBe(false);
  });

  it('层级随多次打开递增', async () => {
    const ctx = withScope(() => useModal());
    ctx.open();
    await nextTick();
    const first = ctx.zIndex.value;
    ctx.close();
    await nextTick();
    ctx.open();
    await nextTick();
    expect(ctx.zIndex.value).toBe(first + 1);
  });

  it('maskClosable=false 时遮罩点击不关闭', async () => {
    const ctx = withScope(() => useModal({ maskClosable: false }));
    ctx.open();
    ctx.onMaskClick();
    expect(ctx.isOpen.value).toBe(true);

    const closable = withScope(() => useModal());
    closable.open();
    closable.onMaskClick();
    expect(closable.isOpen.value).toBe(false);
    await nextTick();
  });

  it('ESC 关闭（escClosable=false 除外）', async () => {
    const ctx = withScope(() => useModal());
    ctx.open();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(ctx.isOpen.value).toBe(false);

    const fixed = withScope(() => useModal({ escClosable: false }));
    fixed.open();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixed.isOpen.value).toBe(true);
    fixed.close();
    await nextTick();
  });

  it('lockScroll=false 不修改 body overflow', async () => {
    const ctx = withScope(() => useModal({ lockScroll: false }));
    ctx.open();
    await nextTick();
    expect(document.body.style.overflow).toBe('');
    ctx.close();
  });

  it('onClose 回调触发', () => {
    const onClose = vi.fn();
    const ctx = withScope(() => useModal({ onClose }));
    ctx.open();
    ctx.close();
    expect(onClose).toHaveBeenCalled();
  });
});
