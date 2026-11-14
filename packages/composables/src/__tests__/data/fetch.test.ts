import { reactive, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { isPagedResult, normalizeFetchResult } from '@cumquat/core';
import type { FetchHandler } from '@cumquat/core';
import { useFetchResource } from '../../index';
import { flushTimers, mockFetch, withScope } from '../helpers';

const tick = () => flushTimers(0);

describe('fetch 结果归一化', () => {
  it('数组 → 列表（total 取长度）', () => {
    const result = normalizeFetchResult([1, 2, 3]);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.total).toBe(3);
  });

  it('{ list, page, size, total } → 分页结果', () => {
    const result = normalizeFetchResult({ list: [{ id: 1 }], page: 2, size: 10, total: 58 });
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.total).toBe(58);
    expect(result.page).toBe(2);
    expect(result.size).toBe(10);
    expect(isPagedResult({ list: [], total: 0 })).toBe(true);
    expect(isPagedResult({ list: [], total: '0' })).toBe(false);
    expect(isPagedResult([])).toBe(false);
  });

  it('其他值 → 单值', () => {
    const result = normalizeFetchResult(87);
    expect(result.data).toBe(87);
    expect(result.total).toBeUndefined();
  });
});

describe('useFetchResource', () => {
  it('无源时 enabled=false 且 state 为 undefined（回退本地数据）', async () => {
    const source = ref<FetchHandler<number> | undefined>(undefined);
    const ctx = withScope(() =>
      useFetchResource<number[]>(source, { getQuery: () => ({}), initialData: [] }),
    );
    await tick();
    expect(ctx.enabled.value).toBe(false);
    expect(ctx.state.value).toBeUndefined();
    ctx.$stop();
  });

  it('挂载即请求：数组结果与分页结果均归一，total 回填', async () => {
    const paged = mockFetch<UserRow>(async () => ({
      list: [{ id: 1, name: 'a' }],
      total: 42,
    }));
    const ctx = withScope(() =>
      useFetchResource<UserRow[]>(() => paged, {
        getQuery: () => ({ page: 1, size: 10 }),
        initialData: [],
      }),
    );
    await tick();
    expect(ctx.enabled.value).toBe(true);
    expect(ctx.state.value?.status).toBe('success');
    expect(ctx.state.value?.data).toEqual([{ id: 1, name: 'a' }]);
    expect(ctx.total.value).toBe(42);
    expect(paged.queries[0]).toMatchObject({ page: 1, size: 10 });
    ctx.$stop();
  });

  it('getQuery deep 变化自动重取并注入最新查询', async () => {
    const page = ref(1);
    const fetcher = mockFetch<number>(async ({ page: requested = 1 }) => requested);
    const ctx = withScope(() =>
      useFetchResource<number>(() => fetcher, {
        getQuery: () => ({ page: page.value, size: 10 }),
        initialData: 0,
      }),
    );
    await tick();
    page.value = 2;
    await tick();
    expect(fetcher.queries.length).toBe(2);
    expect(fetcher.queries[1]?.page).toBe(2);
    expect(ctx.state.value?.data).toBe(2);
    ctx.$stop();
  });

  it('reactive 查询对象原地更新自动重取', async () => {
    const query = reactive({ page: 1, size: 10 });
    const fetcher = mockFetch<number>(async ({ page: requested = 1 }) => requested);
    const ctx = withScope(() =>
      useFetchResource<number>(() => fetcher, {
        getQuery: () => query,
        initialData: 0,
      }),
    );
    await tick();
    query.page = 2;
    await tick();
    expect(fetcher.queries.length).toBe(2);
    expect(fetcher.queries[1]?.page).toBe(2);
    expect(ctx.state.value?.data).toBe(2);
    ctx.$stop();
  });

  it('失败进入 error 状态并携带错误对象，retry 以最近查询重发', async () => {
    const fetcher = mockFetch<number>((query) => {
      if (fetcher.queries.length === 1) throw new Error('网络错误');
      expect(query.keyword).toBe('柠');
      return 99;
    });
    const ctx = withScope(() =>
      useFetchResource<number>(() => fetcher, {
        getQuery: () => ({ keyword: '柠' }),
        initialData: 0,
      }),
    );
    await tick();
    expect(ctx.state.value?.status).toBe('error');
    expect((ctx.state.value?.error as Error).message).toBe('网络错误');

    ctx.state.value?.retry?.();
    await tick();
    expect(fetcher.queries.length).toBe(2);
    expect(fetcher.queries[1]?.keyword).toBe('柠');
    expect(ctx.state.value?.status).toBe('success');
    expect(ctx.state.value?.data).toBe(99);
    ctx.$stop();
  });

  it('防抖：debounce 内多次变化只发最后一次请求', async () => {
    const keyword = ref('');
    const fetcher = mockFetch<string>(async ({ keyword: word }) => word ?? '');
    const ctx = withScope(() =>
      useFetchResource<string[]>(() => fetcher, {
        getQuery: () => ({ keyword: keyword.value }),
        initialData: [],
        debounce: 50,
      }),
    );
    await tick();
    // 挂载首次立即请求
    expect(fetcher.queries.length).toBe(1);
    keyword.value = 'a';
    await tick();
    keyword.value = 'ab';
    await tick();
    await flushTimers(70);
    expect(fetcher.queries.length).toBe(2);
    expect(fetcher.queries[1]?.keyword).toBe('ab');
    ctx.$stop();
  });

  it('merge 累积模式：翻页拼接，回到第 1 页清空重置', async () => {
    const page = ref(1);
    const fetcher = mockFetch<number>(async ({ page: requested = 1 }) =>
      Array.from({ length: 2 }, (_, index) => (requested - 1) * 2 + index + 1),
    );
    const ctx = withScope(() =>
      useFetchResource<number[]>(() => fetcher, {
        getQuery: () => ({ page: page.value, size: 2 }),
        initialData: [] as number[],
        merge: (previous, next) => [...previous, ...next],
      }),
    );
    await tick();
    page.value = 2;
    await tick();
    expect(ctx.state.value?.data).toEqual([1, 2, 3, 4]);

    page.value = 1;
    await tick();
    expect(ctx.state.value?.data).toEqual([1, 2]);
    ctx.$stop();
  });

  it('refresh 支持查询片段覆盖（懒加载场景）', async () => {
    const fetcher = mockFetch<string>(async ({ filters }) =>
      filters?.parentKey ? `child:${String(filters.parentKey)}` : 'root',
    );
    const ctx = withScope(() =>
      useFetchResource<string>(() => fetcher, { getQuery: () => ({}), initialData: '' }),
    );
    await tick();
    expect(ctx.state.value?.data).toBe('root');
    await ctx.refresh({ filters: { parentKey: 'n1' } });
    expect(fetcher.queries.at(-1)?.filters).toEqual({ parentKey: 'n1' });
    expect(ctx.state.value?.data).toBe('child:n1');
    ctx.$stop();
  });

  it('源切换时重新绑定并 abort 旧资源，源移除后回退本地', async () => {
    const first = mockFetch<number>(async () => 1);
    const second = mockFetch<number>(async () => 2);
    const source = ref<FetchHandler<number> | undefined>(first);
    const ctx = withScope(() =>
      useFetchResource<number>(source, { getQuery: () => ({}), initialData: 0 }),
    );
    await tick();
    expect(ctx.state.value?.data).toBe(1);

    source.value = second;
    await tick();
    expect(first.abortCount).toBe(1);
    expect(ctx.state.value?.data).toBe(2);

    source.value = undefined;
    await tick();
    expect(second.abortCount).toBe(1);
    expect(ctx.enabled.value).toBe(false);
    expect(ctx.state.value).toBeUndefined();
    ctx.$stop();
  });

  it('作用域销毁时 abort 当前资源', async () => {
    const fetcher = mockFetch<number>(async () => 1);
    const ctx = withScope(() =>
      useFetchResource<number>(() => fetcher, { getQuery: () => ({}), initialData: 0 }),
    );
    await tick();
    expect(fetcher.abortCount).toBe(0);
    ctx.$stop();
    expect(fetcher.abortCount).toBe(1);
  });
});

interface UserRow {
  id: number;
  name: string;
}
