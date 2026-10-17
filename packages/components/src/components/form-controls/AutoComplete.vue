<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAsyncSuggest, useFloating, useListboxNavigation } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 静态候选（本地包含匹配） */
    options?: string[];
    /** 异步候选源；提供时替代本地过滤 */
    fetch?: (keyword: string) => Promise<string[]>;
    placeholder?: string;
    disabled?: boolean;
    /** 聚焦时是否即触发建议 */
    triggerOnFocus?: boolean;
    /** 防抖时长（异步源生效） */
    debounce?: number;
    /** 触发请求的最小关键词长度 */
    minKeywordLength?: number;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    fetch: undefined,
    placeholder: '输入以搜索',
    disabled: false,
    triggerOnFocus: true,
    debounce: 300,
    minKeywordLength: 0,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  select: [value: string];
}>();

const open = ref(false);
const keyword = ref(props.modelValue ?? '');

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open,
});

const asyncSuggest = useAsyncSuggest<string>({
  fetch: async (word) => (props.fetch ? props.fetch(word) : []),
  debounce: props.debounce,
  minKeywordLength: props.minKeywordLength,
});

/** 静态候选本地过滤（包含匹配，大小写不敏感） */
const localSuggestions = computed(() => {
  const word = keyword.value.trim().toLowerCase();
  if (!word) return props.options;
  return props.options.filter((option) => option.toLowerCase().includes(word));
});

const suggestions = computed(() =>
  props.fetch ? asyncSuggest.suggestions.value : localSuggestions.value,
);
const showDropdown = computed(() => open.value && suggestions.value.length > 0);

const nav = useListboxNavigation({
  count: () => suggestions.value.length,
  onSelect: (index) => {
    const option = suggestions.value[index];
    if (option !== undefined) pick(option);
  },
});

function dispatch(value: string) {
  emit('update:modelValue', value);
  emit('change', value);
}

function request(word: string) {
  if (props.fetch) asyncSuggest.setKeyword(word);
}

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  keyword.value = value;
  dispatch(value);
  open.value = true;
  request(value);
}

function onFocus(event: Event) {
  open.value = props.triggerOnFocus;
  if (props.triggerOnFocus) request((event.target as HTMLInputElement).value);
}

function onBlur() {
  open.value = false;
}

function pick(option: string) {
  keyword.value = option;
  dispatch(option);
  emit('select', option);
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (!showDropdown.value) return;
  if (event.key === 'Escape') {
    open.value = false;
    return;
  }
  nav.onKeydown(event);
}

defineExpose({ focus: () => referenceRef.value?.focus() });
</script>

<template>
  <div class="cumquat-autocomplete">
    <input
      ref="referenceRef"
      :value="keyword"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="cumquat-autocomplete__input"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <Transition name="cumquat-fade">
      <ul
        v-if="showDropdown"
        ref="floatingRef"
        class="cumquat-autocomplete__dropdown"
        :style="floatingStyles"
      >
        <li
          v-for="(option, index) in suggestions"
          :key="option"
          class="cumquat-autocomplete__option"
          :class="nav.activeIndex.value === index ? 'cumquat-autocomplete__option--active' : ''"
          @mousedown.prevent="pick(option)"
          @mouseenter="nav.setActiveIndex(index)"
        >
          <slot
            name="option"
            :option="option"
            :index="index"
            :active="nav.activeIndex.value === index"
          >
            {{ option }}
          </slot>
        </li>
      </ul>
    </Transition>
  </div>
</template>
