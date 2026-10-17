import { ref } from 'vue';
import type { Ref } from 'vue';
import { useTimeoutFn } from '../core/useTimeoutFn';

export type SuggestStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncSuggestOptions<S> {
  /** 异步建议源：输入关键词返回候选列表 */
  fetch: (keyword: string) => Promise<S[]>;
  /** 防抖时长，默认 300ms */
  debounce?: number;
  /** 挂载后是否立即以空关键词请求一次，默认 false */
  immediate?: boolean;
  /** 触发请求的最小关键词长度，默认 0 */
  minKeywordLength?: number;
  onSuccess?: (suggestions: S[], keyword: string) => void;
  onError?: (error: unknown) => void;
}

export interface UseAsyncSuggestReturn<S> {
  suggestions: Ref<S[]>;
  status: Ref<SuggestStatus>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  keyword: Ref<string>;
  /** 更新关键词并按防抖触发请求（过短则清空建议） */
  setKeyword: (keyword: string) => void;
  /** 立即以指定关键词（默认当前关键词）请求 */
  run: (keyword?: string) => Promise<void>;
  clear: () => void;
}

/**
 * 输入防抖 → 调用异步建议源 → loading/空态管理。
 * 竞态请求以最后一次为准，旧响应被丢弃。
 *
 * @internal 消费组件：AutoComplete、Mention
 */
export function useAsyncSuggest<S>(options: UseAsyncSuggestOptions<S>): UseAsyncSuggestReturn<S> {
  const {
    fetch,
    debounce = 300,
    immediate = false,
    minKeywordLength = 0,
    onSuccess,
    onError,
  } = options;

  const suggestions = ref<S[]>([]) as Ref<S[]>;
  const status = ref<SuggestStatus>('idle');
  const loading = ref(false);
  const error = ref<unknown>(undefined);
  const keyword = ref('');
  let requestId = 0;

  const run = async (nextKeyword = keyword.value) => {
    const currentId = ++requestId;
    status.value = 'pending';
    loading.value = true;
    error.value = undefined;
    try {
      const result = await fetch(nextKeyword);
      if (currentId !== requestId) return;
      suggestions.value = result;
      status.value = 'success';
      onSuccess?.(result, nextKeyword);
    } catch (err) {
      if (currentId !== requestId) return;
      error.value = err;
      status.value = 'error';
      onError?.(err);
    } finally {
      if (currentId === requestId) loading.value = false;
    }
  };

  const timer = useTimeoutFn(() => {
    if (keyword.value.length < minKeywordLength) {
      suggestions.value = [];
      status.value = 'idle';
      return;
    }
    void run();
  });

  const setKeyword = (next: string) => {
    keyword.value = next;
    if (next.length < minKeywordLength) {
      timer.stop();
      suggestions.value = [];
      status.value = 'idle';
      return;
    }
    timer.start(debounce);
  };

  const clear = () => {
    timer.stop();
    keyword.value = '';
    suggestions.value = [];
    status.value = 'idle';
    error.value = undefined;
  };

  if (immediate) void run('');

  return {
    suggestions,
    status,
    loading,
    error,
    keyword,
    setKeyword,
    run,
    clear,
  };
}
