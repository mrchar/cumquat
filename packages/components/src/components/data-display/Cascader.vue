<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  useFetchResource,
  useFloating,
  useFormField,
  useListboxNavigation,
  useOpen,
} from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

export interface CascaderOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: CascaderOption[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}

const props = withDefaults(
  defineProps<{
    options?: CascaderOption[];
    /** 叶子节点 value；emitPath=true 时为路径数组 */
    modelValue?: string | number | Array<string | number> | null;
    placeholder?: string;
    disabled?: boolean;
    /** 允许选择任意一级 */
    changeOnSelect?: boolean;
    /** v-model 携带完整路径而非叶子 value */
    emitPath?: boolean;
    /**
     * 统一远程请求：挂载拉取根选项；选中未加载项时以
     * { filters: { parentKey } } 拉取子级，返回选项数组或 { list, total }
     */
    fetch?: Fetch<CascaderOption>;
  }>(),
  {
    options: () => [],
    modelValue: undefined,
    placeholder: '请选择',
    disabled: false,
    changeOnSelect: false,
    emitPath: false,
    fetch: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number | Array<string | number> | null];
  change: [value: string | number | Array<string | number> | null];
}>();

const field = useFormField<string | number | Array<string | number> | null>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
  disabled: () => props.disabled,
});

const { isOpen, toggle, close } = useOpen();
const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

/** 每一列选中的 option value */
const path = ref<Array<string | number>>([]);

/* ---------------- fetch：根选项挂载即拉，逐级懒加载 ---------------- */
function findOption(options: CascaderOption[], value: string | number): CascaderOption | undefined {
  for (const option of options) {
    if (option.value === value) return option;
    if (option.children) {
      const hit = findOption(option.children, value);
      if (hit) return hit;
    }
  }
  return undefined;
}

const {
  enabled: fetchEnabled,
  state: fetchState,
  refresh,
} = useFetchResource<CascaderOption[]>(() => props.fetch, {
  getQuery: () => ({}),
  initialData: [] as CascaderOption[],
  merge: (previous, next, query) => {
    const parentKey = query.filters?.parentKey as string | number | undefined;
    if (parentKey === undefined) return next;
    const parent = findOption(previous, parentKey);
    if (parent) {
      parent.children = next;
      if (next.length === 0) parent.leaf = true;
    }
    return [...previous];
  },
});

const sourceOptions = computed<CascaderOption[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.options,
);

const loadingKey = ref<string | number | null>(null);
const errorKey = ref<string | number | null>(null);
const loadedKeys = new Set<string | number>();

async function loadChildren(key: string | number) {
  if (loadingKey.value === key) return;
  loadingKey.value = key;
  errorKey.value = null;
  await refresh({ filters: { parentKey: key } });
  loadingKey.value = null;
  loadedKeys.add(key);
  if (fetchState.value?.status === 'error') errorKey.value = key;
}

/** 依据叶子 value 反查完整路径 */
function lookupPath(
  options: CascaderOption[],
  target: string | number,
  trail: Array<string | number> = [],
): Array<string | number> | null {
  for (const option of options) {
    const next = [...trail, option.value];
    if (option.value === target) return next;
    if (option.children?.length) {
      const found = lookupPath(option.children, target, next);
      if (found) return found;
    }
  }
  return null;
}

watch(
  () => field.value.value,
  (value) => {
    if (value === null || value === undefined) {
      path.value = [];
      return;
    }
    const leaf = Array.isArray(value) ? (value.at(-1) ?? null) : value;
    if (leaf !== null) {
      const found = lookupPath(sourceOptions.value, leaf);
      if (found) path.value = found;
    }
  },
  { immediate: true },
);

interface Column {
  options: CascaderOption[];
  selected: string | number | null;
  /** 远程列状态：加载中 / 失败重试 / 已加载但为空 */
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
}

const columns = computed<Column[]>(() => {
  const list: Column[] = [];

  /* 根级四态 */
  if (fetchEnabled.value && sourceOptions.value.length === 0) {
    const status = fetchState.value?.status;
    if (status === 'pending') return [{ options: [], selected: null, loading: true }];
    if (status === 'error') return [{ options: [], selected: null, error: true }];
    return [{ options: [], selected: null, empty: true }];
  }

  let current: CascaderOption[] | undefined = sourceOptions.value;
  let colIndex = 0;
  while (current && current.length > 0) {
    const selectedValue = path.value[colIndex] ?? null;
    list.push({ options: current, selected: selectedValue });
    const selectedOption = current.find((option) => option.value === selectedValue);
    if (!selectedOption) break;
    current = selectedOption.children;
    colIndex++;
    // 远程模式：选中项未带过子级且未声明叶子 → 追加状态列
    const needsLazy =
      fetchEnabled.value && selectedOption.leaf !== true && (!current || current.length === 0);
    if (needsLazy) {
      const key = selectedOption.value;
      if (errorKey.value === key) list.push({ options: [], selected: null, error: true });
      else if (loadingKey.value === key || !loadedKeys.has(key))
        list.push({ options: [], selected: null, loading: true });
      else list.push({ options: [], selected: null, empty: true });
      break;
    }
  }
  return list;
});

const selectedLabels = computed(() => {
  const labels: string[] = [];
  let level: CascaderOption[] = sourceOptions.value;
  for (const value of path.value) {
    const found = level.find((option) => option.value === value);
    if (!found) break;
    labels.push(found.label);
    level = found.children ?? [];
  }
  return labels;
});

/* ---------- 键盘导航（作用于当前聚焦列） ---------- */
const activeColumn = ref(0);
const nav = useListboxNavigation({
  count: computed(() => columns.value[activeColumn.value]?.options.length ?? 0),
  isItemDisabled: (index) => !!columns.value[activeColumn.value]?.options[index]?.disabled,
  onSelect: (index) => {
    const option = columns.value[activeColumn.value]?.options[index];
    if (option) pick(option, activeColumn.value);
  },
});

function onColumnKeydown(colIndex: number, event: KeyboardEvent) {
  activeColumn.value = colIndex;
  nav.onKeydown(event);
}

function pick(option: CascaderOption, colIndex: number) {
  if (option.disabled) return;
  path.value = [...path.value.slice(0, colIndex), option.value];
  activeColumn.value = colIndex + 1;
  // 本地：无子级即叶子；远程：显式 leaf 或懒加载完成后仍为空
  const isLeaf =
    option.leaf === true ||
    (!fetchEnabled.value && (!option.children || option.children.length === 0)) ||
    (fetchEnabled.value &&
      loadedKeys.has(option.value) &&
      (!option.children || option.children.length === 0));
  if (isLeaf || props.changeOnSelect) {
    field.handleChange(props.emitPath ? path.value : option.value);
  }
  if (isLeaf) close();
  if (
    fetchEnabled.value &&
    option.leaf !== true &&
    !option.children?.length &&
    !loadedKeys.has(option.value)
  ) {
    void loadChildren(option.value);
  }
}

/** 失败状态列的重试（根级或父级） */
function retryColumn(col: Column) {
  const parentValue = col.selected ?? path.value.at(-1);
  if (parentValue === undefined || parentValue === null) {
    fetchState.value?.retry?.();
    return;
  }
  void loadChildren(parentValue);
}
</script>

<template>
  <div class="cumquat-cascader">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-cascader__trigger"
      :class="isOpen ? 'cumquat-cascader__trigger--open' : ''"
      :disabled="disabled"
      @click="toggle()"
    >
      <span
        class="cumquat-cascader__value"
        :class="selectedLabels.length > 0 ? '' : 'cumquat-cascader__value--placeholder'"
      >
        {{ selectedLabels.length > 0 ? selectedLabels.join(' / ') : placeholder }}
      </span>
      <svg
        class="cumquat-cascader__trigger-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <div v-if="isOpen" ref="floatingRef" class="cumquat-cascader__panel" :style="floatingStyles">
        <ul
          v-for="(col, colIndex) in columns"
          :key="colIndex"
          class="cumquat-cascader__column"
          @keydown="onColumnKeydown(colIndex, $event)"
        >
          <li
            v-for="option in col.options"
            :key="option.value"
            class="cumquat-cascader__option"
            :class="[
              option.value === col.selected ? 'cumquat-cascader__option--selected' : '',
              option.disabled ? 'cumquat-cascader__option--disabled' : '',
            ]"
            @click="pick(option, colIndex)"
          >
            {{ option.label }}
            <svg
              v-if="option.children?.length || (fetch && option.leaf !== true)"
              class="cumquat-cascader__option-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </li>
          <li v-if="col.loading" class="cumquat-cascader__state cq-state--pending">加载中…</li>
          <li v-else-if="col.error" class="cumquat-cascader__state cq-state--error">
            加载失败
            <button type="button" class="cumquat-cascader__retry" @click.stop="retryColumn(col)">
              重试
            </button>
          </li>
          <li v-else-if="col.empty" class="cumquat-cascader__state">暂无数据</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
