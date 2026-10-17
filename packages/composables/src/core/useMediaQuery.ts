import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient, tryOnScopeDispose } from '../internal/dom';
import type { MaybeRefOrGetter } from 'vue';
import { toValue, watch } from 'vue';

/**
 * 订阅 CSS 媒体查询结果。SSR 环境下恒为 false。
 * 查询串支持响应式引用，变化时自动重新订阅。
 *
 * @internal 消费组件：Layout、Grid；断点语义由宿主基于本函数自行封装
 */
export function useMediaQuery(query: MaybeRefOrGetter<string>): Ref<boolean> {
  const matches = ref(false);
  let mql: MediaQueryList | undefined;

  const apply = (queryString: string) => {
    if (!isClient || typeof window.matchMedia !== 'function') {
      matches.value = false;
      return;
    }
    mql?.removeEventListener('change', onChange);
    mql = window.matchMedia(queryString);
    matches.value = mql.matches;
    mql.addEventListener('change', onChange);
  };

  const onChange = (ev: MediaQueryListEvent) => {
    matches.value = ev.matches;
  };

  watch(() => toValue(query), apply, { immediate: true });

  tryOnScopeDispose(() => mql?.removeEventListener('change', onChange));
  return matches;
}
