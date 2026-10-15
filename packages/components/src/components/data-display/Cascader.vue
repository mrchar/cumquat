<script setup lang="ts">
import { computed, ref } from 'vue';

export interface CascaderOption {
  label: string;
  value: string | number;
  children?: CascaderOption[];
}

const props = withDefaults(
  defineProps<{
    options: CascaderOption[];
    placeholder?: string;
  }>(),
  { placeholder: '请选择' },
);

const open = ref(false);
const model = defineModel<string | number | null>({ default: null });

/** 每一列选中的 option value */
const path = ref<(string | number)[]>([]);

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
    const selectedOption = current.find((o) => o.value === selectedValue);
    current = selectedOption?.children;
    colIndex++;
  }
  return list;
});

const selectedLabels = computed(() => {
  const labels: string[] = [];
  let level: CascaderOption[] = props.options;
  for (const value of path.value) {
    const found = level.find((o) => o.value === value);
    if (!found) break;
    labels.push(found.label);
    level = found.children ?? [];
  }
  return labels;
});

function pick(option: CascaderOption, colIndex: number) {
  path.value = [...path.value.slice(0, colIndex), option.value];
  if (!option.children || option.children.length === 0) {
    model.value = option.value;
    open.value = false;
  }
}
</script>

<template>
  <div class="cumquat-cascader relative inline-block w-full">
    <button
      type="button"
      class="cumquat-cascader__trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-cumquat border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      :class="open ? 'border-cumquat-accent' : 'border-cumquat-border'"
      @click="open = !open"
    >
      <span :class="selectedLabels.length > 0 ? 'text-cumquat-text' : 'text-cumquat-text-muted'">
        {{ selectedLabels.length > 0 ? selectedLabels.join(' / ') : placeholder }}
      </span>
      <svg
        class="size-4 text-cumquat-text-muted"
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
      <div
        v-if="open"
        class="cumquat-cascader__panel absolute z-20 mt-1.5 flex rounded-cumquat border border-cumquat-border bg-cumquat-surface shadow-cumquat-overlay"
      >
        <ul
          v-for="(col, colIndex) in columns"
          :key="colIndex"
          class="cumquat-cascader__column max-h-60 min-w-40 overflow-y-auto border-r border-cumquat-border py-1.5 last:border-r-0"
        >
          <li
            v-for="option in col.options"
            :key="option.value"
            class="cumquat-cascader__option flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors"
            :class="
              option.value === col.selected
                ? 'bg-cumquat-accent-soft font-medium text-cumquat-accent'
                : 'text-cumquat-text hover:bg-cumquat-surface-2'
            "
            @click="pick(option, colIndex)"
          >
            {{ option.label }}
            <svg
              v-if="option.children?.length"
              class="size-3.5 text-cumquat-text-muted"
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
