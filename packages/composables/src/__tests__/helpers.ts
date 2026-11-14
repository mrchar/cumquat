import { effectScope, ref } from 'vue';
import type {
  FetchData,
  FetchHandler,
  FetchQuery,
  FetchResult,
  ResolvedFetchQuery,
  Status,
} from '@cumquat/core';

/** 在 effectScope 中运行组合函数，返回结果与停止函数 */
export function withScope<T>(factory: () => T): T & { $stop: () => void } {
  const scope = effectScope(true);
  const result = (scope.run(factory) ?? {}) as T & { $stop: () => void };
  result.$stop = () => scope.stop();
  return result;
}

/** 测试用 fetch 工厂：附带每次 execute 的查询记录与 abort 计数 */
export interface MockFetch<T> extends FetchHandler<T> {
  /** 每次 execute 收到的查询，按调用顺序记录 */
  queries: ResolvedFetchQuery[];
  /** abort 被调用的次数 */
  abortCount: number;
}

/** 测试用分页信封：page / size 可省略，execute 时以本次查询参数补齐 */
export type MockPaged<T> = { list: T[]; total: number; page?: number; size?: number };

/** 把测试返回值补齐为完整分页信封（缺失的 page / size 取查询参数） */
function normalizeMock<T>(raw: T[] | MockPaged<T> | T, query: ResolvedFetchQuery): FetchData<T> {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as MockPaged<T>).list)) {
    const paged = raw as MockPaged<T>;
    return {
      list: paged.list,
      page: paged.page ?? query.page ?? 1,
      size: paged.size ?? query.size ?? paged.list.length,
      total: paged.total,
    };
  }
  return raw as T;
}

/**
 * 把 (query) => data 的一次性函数包装为符合协议的 FetchHandler 工厂：
 * 每次绑定创建一个带 Ref 信封的资源对象，execute 驱动实现并记录查询，
 * 实现抛错时资源进入 error 状态（不 reject），与真实协议一致。
 */
export function mockFetch<T>(
  implementation: (
    query: ResolvedFetchQuery,
  ) => T[] | MockPaged<T> | T | Promise<T[] | MockPaged<T> | T>,
): MockFetch<T> {
  const queries: ResolvedFetchQuery[] = [];
  const stats = { abortCount: 0 };
  const factory = ((_initial: FetchQuery): FetchResult<T> => {
    const status = ref<Status>('idle');
    const data = ref<FetchData<T> | undefined>(undefined);
    const error = ref<unknown>(undefined);
    const message = ref<string | undefined>(undefined);
    return {
      status,
      data,
      error,
      message,
      async execute(query: ResolvedFetchQuery) {
        queries.push(query);
        status.value = 'pending';
        try {
          data.value = normalizeMock(await implementation(query), query);
          status.value = 'success';
        } catch (err) {
          error.value = err;
          message.value = err instanceof Error ? err.message : String(err);
          status.value = 'error';
        }
      },
      abort() {
        stats.abortCount += 1;
      },
    };
  }) as MockFetch<T>;
  factory.queries = queries;
  Object.defineProperty(factory, 'abortCount', {
    enumerable: true,
    get: () => stats.abortCount,
  });
  return factory;
}

export function flushTimers(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function advanceTimers(ms: number): void {
  vi.useFakeTimers();
  vi.advanceTimersByTime(ms);
  vi.useRealTimers();
}
