import { ref } from 'vue';
import type { Ref } from 'vue';
import { useTimeoutFn } from './useTimeoutFn';

export interface TypeaheadOptions {
  /** 获取当前可匹配的选项标签列表 */
  getLabels: () => string[];
  /** 命中选项时的回调（参数为索引） */
  onMatch?: (index: number) => void;
  /** 起始搜索索引（通常为当前激活项） */
  startIndex?: () => number;
  /** 输入重置间隔，默认 500ms */
  resetDelay?: number;
  /** 是否循环匹配，默认 true */
  loop?: boolean;
}

export interface TypeaheadReturn {
  /** 当前累计的搜索串 */
  query: Ref<string>;
  /** 绑定到列表容器的键盘处理器（字符键触发匹配） */
  onKeydown: (event: KeyboardEvent) => void;
  reset: () => void;
}

/**
 * 键盘输入匹配选项：在重置间隔内连续输入字符组成搜索串，
 * 按前缀匹配选项标签并跳转，单字符重复按时序循环匹配。
 *
 * @internal 消费组件：Select、Menu、Tree
 */
export function useTypeahead(options: TypeaheadOptions): TypeaheadReturn {
  const { getLabels, onMatch, resetDelay = 500, loop = true } = options;
  // 默认从上次命中项继续，使连续输入从下一项开始轮询
  const startIndex = options.startIndex ?? (() => lastMatchIndex);

  const query = ref('');
  let lastKeyTime = 0;
  let lastMatchIndex = -1;

  const timer = useTimeoutFn(() => reset());

  function reset() {
    query.value = '';
    lastMatchIndex = -1;
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    const labels = getLabels();
    if (labels.length === 0) return;

    const now = Date.now();
    if (now - lastKeyTime > resetDelay) reset();
    lastKeyTime = now;

    const char = event.key.toLowerCase();
    const isRepeatSingle = query.value.length === 1 && query.value === char;
    query.value = isRepeatSingle ? char : query.value + char;
    const keyword = query.value.toLowerCase();

    let matched = -1;
    if (isRepeatSingle) {
      for (let step = 1; step <= labels.length; step += 1) {
        const idx = (lastMatchIndex + step) % labels.length;
        if (!loop && idx <= lastMatchIndex) break;
        if (labels[idx].toLowerCase().startsWith(char)) {
          matched = idx;
          break;
        }
      }
    } else {
      const start = startIndex();
      for (let step = 0; step < labels.length; step += 1) {
        const idx = (start + 1 + step) % labels.length;
        if (labels[idx].toLowerCase().startsWith(keyword)) {
          matched = idx;
          break;
        }
      }
    }

    timer.start();
    if (matched !== -1) {
      lastMatchIndex = matched;
      onMatch?.(matched);
    }
  };

  return { query, onKeydown, reset };
}
