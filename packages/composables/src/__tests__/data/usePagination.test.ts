import { describe, expect, it, vi } from 'vitest';
import { usePagination } from '../../index';
import { withScope } from '../helpers';

describe('usePagination', () => {
  it('总页数与条目区间', () => {
    const ctx = withScope(() =>
      usePagination({ total: 95, defaultPageSize: 10, defaultCurrentPage: 2 }),
    );
    expect(ctx.totalPages.value).toBe(10);
    expect(ctx.rangeStart.value).toBe(11);
    expect(ctx.rangeEnd.value).toBe(20);
    ctx.next();
    expect(ctx.currentPage.value).toBe(3);
    expect(ctx.rangeStart.value).toBe(21);
  });

  it('最后一页区间不超过 total，total=0 时从 0 开始', () => {
    const ctx = withScope(() => usePagination({ total: 95, defaultCurrentPage: 10 }));
    expect(ctx.rangeEnd.value).toBe(95);
    expect(ctx.isLast.value).toBe(true);
    expect(ctx.canNext.value).toBe(false);

    const empty = withScope(() => usePagination({ total: 0 }));
    expect(empty.rangeStart.value).toBe(0);
    expect(empty.rangeEnd.value).toBe(0);
    expect(empty.totalPages.value).toBe(1);
  });

  it('go 钳制 1~总页数，相同页不触发回调', () => {
    const onChange = vi.fn();
    const ctx = withScope(() => usePagination({ total: 50, onChange }));
    ctx.go(99);
    expect(ctx.currentPage.value).toBe(5);
    ctx.go(0);
    expect(ctx.currentPage.value).toBe(1);
    const calls = onChange.mock.calls.length;
    ctx.go(1);
    expect(onChange.mock.calls.length).toBe(calls);
  });

  it('短序列不出现省略号', () => {
    const ctx = withScope(() => usePagination({ total: 50 }));
    expect(ctx.pages.value).toEqual([1, 2, 3, 4, 5]);
  });

  it('长序列：首段仅首尾+当前时单侧省略号', () => {
    // boundary=1 sibling=1，第 2 页：1 2 3 … 10
    const early = withScope(() => usePagination({ total: 100, defaultCurrentPage: 2 }));
    expect(early.pages.value).toEqual([1, 2, 3, 'end-ellipsis', 10]);

    // 第 9 页：1 … 8 9 10（无尾省略号，有头省略号）
    const late = withScope(() => usePagination({ total: 100, defaultCurrentPage: 9 }));
    expect(late.pages.value).toEqual([1, 'start-ellipsis', 8, 9, 10]);
  });

  it('长序列中段：双侧省略号', () => {
    const ctx = withScope(() => usePagination({ total: 100, defaultCurrentPage: 5 }));
    expect(ctx.pages.value).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 10]);
  });

  it('setPageSize 回到第一页并发出变化', () => {
    const onChange = vi.fn();
    const ctx = withScope(() =>
      usePagination({
        total: 100,
        defaultCurrentPage: 5,
        pageSizes: [10, 20],
        onChange,
      }),
    );
    ctx.setPageSize(20);
    expect(ctx.pageSize.value).toBe(20);
    expect(ctx.currentPage.value).toBe(1);
    expect(onChange).toHaveBeenCalledWith({ currentPage: 1, pageSize: 20 });
  });

  it('总页数收缩后当前页自动回退', async () => {
    const ctx = withScope(() => usePagination({ total: 100, defaultCurrentPage: 8 }));
    ctx.total.value = 30;
    await vi.waitFor(() => expect(ctx.currentPage.value).toBe(3));
  });
});
