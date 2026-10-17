import { computed, ref } from 'vue';
import type { Ref } from 'vue';

export interface LoadingService {
  /** 计数大于 0 即视为加载中（多请求自动合并） */
  loading: Ref<boolean>;
  count: Ref<number>;
  /** 开始一次加载，返回结束函数 */
  start: () => () => void;
  /** 结束一次加载 */
  finish: () => void;
  /** 包裹异步任务：开始 → 任务结束（成功或失败）自动结束 */
  wrap: <T>(task: Promise<T>) => Promise<T>;
  clear: () => void;
}

/** 创建一套隔离的计数式加载服务 */
export function createLoadingService(): LoadingService {
  const count = ref(0);
  const loading = computed(() => count.value > 0);

  const finish = () => {
    count.value = Math.max(0, count.value - 1);
  };

  const start = () => {
    count.value += 1;
    return finish;
  };

  const wrap = async <T>(task: Promise<T>): Promise<T> => {
    count.value += 1;
    try {
      return await task;
    } finally {
      finish();
    }
  };

  const clear = () => {
    count.value = 0;
  };

  return { loading, count, start, finish, wrap, clear };
}

// 全局默认单例：Loading 组件与宿主共享同一计数
const globalService = createLoadingService();

/**
 * 局部 / 全屏加载的计数式服务（多请求合并显示一个加载态）。
 * 需要隔离实例时使用 createLoadingService。
 *
 * @internal 消费组件：Loading
 */
export function useLoadingService(): LoadingService {
  return globalService;
}
