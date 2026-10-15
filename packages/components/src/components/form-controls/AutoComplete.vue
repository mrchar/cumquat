<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    options?: string[];
    placeholder?: string;
  }>(),
  { options: () => [], placeholder: '输入以搜索' },
);

const model = defineModel<string>({ default: '' });

const open = ref(false);

/** 简单前缀/包含匹配 */
const suggestions = computed(() =>
  props.options.filter((o) => o.toLowerCase().includes(model.value.toLowerCase())),
);

function pick(option: string) {
  model.value = option;
  open.value = false;
}
</script>

<template>
  <div class="cumquat-autocomplete relative inline-block w-full">
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder"
      class="cumquat-autocomplete__input h-10 w-full rounded-cumquat border border-cumquat-border bg-cumquat-surface px-3 text-sm text-cumquat-text transition-colors placeholder:text-cumquat-text-muted focus:border-cumquat-accent focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      @focus="open = true"
      @blur="open = false"
    />
    <Transition name="cumquat-fade">
      <ul
        v-if="open && suggestions.length > 0"
        class="cumquat-autocomplete__dropdown absolute z-20 mt-1.5 max-h-52 w-full overflow-auto rounded-cumquat border border-cumquat-border bg-cumquat-surface py-1 shadow-cumquat-overlay"
      >
        <li
          v-for="option in suggestions"
          :key="option"
          class="cumquat-autocomplete__option cursor-pointer px-3 py-2 text-sm text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
          @mousedown.prevent="pick(option)"
        >
          {{ option }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
