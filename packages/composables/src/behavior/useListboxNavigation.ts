import { ref } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';

export interface ListboxNavigationOptions {
  /** 选项总数（响应式） */
  count: MaybeRefOrGetter<number>;
  /** 禁用项判定 */
  isItemDisabled?: (index: number) => boolean;
  /** 导航方向，默认 vertical */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** 边界循环，默认 true */
  loop?: boolean;
  /** 初始激活索引，默认 -1（尚未激活，首次按键落到首项） */
  initialIndex?: number;
  /** 回车 / 空格选中时回调 */
  onSelect?: (index: number) => void;
  /** 激活项变化回调（用于滚动到可视区） */
  onActiveChange?: (index: number) => void;
}

export interface ListboxNavigationReturn {
  activeIndex: Ref<number>;
  setActiveIndex: (index: number) => void;
  moveNext: () => void;
  movePrev: () => void;
  moveFirst: () => void;
  moveLast: () => void;
  /** 绑定到列表容器：方向键移动、回车/空格选中 */
  onKeydown: (event: KeyboardEvent) => void;
  reset: () => void;
}

/**
 * 选项列表键盘导航：上下移动、Home/End、回车选中、禁用项跳过、边界循环。
 * 与焦点管理解耦——本函数只维护逻辑激活索引。
 *
 * @internal 消费组件：Select、Dropdown、Menu、Cascader、AutoComplete、
 * Mention、Segmented、TreeSelect、TimePicker
 */
export function useListboxNavigation(options: ListboxNavigationOptions): ListboxNavigationReturn {
  const {
    count,
    isItemDisabled = () => false,
    orientation = 'vertical',
    loop = true,
    initialIndex = -1,
    onSelect,
    onActiveChange,
  } = options;

  const activeIndex = ref(initialIndex);
  const getCount = () => Math.max(0, toValue(count));

  const setActiveIndex = (index: number) => {
    if (index !== -1 && (index < 0 || index >= getCount())) return;
    activeIndex.value = index;
    onActiveChange?.(index);
  };

  const findEnabled = (from: number, step: number): number => {
    const total = getCount();
    if (total === 0) return -1;
    let cursor = from;
    for (let i = 0; i < total; i += 1) {
      cursor += step;
      if (cursor < 0 || cursor >= total) {
        if (!loop) return from;
        cursor = cursor < 0 ? total - 1 : 0;
      }
      if (!isItemDisabled(cursor)) return cursor;
    }
    return from;
  };

  const moveNext = () => {
    const next = findEnabled(activeIndex.value, 1);
    if (next !== activeIndex.value && next !== -1) setActiveIndex(next);
  };

  const movePrev = () => {
    const prev = findEnabled(activeIndex.value, -1);
    if (prev !== activeIndex.value && prev !== -1) setActiveIndex(prev);
  };

  const moveFirst = () => {
    const first = findEnabled(-1, 1);
    if (first !== -1) setActiveIndex(first);
  };

  const moveLast = () => {
    for (let i = getCount() - 1; i >= 0; i -= 1) {
      if (!isItemDisabled(i)) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const selectActive = () => {
    const index = activeIndex.value;
    if (index >= 0 && !isItemDisabled(index)) onSelect?.(index);
  };

  const onKeydown = (event: KeyboardEvent) => {
    const allowVertical = orientation !== 'horizontal';
    const allowHorizontal = orientation !== 'vertical';
    switch (event.key) {
      case 'ArrowDown':
        if (allowVertical) {
          event.preventDefault();
          moveNext();
        }
        break;
      case 'ArrowUp':
        if (allowVertical) {
          event.preventDefault();
          movePrev();
        }
        break;
      case 'ArrowRight':
        if (allowHorizontal) {
          event.preventDefault();
          moveNext();
        }
        break;
      case 'ArrowLeft':
        if (allowHorizontal) {
          event.preventDefault();
          movePrev();
        }
        break;
      case 'Home':
        event.preventDefault();
        moveFirst();
        break;
      case 'End':
        event.preventDefault();
        moveLast();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectActive();
        break;
      default:
        break;
    }
  };

  const reset = () => setActiveIndex(initialIndex);

  return {
    activeIndex,
    setActiveIndex,
    moveNext,
    movePrev,
    moveFirst,
    moveLast,
    onKeydown,
    reset,
  };
}
