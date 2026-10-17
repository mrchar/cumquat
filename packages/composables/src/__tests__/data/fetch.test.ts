import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import {
  createFetchController,
  isPagedResult,
  normalizeFetchResult,
  useFetch,
  useFetchResource,
} from '../../index';
import type { Fetch } from '../../index';
import { flushTimers, withScope } from '../helpers';

const tick = () => flushTimers(0);

describe('fetch 结果归一化', () => {
  it('数组 → 列表（total 取长度）', () => {
    const result = normalizeFetchResult([1, 2, 3]);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.total).toBe(3);
  });

  it('{ list, total } → 分页结果', () => {
    const result = normalizeFetchResult({ list: [{ id: 1 }], total: 58 });
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.total).toBe(58);
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

describe('createFetchController', () => {
  it('三态流转、注入查询与 signal，保留最近查询供 refresh', async () => {
    const fetcher = vi.fn<Fetch<number>>((query) =>
      Promise.resolve(query.pagination?.currentPage ?? -1),
    );
    const controller = createFetchController(fetcher);

    expect(controller.state.value.status).toBe('pending');
    const result = await controller.run({ pagination: { currentPage: 3, pageSize: 20 } });
    expect(result?.data).toBe(3);
    expect(fetcher.mock.calls[0][0].pagination).toEqual({ currentPage: 3, pageSize: 20 });
    expect(fetcher.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
    expect(controller.state.value.status).toBe('success');
    expect(controller.loading.value).toBe(false);

    await controller.refresh();
    expect(fetcher.mock.calls[1][0].pagination).toEqual({ currentPage: 3, pageSize: 20 });
  });

  it('竞态以后到为准，过期响应不覆盖最新数据', async () => {
    let resolveFirst: (value: number) => void = () => {};
    const fetcher = vi
      .fn<Fetch<number>>()
      .mockImplementationOnce(() => new Promise<number>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(() => Promise.resolve(2));
    const controller = createFetchController(fetcher);

    const first = controller.run({ keyword: 'a' });
    const second = controller.run({ keyword: 'b' });
    resolveFirst(1);
    await Promise.all([first, second]);
    // 第一次请求虽先发起，但返回时已过期，最终数据为第二次结果
    expect(controller.state.value.data?.data).toBe(2);
    expect(controller.state.value.status).toBe('success');
  });

  it('失败进入 error 状态并携带错误，retry 重发最近查询', async () => {
    const fetcher = vi
      .fn<Fetch<number>>()
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce(99);
    const controller = createFetchController(fetcher);

    const failed = await controller.run({ keyword: '柠' });
    expect(failed).toBeUndefined();
    expect(controller.state.value.status).toBe('error');
    expect((controller.state.value.error as Error).message).toBe('网络错误');

    await controller.refresh();
    expect(fetcher.mock.calls.length).toBe(2);
    expect(fetcher.mock.calls[1][0].keyword).toBe('柠');
    expect(controller.state.value.status).toBe('success');
    expect(controller.state.value.data?.data).toBe(99);
  });
});

describe('useFetch', () => {
  it('导出 fetch/status/data/error/total/refresh，组件内外共享状态', async () => {
    const fetcher = vi.fn<Fetch<UserRow>>(async () => ({
      list: [{ id: 1, name: '柠' }],
      total: 1,
    }));
    const resource = withScope(() => useFetch(fetcher));

    const raw = await resource.fetch({ pagination: { currentPage: 1, pageSize: 10 } });
    expect(raw).toEqual({ list: [{ id: 1, name: '柠' }], total: 1 });
    expect(resource.status.value).toBe('success');
    expect(resource.data.value).toEqual([{ id: 1, name: '柠' }]);
    expect(resource.total.value).toBe(1);
    expect(resource.loading.value).toBe(false);

    await resource.refresh();
    expect(fetcher.mock.calls.length).toBe(2);
    resource.$stop();
  });
});

describe('useFetchResource', () => {
  it('无源时 enabled=false 且 state 为 undefined（回退本地数据）', async () => {
    const source = ref<Fetch<number> | undefined>(undefined);
    const ctx = withScope(() =>
      useFetchResource<number[]>(source, { getQuery: () => ({}), initialData: [] }),
    );
    await tick();
    expect(ctx.enabled.value).toBe(false);
    expect(ctx.state.value).toBeUndefined();
    ctx.$stop();
  });

  it('挂载即请求：数组结果与分页结果均归一，total 回填', async () => {
    const paged: Fetch<UserRow> = vi.fn(async () => ({
      list: [{ id: 1, name: 'a' }],
      total: 42,
    }));
    const ctx = withScope(() =>
      useFetchResource<UserRow[]>(() => paged, {
        getQuery: () => ({ pagination: { currentPage: 1, pageSize: 10 } }),
        initialData: [],
      }),
    );
    await tick();
    expect(ctx.enabled.value).toBe(true);
    expect(ctx.state.value?.status).toBe('success');
    expect(ctx.state.value?.data).toEqual([{ id: 1, name: 'a' }]);
    expect(ctx.total.value).toBe(42);
    ctx.$stop();
  });

  it('getQuery deep 变化自动重取并注入最新查询', async () => {
    const page = ref(1);
    const fetcher = vi.fn<Fetch<number>>(async ({ pagination }) => pagination?.currentPage ?? 1);
    const ctx = withScope(() =>
      useFetchResource<number>(() => fetcher, {
        getQuery: () => ({ pagination: { currentPage: page.value, pageSize: 10 } }),
        initialData: 0,
      }),
    );
    await tick();
    page.value = 2;
    await tick();
    expect(fetcher.mock.calls.length).toBe(2);
    expect(fetcher.mock.calls[1][0].pagination?.currentPage).toBe(2);
    expect(ctx.state.value?.data).toBe(2);
    ctx.$stop();
  });

  it('失败进入 error 状态并携带错误对象，retry 以最近查询重发', async () => {
    const fetcher = vi
      .fn<Fetch<number>>()
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce(99);
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
    expect(fetcher.mock.calls.length).toBe(2);
    expect(fetcher.mock.calls[1][0].keyword).toBe('柠');
    expect(ctx.state.value?.status).toBe('success');
    expect(ctx.state.value?.data).toBe(99);
    ctx.$stop();
  });

  it('防抖：debounce 内多次变化只发最后一次请求', async () => {
    const keyword = ref('');
    const fetcher = vi.fn<Fetch<string>>(async ({ keyword: word }) => word ?? '');
    const ctx = withScope(() =>
      useFetchResource<string[]>(() => fetcher, {
        getQuery: () => ({ keyword: keyword.value }),
        initialData: [],
        debounce: 50,
      }),
    );
    await tick();
    // 挂载首次立即请求
    expect(fetcher.mock.calls.length).toBe(1);
    keyword.value = 'a';
    await tick();
    keyword.value = 'ab';
    await tick();
    await flushTimers(70);
    expect(fetcher.mock.calls.length).toBe(2);
    expect(fetcher.mock.calls[1][0].keyword).toBe('ab');
    ctx.$stop();
  });

  it('merge 累积模式：翻页拼接，回到第 1 页清空重置', async () => {
    const page = ref(1);
    const fetcher = vi.fn<Fetch<number>>(async ({ pagination }) =>
      Array.from({ length: 2 }, (_, index) => ((pagination?.currentPage ?? 1) - 1) * 2 + index + 1),
    );
    const ctx = withScope(() =>
      useFetchResource<number[]>(() => fetcher, {
        getQuery: () => ({ pagination: { currentPage: page.value, pageSize: 2 } }),
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
    const fetcher = vi.fn<Fetch<string>>(async ({ filters }) =>
      filters?.parentKey ? `child:${String(filters.parentKey)}` : 'root',
    );
    const ctx = withScope(() =>
      useFetchResource<string>(() => fetcher, { getQuery: () => ({}), initialData: '' }),
    );
    await tick();
    expect(ctx.state.value?.data).toBe('root');
    await ctx.refresh({ filters: { parentKey: 'n1' } });
    expect(fetcher.mock.calls.at(-1)?.[0].filters).toEqual({ parentKey: 'n1' });
    expect(ctx.state.value?.data).toBe('child:n1');
    ctx.$stop();
  });

  it('接收 useFetch 返回对象时复用同一控制器，状态内外同步', async () => {
    const fetcher = vi.fn<Fetch<number>>().mockResolvedValue(7);
    const shared = withScope(() => useFetch(fetcher));
    const ctx = withScope(() =>
      useFetchResource<number>(shared, { getQuery: () => ({}), initialData: 0 }),
    );
    await tick();
    expect(shared.state.value.status).toBe('success');
    expect(shared.data.value).toBe(7);
    expect(ctx.state.value?.data).toBe(7);
    expect(fetcher.mock.calls.length).toBe(1);
    shared.$stop();
    ctx.$stop();
  });

  it('源切换时重新绑定并请求，源移除后回退本地', async () => {
    const first = vi.fn<Fetch<number>>().mockResolvedValue(1);
    const second = vi.fn<Fetch<number>>().mockResolvedValue(2);
    const source = ref<Fetch<number> | undefined>(first);
    const ctx = withScope(() =>
      useFetchResource<number>(source, { getQuery: () => ({}), initialData: 0 }),
    );
    await tick();
    expect(ctx.state.value?.data).toBe(1);

    source.value = second;
    await tick();
    expect(ctx.state.value?.data).toBe(2);

    source.value = undefined;
    await tick();
    expect(ctx.enabled.value).toBe(false);
    expect(ctx.state.value).toBeUndefined();
    ctx.$stop();
  });
});

interface UserRow {
  id: number;
  name: string;
}
