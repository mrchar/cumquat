import { ref } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { getFocusableList, isClient, toElement } from '../internal/dom';
import type { MaybeElement } from '../internal/dom';
import { toValue } from 'vue';

export interface RovingFocusOptions {
  /** 选项数量或选项元素数组的来源（响应式） */
  count: MaybeRefOrGetter<number>;
  /** 判定索引对应项是否禁用（禁用项在键盘移动时跳过） */
  isItemDisabled?: (index: number) => boolean;
  /** 导航方向，默认 vertical */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** 到达边界后循环，默认 true */
  loop?: boolean;
  /** 初始激活索引，默认 0 */
  initialIndex?: number;
  /** 移动时是否自动聚焦 DOM，默认 true（传 false 时仅维护 tabindex） */
  autofocus?: boolean;
  /** 容器，配合 autofocus 定位选项；选项通过 [data-roving-index] 标记 */
  container?: MaybeElement<HTMLElement>;
}

export interface RovingFocusReturn {
  activeIndex: Ref<number>;
  setActiveIndex: (index: number) => void;
  /** 绑定到选项容器的键盘处理器 */
  onKeydown: (event: KeyboardEvent) => void;
  /** 返回某项的 tabindex：激活项为 0，其余为 -1 */
  getTabIndex: (index: number) => 0 | -1;
  /** 绑定到单个选项上，获得焦点时同步激活索引 */
  onItemFocus: (index: number) => () => void;
}

/**
 * 列表内 roving-tabindex 焦点管理：方向键 / Home / End 移动激活项，
 * 自动跳过禁用项，可选循环。Tab 只落到当前激活项。
 *
 * @internal 消费组件：Select、Menu、Tabs、Segmented、Tree
 */
export function useRovingFocus(options: RovingFocusOptions): RovingFocusReturn {
  const {
    count,
    isItemDisabled = () => false,
    orientation = 'vertical',
    loop = true,
    initialIndex = 0,
    autofocus = true,
    container,
  } = options;

  const activeIndex = ref(initialIndex);

  const getCount = () => Math.max(0, toValue(count));

  const isEnabledIndex = (index: number) =>
    index >= 0 && index < getCount() && !isItemDisabled(index);

  const findEnabled = (from: number, step: number): number => {
    const total = getCount();
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

  const setActiveIndex = (index: number) => {
    if (!isEnabledIndex(index)) return;
    activeIndex.value = index;
    if (autofocus && isClient && container) {
      const el = toElement(container);
      const nodes = el?.querySelectorAll<HTMLElement>('[data-roving-index]');
      nodes?.[index]?.focus();
    }
  };

  const move = (step: number) => {
    const next = findEnabled(activeIndex.value, step);
    if (next !== activeIndex.value) setActiveIndex(next);
  };

  const first = () => {
    const next = Array.from({ length: getCount() }, (_, i) => i).find((i) => !isItemDisabled(i));
    if (next !== undefined) setActiveIndex(next);
  };

  const last = () => {
    for (let i = getCount() - 1; i >= 0; i -= 1) {
      if (!isItemDisabled(i)) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    const allowVertical = orientation !== 'horizontal';
    const allowHorizontal = orientation !== 'vertical';
    switch (event.key) {
      case 'ArrowDown':
        if (allowVertical) {
          event.preventDefault();
          move(1);
        }
        break;
      case 'ArrowUp':
        if (allowVertical) {
          event.preventDefault();
          move(-1);
        }
        break;
      case 'ArrowRight':
        if (allowHorizontal) {
          event.preventDefault();
          move(1);
        }
        break;
      case 'ArrowLeft':
        if (allowHorizontal) {
          event.preventDefault();
          move(-1);
        }
        break;
      case 'Home':
        event.preventDefault();
        first();
        break;
      case 'End':
        event.preventDefault();
        last();
        break;
      default:
        break;
    }
  };

  const getTabIndex = (index: number): 0 | -1 => (index === activeIndex.value ? 0 : -1);

  const onItemFocus = (index: number) => () => {
    activeIndex.value = index;
    if (!autofocus && container) {
      const el = toElement(container);
      if (el) {
        const nodes = getFocusableList(el);
        nodes[index]?.setAttribute('tabindex', '0');
      }
    }
  };

  return { activeIndex, setActiveIndex, onKeydown, getTabIndex, onItemFocus };
}
