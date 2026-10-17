import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useDismiss } from '../../index';
import { withScope } from '../helpers';

function keydown(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function pointerdownOn(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
}

describe('useDismiss', () => {
  it('打开时 ESC 触发 escape-key', () => {
    const onDismiss = vi.fn();
    withScope(() => useDismiss({ isOpen: ref(true), onDismiss }));
    keydown('Escape');
    expect(onDismiss).toHaveBeenCalledWith('escape-key');
  });

  it('关闭时不响应任何策略', () => {
    const onDismiss = vi.fn();
    withScope(() => useDismiss({ isOpen: ref(false), onDismiss, scroll: true }));
    keydown('Escape');
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('点击 reference 与 floating 不关闭，点击外部关闭', () => {
    const reference = document.createElement('button');
    const floating = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(reference, floating, outside);
    const onDismiss = vi.fn();
    withScope(() => useDismiss({ isOpen: ref(true), reference, floating, onDismiss }));
    pointerdownOn(reference);
    pointerdownOn(floating);
    expect(onDismiss).not.toHaveBeenCalled();
    pointerdownOn(outside);
    expect(onDismiss).toHaveBeenCalledWith('outside-press');
  });

  it('scroll 开启时滚动触发 scroll，禁用 ESC 后不响应', () => {
    const onDismiss = vi.fn();
    withScope(() => useDismiss({ isOpen: ref(true), onDismiss, scroll: true, escapeKey: false }));
    keydown('Escape');
    expect(onDismiss).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledWith('scroll');
  });

  it('enabled=false 时整体停用', () => {
    const onDismiss = vi.fn();
    withScope(() =>
      useDismiss({
        isOpen: ref(true),
        enabled: ref(false),
        onDismiss,
      }),
    );
    keydown('Escape');
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
