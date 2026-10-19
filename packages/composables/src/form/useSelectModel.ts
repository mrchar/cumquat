import { computed, ref } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';
import { useControllableModel } from '../core/useControllableModel';

export interface SelectOption<V = string | number, L = string> {
  value: V;
  label: L;
  disabled?: boolean;
  /** 选项分组标题（扁平数据中用于分组组织） */
  group?: string;
}

export interface UseSelectModelOptions<V, L> {
  /** 全部选项（响应式） */
  options: MaybeRefOrGetter<Array<SelectOption<V, L>>>;
  /** 单选当前值 / 多选值数组 */
  modelValue?: MaybeRefOrGetter<V | V[] | null>;
  defaultValue?: V | V[] | null;
  onChange?: (value: V | V[] | null) => void;
  multiple?: boolean;
  /** 是否可搜索（启用 keyword 与本地过滤） */
  filterable?: boolean;
  /** 自定义过滤谓词，默认按 label 包含匹配 */
  filterMethod?: (option: SelectOption<V, L>, keyword: string) => boolean;
  /** 值比较器，默认 Object.is */
  equals?: (a: V, b: V) => boolean;
}

export interface UseSelectModelReturn<V, L> {
  /** 当前值（单选 V / 多选 V[]） */
  model: Ref<V | V[] | null>;
  /** 已选中的完整选项对象（用于标签回显） */
  selectedOptions: Ref<Array<SelectOption<V, L>>>;
  /** 单选已选标签（无选中为 undefined） */
  selectedLabel: Ref<L | undefined>;
  keyword: Ref<string>;
  /** 按搜索词过滤后的选项 */
  filteredOptions: Ref<Array<SelectOption<V, L>>>;
  isSelected: (option: SelectOption<V, L>) => boolean;
  /** 选中 / 取消选中；返回是否发生了变化 */
  selectOption: (option: SelectOption<V, L>, checked?: boolean) => boolean;
  /** 多选移除某个已选标签 */
  removeValue: (value: V) => void;
  clear: () => void;
  setKeyword: (keyword: string) => void;
}

/**
 * 选择器值模型：单选/多选值、选项标签回显、本地过滤、清除。
 * 不发请求、不管浮层开合（分别由 useAsyncState / useOpen 承担）。
 *
 * @internal 消费组件：Select、TreeSelect
 */
export function useSelectModel<V = string | number, L = string>(
  options: UseSelectModelOptions<V, L>,
): UseSelectModelReturn<V, L> {
  const {
    options: optionSource,
    modelValue,
    defaultValue,
    onChange,
    multiple = false,
    filterable = false,
    filterMethod,
    equals = Object.is,
  } = options;

  const fallback = (multiple ? [] : null) as V | V[] | null;
  const { value: model } = useControllableModel<V | V[] | null>({
    modelValue,
    defaultValue,
    fallback,
    onChange,
  }) as { value: Ref<V | V[] | null> };

  const keyword = ref('');

  const findOption = (value: V) =>
    toValue(optionSource).find((option) => equals(option.value, value));

  /**
   * 已选快照：pick 时记下完整选项对象，独立于当前可见数据源。
   * 分页 / 服务端搜索后选项已不在当前页时，据此仍能回显已选标签；
   * 不从数据源中淘汰，仅随取消选中或清空移除。
   */
  const pickedOptions = ref<Array<SelectOption<V, L>>>([]);

  const findPicked = (value: V) =>
    pickedOptions.value.find((option) => equals(option.value, value));

  const remember = (option: SelectOption<V, L>) => {
    if (findPicked(option.value)) return;
    pickedOptions.value = [...pickedOptions.value, option];
  };

  const forget = (value: V) => {
    pickedOptions.value = pickedOptions.value.filter((option) => !equals(option.value, value));
  };

  const selectedOptions = computed(() => {
    const current = model.value;
    const values = Array.isArray(current) ? current : current === null ? [] : [current];
    return values
      .map((value) => findPicked(value) ?? findOption(value))
      .filter((option): option is SelectOption<V, L> => !!option);
  });

  const selectedLabel = computed(() => selectedOptions.value[0]?.label);

  const defaultFilter = (option: SelectOption<V, L>, word: string) =>
    String(option.label).toLowerCase().includes(word.trim().toLowerCase());

  const filteredOptions = computed(() => {
    const all = toValue(optionSource);
    if (!filterable || !keyword.value) return all;
    const matcher = filterMethod ?? defaultFilter;
    return all.filter((option) => matcher(option, keyword.value));
  });

  const isSelected = (option: SelectOption<V, L>) => {
    const current = model.value;
    if (Array.isArray(current)) {
      return current.some((value) => equals(value, option.value));
    }
    return current !== null && equals(current as V, option.value);
  };

  const selectOption = (option: SelectOption<V, L>, checked?: boolean): boolean => {
    if (option.disabled) return false;
    if (multiple) {
      const set = new Set((Array.isArray(model.value) ? model.value : []) as V[]);
      const nextChecked = checked ?? !set.has(option.value);
      if (nextChecked) {
        set.add(option.value);
        remember(option);
      } else {
        set.delete(option.value);
        forget(option.value);
      }
      model.value = Array.from(set);
    } else {
      if (checked === false) return false;
      if (model.value !== null && equals(model.value as V, option.value)) {
        return false;
      }
      model.value = option.value;
      remember(option);
    }
    keyword.value = '';
    return true;
  };

  const removeValue = (value: V) => {
    if (!multiple || !Array.isArray(model.value)) return;
    model.value = model.value.filter((item) => !equals(item, value));
    forget(value);
  };

  const clear = () => {
    model.value = multiple ? [] : null;
    pickedOptions.value = [];
    keyword.value = '';
  };

  const setKeyword = (next: string) => {
    keyword.value = next;
  };

  return {
    model,
    selectedOptions,
    selectedLabel,
    keyword,
    filteredOptions,
    isSelected,
    selectOption,
    removeValue,
    clear,
    setKeyword,
  };
}
