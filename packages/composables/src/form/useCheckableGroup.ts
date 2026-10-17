import { computed } from 'vue';
import { useControllableModel } from '../core/useControllableModel';

export interface CheckableGroupOptions<V> {
  /** true 为多选（值数组），false 为单选互斥，默认 true */
  multiple?: boolean;
  modelValue?: V[] | V | null;
  defaultValue?: V[] | V | null;
  onChange?: (value: V[] | V | null) => void;
  /** 多选时可选值全集（用于全选/半选推导与数量约束） */
  options?: () => V[];
  /** 多选时最少选中数 */
  min?: number;
  /** 多选时最多选中数 */
  max?: number;
  /** 禁用项判定 */
  isOptionDisabled?: (value: V) => boolean;
}

export interface CheckableGroupReturn<V> {
  /** 单选当前值 / 多选当前值数组 */
  model: ReturnType<typeof useControllableModel<V[] | V | null>>['value'];
  /** 某选项是否选中 */
  isChecked: (value: V) => boolean;
  /** 勾选 / 取消勾选（单选时直接替换） */
  select: (value: V, checked?: boolean) => void;
  /** 多选切换某项 */
  toggle: (value: V) => void;
  /** 多选：是否全选 */
  allChecked: ReturnType<typeof computed<boolean>>;
  /** 多选：是否半选（选了一部分） */
  indeterminate: ReturnType<typeof computed<boolean>>;
  /** 多选：全选 / 取消全选 */
  toggleAll: (checked?: boolean) => void;
  /** 多选：当前选中数量 */
  checkedCount: ReturnType<typeof computed<number>>;
}

/**
 * 成组勾选值管理：多选数组（增删、全选、半选、数量约束）与单选互斥。
 *
 * @internal 消费组件：CheckboxGroup、RadioGroup
 */
export function useCheckableGroup<V>(
  options: CheckableGroupOptions<V> = {},
): CheckableGroupReturn<V> {
  const {
    multiple = true,
    modelValue,
    defaultValue,
    onChange,
    options: getOptions,
    min = 0,
    max = Number.POSITIVE_INFINITY,
    isOptionDisabled = () => false,
  } = options;

  const fallback = (multiple ? [] : null) as V[] | V | null;
  const { value: model } = useControllableModel<V[] | V | null>({
    modelValue,
    defaultValue,
    fallback,
    onChange,
  });

  const selectedList = computed<V[]>(() => {
    const current = model.value;
    if (Array.isArray(current)) return current;
    return current === null || current === undefined ? [] : [current];
  });

  const isChecked = (value: V) => selectedList.value.some((item) => Object.is(item, value));

  const select = (value: V, checked?: boolean) => {
    if (!multiple) {
      if (checked !== false) model.value = value;
      return;
    }
    const nextChecked = checked ?? !isChecked(value);
    const set = new Set(selectedList.value);
    if (nextChecked) {
      if (set.size >= max) return;
      set.add(value);
    } else {
      if (set.size <= min) return;
      set.delete(value);
    }
    model.value = Array.from(set);
  };

  const toggle = (value: V) => select(value);

  const enabledOptions = computed(() =>
    (getOptions?.() ?? []).filter((value) => !isOptionDisabled(value)),
  );

  const checkedCount = computed(() => selectedList.value.length);

  const allChecked = computed(() => {
    const options = enabledOptions.value;
    return options.length > 0 && options.every((value) => isChecked(value));
  });

  const indeterminate = computed(() => {
    const options = enabledOptions.value;
    const count = options.filter((value) => isChecked(value)).length;
    return count > 0 && count < options.length;
  });

  const toggleAll = (checked?: boolean) => {
    if (!multiple) return;
    const nextAll = checked ?? !allChecked.value;
    if (nextAll) {
      const merged = new Set(selectedList.value);
      for (const value of enabledOptions.value) {
        if (merged.size >= max) break;
        merged.add(value);
      }
      model.value = Array.from(merged);
    } else {
      const enabledSet = new Set(enabledOptions.value);
      model.value = selectedList.value.filter((value) => !enabledSet.has(value));
    }
  };

  return {
    model,
    isChecked,
    select,
    toggle,
    allChecked,
    indeterminate,
    toggleAll,
    checkedCount,
  };
}
