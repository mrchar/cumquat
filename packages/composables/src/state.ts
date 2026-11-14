import type { Status } from '@cumquat/core';

/**
 * 组合函数输出的异步快照：composables 自有的状态形状。
 * 不放在 core 中，也不作为组件 props 的唯一定义——组件按自身需要描述数据态。
 */
export type Snapshot<T, E = unknown> = (
  | { status: 'idle'; data?: T }
  | { status: 'pending'; data?: T }
  | { status: 'success'; data: T }
  | { status: 'error'; data?: T; error: E }
) & {
  /** 失败重试入口 */
  retry?: () => void;
};
