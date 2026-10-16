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
  <div class="cumquat-autocomplete">
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder"
      class="cumquat-autocomplete__input"
      @focus="open = true"
      @blur="open = false"
    />
    <Transition name="cumquat-fade">
      <ul v-if="open && suggestions.length > 0" class="cumquat-autocomplete__dropdown">
        <li
          v-for="option in suggestions"
          :key="option"
          class="cumquat-autocomplete__option"
          @mousedown.prevent="pick(option)"
        >
          {{ option }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
