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
  <div class="cumquat-select">
    <button
      type="button"
      class="cumquat-select__trigger"
      :class="open ? 'cumquat-select__trigger--open' : ''"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span
        class="cumquat-select__value"
        :class="selected ? '' : 'cumquat-select__value--placeholder'"
      >
        {{ selected?.label ?? placeholder }}
      </span>
      <svg
        class="cumquat-select__arrow"
        :class="open ? 'cumquat-select__arrow--open' : ''"
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
      <ul v-if="open" role="listbox" class="cumquat-select__dropdown">
        <li
          v-for="option in options"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          class="cumquat-select__option"
          :class="[
            option.disabled
              ? 'cumquat-select__option--disabled'
              : option.value === model
                ? 'cumquat-select__option--active'
                : '',
          ]"
          @click="pick(option)"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
