import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useControllableModel } from '../core/useControllableModel';

export type PaginationPageItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface UsePaginationOptions {
  /** 当前页（受控） */
  currentPage?: number;
  defaultCurrentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (size: number) => void;
  /** 总条数，默认 0 */
  total?: number;
  /** 每页条数候选 */
  pageSizes?: number[];
  /** 当前页两侧始终展示的兄弟页数，默认 1 */
  siblingCount?: number;
  /** 首尾始终展示的页数，默认 1 */
  boundaryCount?: number;
  /** 页码或页大小变化统一回调（组件据此组装 change 事件参数） */
  onChange?: (payload: { currentPage: number; pageSize: number }) => void;
}

export interface UsePaginationReturn {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  totalPages: Ref<number>;
  pageSizes: number[];
  /** 含省略号占位的页码序列 */
  pages: Ref<PaginationPageItem[]>;
  isFirst: Ref<boolean>;
  isLast: Ref<boolean>;
  canPrev: Ref<boolean>;
  canNext: Ref<boolean>;
  /** 起始条目序号（用于"第 x-y 条"展示） */
  rangeStart: Ref<number>;
  rangeEnd: Ref<number>;
  go: (page: number) => void;
  prev: () => void;
  next: () => void;
  setPageSize: (size: number) => void;
}

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

/**
 * 分页模型：当前页 / 页大小、总页数、含省略号的页码序列、跳页与边界约束。
 * 组件自身不发请求，go/setPageSize 只负责状态与 onChange 通知。
 *
 * @internal 消费组件：Pagination；Table 内联复用；宿主列表可独立使用
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    currentPage,
    defaultCurrentPage = 1,
    onPageChange,
    pageSize: pageSizeProp,
    defaultPageSize = 10,
    onPageSizeChange,
    total: totalProp = 0,
    pageSizes = [10, 20, 50, 100],
    siblingCount = 1,
    boundaryCount = 1,
    onChange,
  } = options;

  const total = ref(totalProp);

  const pageModel = useControllableModel<number>({
    modelValue: currentPage,
    defaultValue: defaultCurrentPage,
    fallback: 1,
    onChange: (page) => {
      onPageChange?.(page);
      onChange?.({ currentPage: page, pageSize: sizeModel.value.value });
    },
  });
  const currentPageRef = pageModel.value;

  const sizeModel = useControllableModel<number>({
    modelValue: pageSizeProp,
    defaultValue: defaultPageSize,
    fallback: 10,
    onChange: (size) => {
      onPageSizeChange?.(size);
      onChange?.({ currentPage: currentPageRef.value, pageSize: size });
    },
  });
  const pageSize = sizeModel.value;

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

  // 总页数收缩后，当前页越界时自动回退到最后一页
  watch(totalPages, (lastPage) => {
    if (currentPageRef.value > lastPage) {
      currentPageRef.value = lastPage;
    }
  });

  const pages = computed<PaginationPageItem[]>(() => {
    const lastPage = totalPages.value;
    // 无需省略号：总页数不多时直接展开
    const totalShown = boundaryCount * 2 + siblingCount * 2 + 3; /* 首尾+当前+2省略号 */
    if (lastPage <= totalShown) return range(1, lastPage);

    const current = currentPageRef.value;
    // 三个锚点分组：头部边界、当前页±兄弟页、尾部边界
    const groups: Array<[number, number, PaginationPageItem]> = [
      [1, boundaryCount, 'start-ellipsis'],
      [
        Math.max(boundaryCount + 1, current - siblingCount),
        Math.min(lastPage - boundaryCount, current + siblingCount),
        'start-ellipsis',
      ],
      [lastPage - boundaryCount + 1, lastPage, 'end-ellipsis'],
    ];

    const result: PaginationPageItem[] = [];
    let prevEnd = 0;
    groups.forEach(([start, end, token], groupIndex) => {
      if (start > end) return;
      if (prevEnd > 0) {
        const gap = start - prevEnd;
        if (gap === 1) {
          // 相邻直接接上
        } else if (gap === 2) {
          result.push(prevEnd + 1);
        } else {
          // 头部与中段之间用 start-ellipsis，中段与尾部之间用 end-ellipsis
          result.push(groupIndex === groups.length - 1 ? 'end-ellipsis' : token);
        }
      }
      result.push(...range(start, end));
      prevEnd = end;
    });
    return result;
  });

  const isFirst = computed(() => currentPageRef.value <= 1);
  const isLast = computed(() => currentPageRef.value >= totalPages.value);
  const canPrev = computed(() => !isFirst.value);
  const canNext = computed(() => !isLast.value);

  const rangeStart = computed(() =>
    total.value === 0 ? 0 : (currentPageRef.value - 1) * pageSize.value + 1,
  );
  const rangeEnd = computed(() => Math.min(total.value, currentPageRef.value * pageSize.value));

  const go = (page: number) => {
    const target = Math.min(Math.max(1, Math.trunc(page)), totalPages.value);
    if (target === currentPageRef.value) return;
    currentPageRef.value = target;
  };

  const prev = () => go(currentPageRef.value - 1);
  const next = () => go(currentPageRef.value + 1);

  const setPageSize = (size: number) => {
    if (size === pageSize.value) return;
    pageSize.value = size;
    go(1);
  };

  return {
    currentPage: currentPageRef,
    pageSize,
    total,
    totalPages,
    pageSizes,
    pages,
    isFirst,
    isLast,
    canPrev,
    canNext,
    rangeStart,
    rangeEnd,
    go,
    prev,
    next,
    setPageSize,
  };
}
