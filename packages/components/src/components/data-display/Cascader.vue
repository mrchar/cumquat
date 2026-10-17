<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFloating, useFormField, useListboxNavigation, useOpen } from '@cumquat/composables';

export interface CascaderOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: CascaderOption[];
}

const props = withDefaults(
  defineProps<{
    options: CascaderOption[];
    /** 叶子节点 value；emitPath=true 时为路径数组 */
    modelValue?: string | number | Array<string | number> | null;
    placeholder?: string;
    disabled?: boolean;
    /** 允许选择任意一级 */
    changeOnSelect?: boolean;
    /** v-model 携带完整路径而非叶子 value */
    emitPath?: boolean;
  }>(),
  {
    modelValue: undefined,
    placeholder: '请选择',
    disabled: false,
    changeOnSelect: false,
    emitPath: false,
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
      const found = lookupPath(props.options, leaf);
      if (found) path.value = found;
    }
  },
  { immediate: true },
);

interface Column {
  options: CascaderOption[];
  selected: string | number | null;
}

const columns = computed<Column[]>(() => {
  const list: Column[] = [];
  let current: CascaderOption[] | undefined = props.options;
  let colIndex = 0;
  while (current && current.length > 0) {
    const selectedValue = path.value[colIndex] ?? null;
    list.push({ options: current, selected: selectedValue });
    const selectedOption = current.find((option) => option.value === selectedValue);
    current = selectedOption?.children;
    colIndex++;
  }
  return list;
});

const selectedLabels = computed(() => {
  const labels: string[] = [];
  let level: CascaderOption[] = props.options;
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
  const isLeaf = !option.children || option.children.length === 0;
  if (isLeaf || props.changeOnSelect) {
    field.handleChange(props.emitPath ? path.value : option.value);
  }
  if (isLeaf) close();
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
              v-if="option.children?.length"
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
        </ul>
      </div>
    </Transition>
  </div>
</template>
