import { onScopeDispose, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

/** 当前是否处于浏览器环境（惰性求值，保证 SSR 安全） */
export const isClient = typeof window !== 'undefined';

/** 可注入到 DOM 类组合函数的目标类型：元素、元素引用或 getter */
export type MaybeElement<T extends Element = Element> = MaybeRefOrGetter<T | null | undefined>;

/** 将目标解析为真实 DOM 元素 */
export function toElement<T extends Element = Element>(
  target: MaybeElement<T> | null | undefined,
): T | null {
  if (!target) return null;
  const el = toValue(target);
  return el ?? null;
}

/** 可聚焦元素选择器（焦点陷阱 / roving focus 共用） */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * 获取容器内所有可聚焦元素（选择器已排除 disabled）。
 * 不做 offsetParent 可见性过滤：无布局环境（jsdom）与 display 切换中的
 * 元素仍需参与焦点管理，可见性由调用方保证。
 */
export function getFocusableList(container: HTMLElement | null): HTMLElement[] {
  if (!container || !isClient) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** 事件目标是否包含节点（用于外部点击判定） */
export function isEventInside(
  target: EventTarget | null,
  ...containers: Array<Element | null | undefined>
): boolean {
  if (!(target instanceof Node)) return false;
  return containers.some((el) => !!el && el.contains(target));
}

/**
 * 注册一个在作用域销毁时自动执行的清理函数；
 * 无活动作用域时返回空操作注册器，避免 SSR 报错。
 */
export function tryOnScopeDispose(fn: () => void): void {
  try {
    onScopeDispose(fn);
  } catch {
    /* 无活动作用域（SSR / 普通函数调用），无需注册 */
  }
}

/** 下一帧执行，返回取消函数（SSR 下降级为 setTimeout） */
export function rafThrottle(fn: () => void): () => void {
  if (!isClient || typeof requestAnimationFrame !== 'function') {
    const id = setTimeout(fn, 16);
    return () => clearTimeout(id);
  }
  let scheduled = false;
  const wrapped = () => {
    scheduled = false;
    fn();
  };
  return () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(wrapped);
  };
}
