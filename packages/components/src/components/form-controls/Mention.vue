<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
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
    /** 本地候选成员；与 fetch 二选一 */
    members?: string[];
    /**
     * 异步候选源（输入触发符后的片段作为关键词）。
     * 统一签名 (query: { keyword, signal })，兼容旧的 (keyword: string)。
     */
    fetch?: Fetch<string> | ((keyword: string) => Promise<string[]>);
    /**
     * 订阅数据：挂载时调用，resolve 出的成员列表用于本地包含匹配。
     * 优先级：subscribe > fetch > members
     */
    subscribe?: SubscribeHandler<string[]>;
    /** 触发符，默认 @ */
    trigger?: string;
    placeholder?: string;
    modelValue?: string;
    debounce?: number;
  }>(),
  {
    members: () => ['Amber', 'Bolt', 'Cedar', 'Dawn'],
    fetch: undefined,
    subscribe: undefined,
    trigger: '@',
    placeholder: '输入 @ 唤起提及',
    modelValue: undefined,
    debounce: 300,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [member: string];
}>();

/** 文本值：受控 prop 不回写时内部保留 */
const text = ref(props.modelValue ?? '');

function syncText(value: string) {
  text.value = value;
  emit('update:modelValue', value);
}

/* ---------- 激活区间 ---------- */
const inputRef = ref<HTMLInputElement | null>(null);
/** 触发符位置与片段 */
const activeStart = ref(-1);
const activeQuery = ref('');
const open = ref(false);

/** 找到光标前最近的触发符，且其后没有空白 */
function detectTrigger() {
  const input = inputRef.value;
  const value = text.value;
  const caret = input?.selectionStart ?? value.length;
  const before = value.slice(0, caret);
  const at = before.lastIndexOf(props.trigger);
  if (at < 0) return null;
  const segment = before.slice(at + props.trigger.length);
  if (/\s/.test(segment)) return null;
  return { at, segment };
}

/** 归一 fetch 返回：数组直出，分页取 list，单值包成单元素数组 */
function toSuggestions(raw: FetchResult<string>): string[] {
  if (Array.isArray(raw)) return raw;
  if (isPagedResult<string>(raw)) return raw.list;
  return [raw];
}

/** String 包装对象桥接统一查询对象与旧的字符串关键词签名 */
function callSource(word: string): Promise<string[]> {
  if (!props.fetch) return Promise.resolve(localSuggestions.value);
  const query = Object(word) as string & { keyword?: string };
  query.keyword = word;
  return Promise.resolve(
    (props.fetch as (arg: unknown) => Promise<FetchResult<string>>)(query),
  ).then(toSuggestions);
}

const asyncSuggest = useAsyncSuggest<string>({
  fetch: (keyword) => callSource(keyword),
  debounce: props.debounce,
});

const localSuggestions = computed(() => {
  const word = activeQuery.value.toLowerCase();
  return props.members.filter((m) => m.toLowerCase().includes(word.toLowerCase()));
});

/* ---------------- subscribe：订阅型候选（本地包含匹配） ---------------- */
const { state: subState } = useSubscribe<string[]>(() => props.subscribe);

const subscribeSuggestions = computed(() => {
  const list = subState.value.data ?? [];
  const word = activeQuery.value.toLowerCase();
  return list.filter((m) => m.toLowerCase().includes(word));
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

function retryRemote() {
  if (props.subscribe) subState.value.retry?.();
  else asyncSuggest.run();
}

function refresh() {
  const hit = detectTrigger();
  if (!hit) {
    open.value = false;
    activeStart.value = -1;
    activeQuery.value = '';
    return;
  }
  activeStart.value = hit.at;
  activeQuery.value = hit.segment;
  open.value = true;
  if (props.fetch) asyncSuggest.setKeyword(hit.segment);
}

function onInput(event: Event) {
  syncText((event.target as HTMLInputElement).value);
  refresh();
}

/* ---------- 浮层定位 ---------- */
const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  open,
});

function bindReference(el: Element | { $el?: unknown }) {
  referenceRef.value = (el as HTMLElement) ?? null;
}

/* ---------- 键盘选择 ---------- */
const nav = useListboxNavigation({
  count: computed(() => (open.value ? suggestions.value.length : 0)),
  onSelect: (index) => pick(suggestions.value[index]),
});

function pick(member: string | undefined) {
  if (!member) return;
  const input = inputRef.value;
  const caret = input?.selectionStart ?? text.value.length;
  const before = text.value.slice(0, activeStart.value);
  const after = text.value.slice(caret);
  const inserted = `${before}${props.trigger}${member} ${after}`;
  syncText(inserted);
  emit('select', member);
  open.value = false;
  activeStart.value = -1;
  activeQuery.value = '';
  nav.reset();
  const nextCaret = (before + props.trigger + member + ' ').length;
  void nextTick(() => input?.setSelectionRange(nextCaret, nextCaret));
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return;
  if (event.key === 'Escape') {
    open.value = false;
    return;
  }
  if (
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp' ||
    event.key === 'Enter' ||
    event.key === 'Tab'
  ) {
    if (suggestions.value.length > 0) {
      event.preventDefault();
      nav.onKeydown(event);
    }
  }
}
</script>

<template>
  <div :ref="bindReference" class="cumquat-mention">
    <input
      ref="inputRef"
      :value="text"
      type="text"
      :placeholder="placeholder"
      class="cumquat-mention__input"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      @input="onInput"
      @keydown="onKeydown"
      @blur="open = false"
    />
    <Transition name="cumquat-fade">
      <ul
        v-if="open && (suggestions.length > 0 || loading || loadError)"
        ref="floatingRef"
        class="cumquat-mention__dropdown"
        :style="floatingStyles"
      >
        <li v-if="loading" class="cumquat-mention__loading cq-state--pending">加载中…</li>
        <li v-else-if="loadError" class="cumquat-mention__error cq-state--error">
          加载失败
          <button type="button" class="cumquat-mention__retry" @mousedown.prevent="retryRemote">
            重试
          </button>
        </li>
        <li
          v-for="(member, index) in suggestions"
          :key="member"
          class="cumquat-mention__option"
          :class="index === nav.activeIndex.value ? 'cumquat-mention__option--active' : ''"
          @mousedown.prevent="pick(member)"
          @mouseenter="nav.setActiveIndex(index)"
        >
          <span class="cumquat-mention__at">@</span>{{ member }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
