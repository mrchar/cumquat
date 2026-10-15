<script setup lang="ts">
import { computed, ref } from 'vue';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  { options: () => [], placeholder: '请选择', disabled: false },
);

const open = ref(false);
const model = defineModel<string | number | null>({ default: null });

const selected = computed(() => props.options.find((o) => o.value === model.value));

function toggle() {
  if (!props.disabled) open.value = !open.value;
}

function pick(option: SelectOption) {
  if (option.disabled) return;
  model.value = option.value;
  open.value = false;
}
</script>

<template>
  <div class="cumquat-select relative inline-block w-full">
    <button
      type="button"
      class="cumquat-select__trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-cumquat border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20 disabled:cursor-not-allowed disabled:bg-cumquat-surface-3 disabled:opacity-60"
      :class="open ? 'border-cumquat-accent' : 'border-cumquat-border'"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span :class="selected ? 'text-cumquat-text' : 'text-cumquat-text-muted'">
        {{ selected?.label ?? placeholder }}
      </span>
      <svg
        class="cumquat-select__arrow size-4 text-cumquat-text-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
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
      <ul
        v-if="open"
        role="listbox"
        class="cumquat-select__dropdown absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-cumquat border border-cumquat-border bg-cumquat-surface py-1 shadow-cumquat-overlay"
      >
        <li
          v-for="option in options"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          class="cumquat-select__option cursor-pointer px-3 py-2 text-sm transition-colors"
          :class="[
            option.disabled
              ? 'cursor-not-allowed text-cumquat-text-muted opacity-50'
              : option.value === model
                ? 'bg-cumquat-accent-soft font-medium text-cumquat-accent'
                : 'text-cumquat-text hover:bg-cumquat-surface-2',
          ]"
          @click="pick(option)"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
