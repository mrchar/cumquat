<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  isPagedResult,
  useAsyncSuggest,
  useFloating,
  useListboxNavigation,
  useSubscribe,
} from '@cumquat/composables';
import type { Fetch, FetchResult, SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    /** 静态候选（本地包含匹配） */
    options?: string[];
    /**
     * 异步候选源。统一签名：(query: { keyword, signal }) => Promise。
     * 返回数组 / { list, total } 作为候选；兼容旧的 (keyword: string) => Promise<string[]>。
     */
    fetch?: Fetch<string> | ((keyword: string) => Promise<string[]>);
    /**
     * 订阅数据：挂载时调用，resolve 出的候选列表用于本地包含匹配。
     * 优先级：subscribe > fetch > options
     */
    subscribe?: SubscribeHandler<string[]>;
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
    subscribe: undefined,
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

/** 浮层宽度跟随触发器：inline width 在浮层首帧渲染前写入，
 *  避免 fixed 浮层以视口基准的 100% 宽度参与 shift 定位而贴到屏幕左缘 */
const dropdownWidth = ref(0);
watch(open, (next) => {
  if (next) dropdownWidth.value = referenceRef.value?.getBoundingClientRect().width ?? 0;
});
const dropdownStyle = computed(() => ({
  ...floatingStyles.value,
  width: dropdownWidth.value ? `${dropdownWidth.value}px` : undefined,
}));

/** 归一 fetch 返回：数组直出，分页取 list，单值包成单元素数组 */
function toSuggestions(raw: FetchResult<string>): string[] {
  if (Array.isArray(raw)) return raw;
  if (isPagedResult<string>(raw)) return raw.list;
  return [raw];
}

/**
 * 调用桥接：统一 fetch 收到查询对象；旧签名收到字符串。
 * 以 String 包装对象承载 keyword——字符串方法（trim/includes 等）依旧可用。
 */
function callSource(word: string): Promise<string[]> {
  if (!props.fetch) return Promise.resolve([]);
  const query = Object(word) as string & { keyword?: string };
  query.keyword = word;
  return Promise.resolve(
    (props.fetch as (arg: unknown) => Promise<FetchResult<string>>)(query),
  ).then(toSuggestions);
}

const asyncSuggest = useAsyncSuggest<string>({
  fetch: (word) => callSource(word),
  debounce: props.debounce,
  minKeywordLength: props.minKeywordLength,
});

/** 静态候选本地过滤（包含匹配，大小写不敏感） */
const localSuggestions = computed(() => {
  const word = keyword.value.trim().toLowerCase();
  if (!word) return props.options;
  return props.options.filter((option) => option.toLowerCase().includes(word));
});

/* ---------------- subscribe：订阅型候选（本地包含匹配） ---------------- */
const { state: subState } = useSubscribe<string[]>(() => props.subscribe);

const subscribeSuggestions = computed(() => {
  const list = subState.value.data ?? [];
  const word = keyword.value.trim().toLowerCase();
  if (!word) return list;
  return list.filter((option) => option.toLowerCase().includes(word));
});

const suggestions = computed(() => {
  if (props.subscribe) return subscribeSuggestions.value;
  return props.fetch ? asyncSuggest.suggestions.value : localSuggestions.value;
});
const loading = computed(() => {
  if (props.subscribe) return subState.value.status === 'pending';
  return props.fetch ? asyncSuggest.loading.value : false;
});
const loadError = computed(() => {
  if (props.subscribe) return subState.value.status === 'error' ? subState.value.error : undefined;
  return props.fetch ? asyncSuggest.error.value : undefined;
});
const showDropdown = computed(() => {
  if (!open.value) return false;
  // 订阅候选：有匹配项 / 加载中 / 失败时展示
  if (props.subscribe) return suggestions.value.length > 0 || loading.value || !!loadError.value;
  // 静态候选：仅有匹配项时展示
  if (!props.fetch) return suggestions.value.length > 0;
  // 异步候选：发起过请求即展示四态（加载/错误/空态/候选）
  return asyncSuggest.status.value !== 'idle';
});

function retryRemote() {
  if (props.subscribe) subState.value.retry?.();
  else asyncSuggest.run();
}

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
        :style="dropdownStyle"
      >
        <template v-if="suggestions.length">
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
        </template>
        <li v-else-if="loading" class="cumquat-autocomplete__state cq-state--pending">加载中…</li>
        <li v-else-if="loadError" class="cumquat-autocomplete__state cq-state--error">
          加载失败
          <button
            type="button"
            class="cumquat-autocomplete__retry"
            @mousedown.prevent="retryRemote"
          >
            重试
          </button>
        </li>
        <li v-else class="cumquat-autocomplete__state">无匹配项</li>
      </ul>
    </Transition>
  </div>
</template>
