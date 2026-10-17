import { ref, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';
import { useIntersectionObserver } from '../core/useIntersectionObserver';
import type { MaybeElement } from '../internal/dom';

export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseImageStateOptions {
  /** 是否懒加载（元素进入视口才发起加载），默认 false */
  lazy?: boolean;
  /** 懒加载时被观测的图片元素（组件绑定 img 外层引用） */
  target?: MaybeElement<HTMLElement>;
  /** IntersectionObserver 的根元素，默认视口 */
  root?: MaybeElement<HTMLElement>;
  rootMargin?: string;
  onLoad?: (event: Event) => void;
  onError?: (event: Event) => void;
}

export interface UseImageStateReturn {
  status: Ref<ImageLoadStatus>;
  isLoading: Ref<boolean>;
  isLoaded: Ref<boolean>;
  isError: Ref<boolean>;
  /** 绑定到 <img> 的 load 事件 */
  onLoad: (event: Event) => void;
  /** 绑定到 <img> 的 error 事件 */
  onError: (event: Event) => void;
  /** 手动重新加载（重置后需由 img 重新触发 src 设置） */
  reload: () => void;
  /** 是否应当渲染真实 img（懒加载未触发前为 false） */
  shouldLoad: Ref<boolean>;
}

/**
 * 图片加载状态机：loading / loaded / error，可选视口感知懒加载。
 * 不创建 DOM，组件把返回的事件绑定到 <img> 即可。
 *
 * @internal 消费组件：Image、Avatar
 */
export function useImageState(
  src: MaybeRefOrGetter<string | undefined>,
  options: UseImageStateOptions = {},
): UseImageStateReturn {
  const { lazy = false, target, root, rootMargin, onLoad, onError } = options;

  const status = ref<ImageLoadStatus>('idle');
  const shouldLoad = ref(!lazy);

  if (lazy && target) {
    const { isIntersecting } = useIntersectionObserver(target, {
      root,
      rootMargin,
      once: true,
    });
    watch(isIntersecting, (visible) => {
      if (visible) shouldLoad.value = true;
    });
  } else if (lazy) {
    // 未提供观测目标时不阻塞加载
    shouldLoad.value = true;
  }

  const isLoading = ref(false);
  const isLoaded = ref(false);
  const isError = ref(false);

  const setStatus = (next: ImageLoadStatus) => {
    status.value = next;
    isLoading.value = next === 'loading';
    isLoaded.value = next === 'loaded';
    isError.value = next === 'error';
  };

  watch(
    () => [toValue(src), shouldLoad.value] as const,
    ([nextSrc, allowed]) => {
      if (!allowed || !nextSrc) {
        setStatus(nextSrc ? 'loading' : 'idle');
        return;
      }
      setStatus('loading');
    },
    { immediate: true },
  );

  const handleLoad = (event: Event) => {
    setStatus('loaded');
    onLoad?.(event);
  };

  const handleError = (event: Event) => {
    setStatus('error');
    onError?.(event);
  };

  const reload = () => {
    setStatus('loading');
  };

  return {
    status,
    isLoading,
    isLoaded,
    isError,
    onLoad: handleLoad,
    onError: handleError,
    reload,
    shouldLoad,
  };
}
